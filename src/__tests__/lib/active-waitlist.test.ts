import { describe, it, expect, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";
import {
  resolveActiveWaitlistRow,
  resolveActiveWaitlist,
} from "@/lib/active-waitlist";

describe("resolveActiveWaitlistRow (server, 4.4)", () => {
  let mock: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mock = createMockSupabaseClient();
    mock.__queue.length = 0;
    mock.__calls.length = 0;
  });

  it("returns the validated ?wid row", async () => {
    mock.__queue.push({ data: { id: "wl-2" }, error: null });

    const row = await resolveActiveWaitlistRow<{ id: string }>(
      mock as never,
      "user-1",
      "wl-2"
    );

    expect(row).toMatchObject({ id: "wl-2" });
    const eqCalls = mock.__calls.filter((c) => c.method === "eq");
    expect(eqCalls.map((c) => c.args)).toContainEqual(["id", "wl-2"]);
  });

  it("falls back to newest when ?wid is invalid", async () => {
    mock.__queue.push({ data: null, error: null });
    mock.__queue.push({ data: { id: "wl-9" }, error: null });

    const row = await resolveActiveWaitlistRow<{ id: string }>(
      mock as never,
      "user-1",
      "wl-nope"
    );

    expect(row).toMatchObject({ id: "wl-9" });
    const orders = mock.__calls.filter((c) => c.method === "order");
    expect(orders).toHaveLength(1);
    expect(orders[0].args[0]).toBe("created_at");
  });

  it("returns newest with no ?wid and null with no waitlists", async () => {
    mock.__queue.push({ data: { id: "wl-9" }, error: null });
    const newest = await resolveActiveWaitlistRow<{ id: string }>(
      mock as never,
      "user-1",
      null
    );
    expect(newest).toMatchObject({ id: "wl-9" });

    mock.__queue.push({ data: null, error: null });
    const empty = await resolveActiveWaitlistRow<{ id: string }>(
      mock as never,
      "user-1",
      undefined
    );
    expect(empty).toBeNull();
  });

  it("returns the preference (cookie) row when no ?wid — beats newest", async () => {
    mock.__queue.push({ data: { id: "wl-stored" }, error: null });

    const row = await resolveActiveWaitlistRow<{ id: string }>(
      mock as never,
      "user-1",
      null,
      "id",
      "wl-stored"
    );

    expect(row).toMatchObject({ id: "wl-stored" });
    const eqCalls = mock.__calls.filter((c) => c.method === "eq");
    expect(eqCalls.map((c) => c.args)).toContainEqual(["id", "wl-stored"]);
    // Preference won — never fell through to the newest query.
    expect(mock.__calls.filter((c) => c.method === "order")).toHaveLength(0);
  });

  it("?wid outranks the preference", async () => {
    mock.__queue.push({ data: { id: "wl-wid" }, error: null });

    const row = await resolveActiveWaitlistRow<{ id: string }>(
      mock as never,
      "user-1",
      "wl-wid",
      "id",
      "wl-stored"
    );

    expect(row).toMatchObject({ id: "wl-wid" });
    const eqCalls = mock.__calls.filter((c) => c.method === "eq");
    expect(eqCalls.map((c) => c.args)).not.toContainEqual(["id", "wl-stored"]);
  });

  it("falls through an invalid/foreign preference to newest", async () => {
    mock.__queue.push({ data: null, error: null });
    mock.__queue.push({ data: { id: "wl-9" }, error: null });

    const row = await resolveActiveWaitlistRow<{ id: string }>(
      mock as never,
      "user-1",
      null,
      "id",
      "wl-foreign"
    );

    expect(row).toMatchObject({ id: "wl-9" });
    expect(mock.__calls.filter((c) => c.method === "order")).toHaveLength(1);
  });

  it("null preference runs no extra query (straight to newest)", async () => {
    mock.__queue.push({ data: { id: "wl-9" }, error: null });

    const row = await resolveActiveWaitlistRow<{ id: string }>(
      mock as never,
      "user-1",
      null,
      "id",
      null
    );

    expect(row).toMatchObject({ id: "wl-9" });
    // Only the newest lookup — no preference validation query ran.
    expect(mock.__calls.filter((c) => c.method === "select")).toHaveLength(1);
  });
});

describe("resolveActiveWaitlist (client, 4.4)", () => {
  const lists = [{ id: "wl-1" }, { id: "wl-2" }, { id: "wl-3" }];

  it("prefers ?wid, then stored, then newest", () => {
    expect(
      resolveActiveWaitlist(lists, { wid: "wl-1", storedId: "wl-2" })
    ).toMatchObject({ id: "wl-1" });
    expect(resolveActiveWaitlist(lists, { storedId: "wl-2" })).toMatchObject({
      id: "wl-2",
    });
    expect(resolveActiveWaitlist(lists)).toMatchObject({ id: "wl-3" });
  });

  it("falls through invalid ids to newest, null on empty", () => {
    expect(
      resolveActiveWaitlist(lists, { wid: "nope", storedId: "nope" })
    ).toMatchObject({ id: "wl-3" });
    expect(resolveActiveWaitlist([])).toBeNull();
  });
});
