/** Normalize to E.164-ish UK format. Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  if (digits.startsWith("44") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+44${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("7")) return `+44${digits}`;

  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;

  return null;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

export function validateFullName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 80) return null;
  if (!/^[\p{L}\p{M}'.\- ]+$/u.test(trimmed)) return null;
  return trimmed;
}
