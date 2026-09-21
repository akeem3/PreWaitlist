"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";

interface Waitlist {
  id: string;
  headline: string | null;
  product_name: string | null;
  subdomain: string;
  is_archived: boolean | null;
  subscriberCount: number;
}

interface WaitlistListClientProps {
  waitlists: Waitlist[];
}

export default function WaitlistListClient({
  waitlists,
}: WaitlistListClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    ids: string[];
    names: string[];
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(ids: string[]) {
    setDeleting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitlist_ids: ids }),
      });
      if (res.ok) {
        setSelected((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
        setConfirmDelete(null);
        setOpenMenu(null);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  function getNames(ids: string[]) {
    return ids
      .map(
        (id) =>
          waitlists.find((w) => w.id === id)?.headline ||
          waitlists.find((w) => w.id === id)?.product_name ||
          "Untitled"
      )
      .slice(0, 3);
  }

  if (waitlists.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-12">
        <Breadcrumb />
        <div className="mb-8">
          <h1 className="text-h3 font-semibold text-foreground">
            Waitlist Settings
          </h1>
          <p className="mt-1 text-body text-muted-foreground">
            Select a waitlist to configure.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            className="mb-4 text-muted-foreground"
          >
            <rect
              x="4"
              y="6"
              width="24"
              height="20"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M4 12H28" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12 18H20"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M12 22H16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="mb-1 text-body-lg font-medium text-foreground">
            No waitlists yet
          </h2>
          <p className="mb-4 text-body-sm text-muted-foreground">
            Create your first waitlist to get started.
          </p>
          <Link
            href="/onboarding/1"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-body-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Create waitlist
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Breadcrumb />
      <div className="mb-8">
        <h1 className="text-h3 font-semibold text-foreground">
          Waitlist Settings
        </h1>
        <p className="mt-1 text-body text-muted-foreground">
          Select a waitlist to configure.
        </p>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <span className="text-body-sm text-foreground">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() =>
              setConfirmDelete({
                ids: Array.from(selected),
                names: getNames(Array.from(selected)),
              })
            }
            className="ml-auto rounded-lg bg-destructive px-3 py-1.5 text-body-sm font-medium text-white transition-colors hover:bg-destructive/90"
          >
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded-lg px-3 py-1.5 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="space-y-3">
        {waitlists.map((wl) => (
          <div
            key={wl.id}
            className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/30"
          >
            <input
              type="checkbox"
              checked={selected.has(wl.id)}
              onChange={() => toggleSelect(wl.id)}
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-border text-accent accent-accent"
            />
            <Link
              href={`/dashboard/${wl.id}/settings`}
              className="flex flex-1 min-w-0 items-center gap-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect
                    x="2"
                    y="3"
                    width="16"
                    height="14"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M2 7H18" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-body-lg font-medium text-foreground">
                    {wl.headline || wl.product_name || "Untitled waitlist"}
                  </h2>
                  {wl.is_archived && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Archived
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-body-sm text-muted-foreground">
                  {wl.subdomain}.prewaitlist.com · {wl.subscriberCount}{" "}
                  subscriber
                  {wl.subscriberCount !== 1 ? "s" : ""}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu(openMenu === wl.id ? null : wl.id);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <circle cx="8" cy="3" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                </svg>
              </button>
              {openMenu === wl.id && (
                <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-border bg-card py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmDelete({
                        ids: [wl.id],
                        names: [
                          wl.headline || wl.product_name || "Untitled waitlist",
                        ],
                      });
                      setOpenMenu(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-destructive transition-colors hover:bg-destructive/5"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 4H11.5M5 4V3C5 2.44772 5.44772 2 6 2H8C8.55228 2 9 2.44772 9 3V4M3.5 4L4.2 11.5C4.25 12.0523 4.69772 12.5 5.25 12.5H8.75C9.30228 12.5 9.75 12.0523 9.8 11.5L10.5 4"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Delete waitlist
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-2 text-h4 font-medium text-foreground">
              Delete {confirmDelete.ids.length > 1 ? "waitlists" : "waitlist"}?
            </h2>
            <p className="mb-1 text-body-sm text-muted-foreground">
              This permanently deletes:
            </p>
            <ul className="mb-4 list-disc pl-5 text-body-sm text-foreground">
              {confirmDelete.names.map((name, i) => (
                <li key={confirmDelete.ids[i]}>{name}</li>
              ))}
              {confirmDelete.ids.length > 3 && (
                <li className="text-muted-foreground">
                  ...and {confirmDelete.ids.length - 3} more
                </li>
              )}
            </ul>
            <p className="mb-6 text-body-sm text-muted-foreground">
              All subscribers, data, and settings will be lost. This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg px-4 py-2 text-body-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete.ids)}
                disabled={deleting}
                className="rounded-lg bg-destructive px-4 py-2 text-body-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting
                  ? "Deleting…"
                  : `Delete ${confirmDelete.ids.length > 1 ? "all" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
