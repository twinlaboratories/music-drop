import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { DEFAULT_RSVP_CAPACITY } from "@/config/event";
import { canUseFileStorage, getRedis } from "@/lib/redis";

export type RsvpRecord = {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
};

export type RsvpSettings = {
  open: boolean;
  capacity: number;
};

export type RsvpStatus = {
  open: boolean;
  capacity: number;
  count: number;
  full: boolean;
};

const DATA_FILE = path.join(process.cwd(), "data", "rsvps.json");
const RSVPS_KEY = "rsvp:records:v1";
const SETTINGS_KEY = "rsvp:settings:v1";
const PHONE_INDEX_PREFIX = "rsvp:phone:";

type FileStore = {
  records: RsvpRecord[];
  settings: RsvpSettings;
};

const memoryStore: FileStore = {
  records: [],
  settings: { open: true, capacity: DEFAULT_RSVP_CAPACITY },
};

function defaultSettings(): RsvpSettings {
  const capacity = Number(process.env.RSVP_CAPACITY) || DEFAULT_RSVP_CAPACITY;
  return { open: true, capacity };
}

function normalizeRecord(raw: Partial<RsvpRecord> & Pick<RsvpRecord, "id" | "fullName" | "phone" | "createdAt">): RsvpRecord {
  return {
    id: raw.id,
    fullName: raw.fullName,
    phone: raw.phone,
    createdAt: raw.createdAt,
    checkedIn: Boolean(raw.checkedIn),
    checkedInAt: raw.checkedInAt,
  };
}

function normalizeRecords(records: RsvpRecord[] | Partial<RsvpRecord>[] | null | undefined): RsvpRecord[] {
  if (!records) return [];
  return records
    .filter((r): r is Partial<RsvpRecord> & Pick<RsvpRecord, "id" | "fullName" | "phone" | "createdAt"> =>
      Boolean(r && r.id && r.fullName && r.phone && r.createdAt)
    )
    .map(normalizeRecord);
}

function normalizeSettings(raw: Partial<RsvpSettings> | null | undefined): RsvpSettings {
  const defaults = defaultSettings();
  return {
    open: raw?.open ?? defaults.open,
    capacity: raw?.capacity ?? defaults.capacity,
  };
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<FileStore>;
    return {
      records: normalizeRecords(parsed.records),
      settings: normalizeSettings(parsed.settings),
    };
  } catch {
    const initial = { records: [], settings: defaultSettings() };
    if (canUseFileStorage()) await writeFileStore(initial);
    return initial;
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  if (!canUseFileStorage()) return;
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

export type RsvpStorageSource = "redis" | "file" | "memory";

async function loadStore(): Promise<{ store: FileStore; source: RsvpStorageSource }> {
  const redis = getRedis();
  if (redis) {
    try {
      const [records, settings] = await Promise.all([
        redis.get<RsvpRecord[]>(RSVPS_KEY),
        redis.get<RsvpSettings>(SETTINGS_KEY),
      ]);
      return {
        store: {
          records: normalizeRecords(records),
          settings: normalizeSettings(settings),
        },
        source: "redis",
      };
    } catch (error) {
      console.error("RSVP redis read failed:", error);
    }
  }

  if (canUseFileStorage()) {
    return { store: await readFileStore(), source: "file" };
  }

  return { store: memoryStore, source: "memory" };
}

async function saveStore(store: FileStore): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await Promise.all([
      redis.set(RSVPS_KEY, store.records),
      redis.set(SETTINGS_KEY, store.settings),
    ]);
    return;
  }

  if (canUseFileStorage()) {
    await writeFileStore(store);
    return;
  }

  memoryStore.records = store.records;
  memoryStore.settings = store.settings;
}

export async function getRsvpStorageSource(): Promise<RsvpStorageSource> {
  const { source } = await loadStore();
  return source;
}

export async function getRsvpStatus(): Promise<RsvpStatus> {
  const { store } = await loadStore();
  const count = store.records.length;
  const { open, capacity } = store.settings;
  const full = count >= capacity;
  return { open: open && !full, capacity, count, full };
}

export async function getRsvpSettings(): Promise<RsvpSettings> {
  const { store } = await loadStore();
  return store.settings;
}

export async function updateRsvpSettings(partial: Partial<RsvpSettings>): Promise<RsvpSettings> {
  const { store } = await loadStore();
  store.settings = normalizeSettings({ ...store.settings, ...partial });
  await saveStore(store);
  return store.settings;
}

export async function listRsvps(): Promise<RsvpRecord[]> {
  const { store } = await loadStore();
  return [...store.records].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" })
  );
}

export async function setRsvpCheckedIn(id: string, checkedIn: boolean): Promise<RsvpRecord | null> {
  const { store } = await loadStore();
  const record = store.records.find((r) => r.id === id);
  if (!record) return null;
  record.checkedIn = checkedIn;
  record.checkedInAt = checkedIn ? new Date().toISOString() : undefined;
  await saveStore(store);
  return record;
}

export async function findRsvpByPhone(phone: string): Promise<RsvpRecord | null> {
  const { store } = await loadStore();
  return store.records.find((r) => r.phone === phone) ?? null;
}

export async function createRsvp(fullName: string, phone: string): Promise<RsvpRecord> {
  const { store } = await loadStore();

  if (!store.settings.open) {
    throw new RsvpError("closed", "RSVPs are closed.");
  }
  if (store.records.length >= store.settings.capacity) {
    throw new RsvpError("full", "RSVPs are full.");
  }

  const existing = store.records.find((r) => r.phone === phone);
  if (existing) return existing;

  const record: RsvpRecord = {
    id: randomBytes(8).toString("hex"),
    fullName: fullName.trim(),
    phone,
    createdAt: new Date().toISOString(),
    checkedIn: false,
  };

  store.records.push(record);
  await saveStore(store);

  const redis = getRedis();
  if (redis) {
    await redis.set(`${PHONE_INDEX_PREFIX}${phone}`, record.id);
  }

  return record;
}

export class RsvpError extends Error {
  constructor(
    public code: "closed" | "full" | "duplicate" | "invalid",
    message: string
  ) {
    super(message);
    this.name = "RsvpError";
  }
}

export function verifyAdminSecret(provided: string | null | undefined): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  return provided === secret;
}
