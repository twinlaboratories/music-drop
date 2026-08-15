"use client";

import { useCallback, useEffect, useState } from "react";
import { EVENT } from "@/config/event";

type Step = "loading" | "form" | "confirmed" | "closed";

type RsvpRecord = {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
};

function formatLineup(): string {
  return EVENT.lineup.map((name) => `  ${name}`).join("\n");
}

export default function RsvpSite() {
  const [step, setStep] = useState<Step>("loading");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rsvp, setRsvp] = useState<RsvpRecord | null>(null);
  const [full, setFull] = useState(false);

  const refreshStatus = useCallback(async () => {
    const res = await fetch("/api/rsvp/status");
    if (!res.ok) {
      setStep("form");
      return;
    }
    const data = await res.json();
    setFull(Boolean(data.full));
    if (!data.open) setStep("closed");
    else setStep((current) => (current === "confirmed" ? current : "form"));
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not RSVP.");
        if (data.error === "RSVPs are closed." || data.error === "RSVPs are full.") {
          setStep("closed");
          setFull(data.error === "RSVPs are full.");
        }
        return;
      }
      setRsvp(data.rsvp);
      setStep("confirmed");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="paper-site">
      <header className="paper-header">
        <img
          src="/logos/asianpaper-rsvp.png"
          alt="asianpaper"
          className="paper-logo"
        />
        <p className="paper-date">{EVENT.date}</p>
      </header>

      {step === "loading" && <p className="paper-muted">...</p>}

      {step === "confirmed" && rsvp && (
        <section>
          <p className="paper-stamp">ON THE LIST</p>
          <pre className="paper-text">{`${rsvp.fullName.toUpperCase()}

${EVENT.entry}
${EVENT.time}

${EVENT.venue}
${EVENT.address}

LINEUP:
${formatLineup()}`}</pre>
        </section>
      )}

      {step === "closed" && (
        <section>
          <p className="paper-stamp">{full ? "FULL" : "CLOSED"}</p>
          <pre className="paper-text">
            {full ? "CAPACITY REACHED.\nNO MORE RSVPS." : "RSVPS ARE CLOSED.\nCHECK BACK LATER."}
          </pre>
        </section>
      )}

      {step === "form" && (
        <section>
          <form onSubmit={handleSubmit} className="paper-form">
            <label className="paper-label" htmlFor="fullName">
              FULL NAME
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
              className="paper-input"
              placeholder="FIRST LAST"
            />
            <label className="paper-label" htmlFor="phone">
              MOBILE
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
              className="paper-input"
              placeholder="07XXX XXXXXX"
            />
            {error && <p className="paper-error">{error}</p>}
            <button type="submit" disabled={loading} className="paper-btn">
              {loading ? "..." : "RSVP"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
