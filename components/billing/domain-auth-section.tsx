"use client";

import { useState, useEffect } from "react";

interface DomainInfo {
  registered: boolean;
  id?: string;
  name?: string;
  status?: string;
  records?: Array<{
    record_type: string;
    name: string;
    value: string;
    priority?: string;
    status: string;
  }>;
}

const STEPS = [
  { num: 1, label: "Add domain" },
  { num: 2, label: "Copy DNS records" },
  { num: 3, label: "Verify" },
];

export function DomainAuthSection() {
  const [domain, setDomain] = useState("");
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (fetched) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/waitlist/domains");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.registered) {
            setDomainInfo(data);
            setDomain(data.name || "");
            setStep(data.status === "verified" ? 3 : 2);
          }
        }
      } catch {
        // Not registered yet
      } finally {
        if (!cancelled) setFetched(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetched]);

  async function handleAddDomain() {
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add domain");
        return;
      }

      setDomainInfo({ registered: true, ...data });
      setStep(2);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist/domains/verify", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      setDomainInfo((prev) => (prev ? { ...prev, ...data } : prev));
      if (data.status === "verified") {
        setStep(3);
      }
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      await fetch("/api/waitlist/domains", { method: "DELETE" });
      setDomainInfo(null);
      setDomain("");
      setStep(1);
    } catch {
      // Best effort
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, recordType: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(recordType);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const isVerified = domainInfo?.status === "verified";
  const isPending = domainInfo?.registered && !isVerified;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-1 text-h4 font-medium text-foreground">
        Domain Authentication
      </h3>
      <p className="mb-4 text-body-sm text-muted-foreground">
        Set up your own sending domain for better email deliverability.
      </p>

      {/* Status indicator */}
      {domainInfo?.registered && (
        <div
          className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${
            isVerified
              ? "bg-accent/10 text-accent"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isVerified
            ? `Verified: ${domainInfo.name}`
            : `Pending: ${domainInfo.name}`}
        </div>
      )}

      {/* Step indicators */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                step >= s.num
                  ? "bg-accent text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isVerified && s.num === 3 ? "\u2713" : s.num}
            </div>
            <span
              className={`text-xs ${
                step >= s.num ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-px w-6 ${
                  step > s.num ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Add domain */}
      {step === 1 && !domainInfo?.registered && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="mail.yourdomain.com"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              if (error) setError(null);
            }}
            className="h-10 w-full rounded-[var(--input-radius)] border border-border bg-card px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
          />
          <button
            type="button"
            onClick={handleAddDomain}
            disabled={loading || !domain.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Domain"}
          </button>
        </div>
      )}

      {/* Step 2: DNS records */}
      {step === 2 && domainInfo?.records && (
        <div className="space-y-4">
          <p className="text-body-sm text-muted-foreground">
            Add these DNS records to your domain provider:
          </p>

          <div className="space-y-3">
            {domainInfo.records.map((record) => (
              <div
                key={`${record.record_type}-${record.name}`}
                className="rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    {record.record_type}
                  </span>
                  <span
                    className={`text-xs ${
                      record.status === "verified"
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
                <div className="mb-1 text-xs text-muted-foreground">
                  <span className="font-medium">Host:</span> {record.name}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <code className="flex-1 break-all text-xs text-foreground">
                    {record.value}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(record.value, record.record_type)
                    }
                    className="shrink-0 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30"
                  >
                    {copied === record.record_type ? "Copied!" : "Copy"}
                  </button>
                </div>
                {record.priority && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium">Priority:</span>{" "}
                    {record.priority}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            DNS propagation can take up to 48 hours. Come back to verify once
            records are added.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
            >
              Remove domain
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Verified */}
      {step === 3 && isVerified && (
        <div className="space-y-3">
          <p className="text-body-sm text-accent">
            Your domain is verified and ready to use.
          </p>
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
          >
            Remove domain
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
