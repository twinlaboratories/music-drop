"use client";

import { useCallback, useEffect, useState } from "react";
import AsciiLogo from "../components/AsciiLogo";

type RsvpRow = {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
};

type AdminData = {
  status: { open: boolean; full: boolean; count: number; capacity: number };
  settings: { open: boolean; capacity: number };
  rsvps: RsvpRow[];
};

export default function AdminPanel() {
  const [key, setKey] = useState("");
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [capacityInput, setCapacityInput] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("key");
    const fromStorage = sessionStorage.getItem("adminKey");
    const initial = fromUrl || fromStorage;
    if (initial) {
      setStoredKey(initial);
      setKey(initial);
    }
  }, []);

  const fetchData = useCallback(async (secret: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/rsvps", {
        headers: { "x-admin-secret": secret },
      });
      if (!res.ok) {
        setError("Invalid access key.");
        setData(null);
        sessionStorage.removeItem("adminKey");
        setStoredKey(null);
        return;
      }
      const json = (await res.json()) as AdminData;
      setData(json);
      setCapacityInput(String(json.settings.capacity));
      sessionStorage.setItem("adminKey", secret);
      setStoredKey(secret);
    } catch {
      setError("Could not load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storedKey) fetchData(storedKey);
  }, [storedKey, fetchData]);

  async function toggleOpen(open: boolean) {
    if (!storedKey) return;
    setError("");
    const res = await fetch("/api/admin/rsvps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": storedKey,
      },
      body: JSON.stringify({ open }),
    });
    if (!res.ok) {
      setError("Could not update RSVP status.");
      return;
    }
    await fetchData(storedKey);
  }

  async function updateCapacity(e: React.FormEvent) {
    e.preventDefault();
    if (!storedKey) return;
    const capacity = Number(capacityInput);
    if (!Number.isFinite(capacity) || capacity < 1) {
      setError("Capacity must be a number greater than 0.");
      return;
    }
    setError("");
    const res = await fetch("/api/admin/rsvps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": storedKey,
      },
      body: JSON.stringify({ capacity: Math.floor(capacity) }),
    });
    if (!res.ok) {
      setError("Could not update capacity.");
      return;
    }
    await fetchData(storedKey);
  }

  async function copyShareLink() {
    if (!storedKey) return;
    const url = `${window.location.origin}/admin?key=${encodeURIComponent(storedKey)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Share this URL: " + url);
    }
  }

  return (
    <div className="paper-site paper-site--admin">
      <header className="paper-header">
        <AsciiLogo />
        <p className="paper-date">RSVP ADMIN</p>
      </header>

      {!storedKey && (
        <form
          className="paper-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (key.trim()) setStoredKey(key.trim());
          }}
        >
          <label className="paper-label" htmlFor="adminKey">
            ACCESS KEY
          </label>
          <input
            id="adminKey"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="paper-input"
            autoComplete="off"
          />
          {error && <p className="paper-error">{error}</p>}
          <button type="submit" className="paper-btn">
            ENTER
          </button>
        </form>
      )}

      {storedKey && (
        <>
          {loading && !data && <p className="paper-muted">LOADING...</p>}
          {error && <p className="paper-error">{error}</p>}

          {data && (
            <>
              <pre className="paper-text">{`COUNT     ${data.status.count}
CAPACITY  ${data.settings.capacity}
STATUS    ${!data.settings.open ? "CLOSED" : data.status.full ? "FULL" : "OPEN"}`}</pre>

              <div className="paper-actions">
                <button
                  type="button"
                  className="paper-btn"
                  onClick={() => toggleOpen(!data.settings.open)}
                >
                  {data.settings.open ? "CLOSE RSVPS" : "OPEN RSVPS"}
                </button>
                <button type="button" className="paper-btn paper-btn--ghost" onClick={() => fetchData(storedKey)}>
                  REFRESH
                </button>
                <button type="button" className="paper-btn paper-btn--ghost" onClick={copyShareLink}>
                  {copied ? "COPIED" : "COPY SHARE LINK"}
                </button>
              </div>

              <form className="paper-form paper-form--inline" onSubmit={updateCapacity}>
                <label className="paper-label" htmlFor="capacity">
                  SET CAPACITY
                </label>
                <div className="paper-inline-row">
                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min={1}
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(e.target.value)}
                    className="paper-input paper-input--short"
                  />
                  <button type="submit" className="paper-btn">
                    SET
                  </button>
                </div>
              </form>

              <p className="paper-label">GUEST LIST</p>
              {data.rsvps.length === 0 ? (
                <p className="paper-muted">(empty)</p>
              ) : (
                <ul className="paper-list">
                  {data.rsvps.map((r, i) => (
                    <li key={r.id}>
                      <span className="paper-list-n">{i + 1}</span>
                      <span className="paper-list-name">{r.fullName.toUpperCase()}</span>
                      <span className="paper-list-phone">{r.phone}</span>
                      <span className="paper-list-time">
                        {new Date(r.createdAt).toLocaleString("en-GB", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <button
            type="button"
            className="paper-link"
            onClick={() => {
              sessionStorage.removeItem("adminKey");
              setStoredKey(null);
              setData(null);
            }}
          >
            LOG OUT
          </button>
        </>
      )}
    </div>
  );
}
