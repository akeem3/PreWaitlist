"use client";

import { useState } from "react";
import { Sidebar } from "../../../../components/dashboard/sidebar";
import { createClient } from "../../../../src/lib/supabase/client";

interface Update {
  id: string;
  body: string;
  created_at: string;
}

interface UpdatesClientProps {
  updates: Update[];
  waitlistName: string | null;
  logoUrl: string | null;
}

export default function UpdatesClient({
  updates: initialUpdates,
  waitlistName,
  logoUrl,
}: UpdatesClientProps) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState(initialUpdates);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const charCount = body.length;
  const isValid = charCount >= 10 && charCount <= 2000;

  async function handlePublish() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to publish update");
        return;
      }

      setBody("");
      setSuccess(true);
      setUpdates((prev) => [
        { id: data.id, body, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error \u2014 please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/signin";
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        waitlistName={waitlistName}
        logoUrl={logoUrl}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSignOut={handleSignOut}
      />

      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 rounded-lg border border-border bg-card p-2 lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5H17M3 10H17M3 15H17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <main className="min-h-screen lg:ml-67">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <h1 className="mb-6 text-h2 text-foreground">Updates</h1>

          <div className="mb-8 rounded-[var(--card-radius)] border border-border bg-card p-5">
            <label className="mb-2 block text-label text-foreground">
              Share an update with your waitlist
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's new? Share progress, ask questions, or just say hi..."
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-sm text-foreground placeholder:text-muted-foreground resize-y"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {charCount}/2000
              </span>
              <div className="flex items-center gap-3">
                {success && (
                  <span className="text-xs text-accent">Published!</span>
                )}
                {error && (
                  <span className="text-xs text-destructive">{error}</span>
                )}
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!isValid || saving}
                  className="rounded-lg bg-accent px-4 py-2 text-body-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </div>

          {updates.length > 0 && (
            <div>
              <h2 className="mb-4 text-body-sm font-semibold text-foreground">
                Recent updates
              </h2>
              <div className="space-y-3">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className="rounded-[var(--card-radius)] border border-border bg-card p-4"
                  >
                    <p className="mb-2 text-body-sm text-foreground whitespace-pre-wrap">
                      {update.body}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {new Date(update.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
