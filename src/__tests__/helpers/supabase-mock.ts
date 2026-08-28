import { vi } from "vitest";

type MockResponse = {
  data: unknown;
  error: null | {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  count?: number;
};

interface MockQuery {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  head: ReturnType<typeof vi.fn>;
}

export function createMockSupabaseClient(responses: MockResponse[] = []) {
  const queue = [...responses];
  const calls: { method: string; args: unknown[] }[] = [];

  function dequeue(): MockResponse {
    return queue.shift() ?? { data: null, error: null };
  }

  function createChain(): MockQuery {
    const chain: MockQuery = {
      select: vi.fn((...args: unknown[]) => {
        calls.push({ method: "select", args });
        return chain;
      }),
      insert: vi.fn((...args: unknown[]) => {
        calls.push({ method: "insert", args });
        return chain;
      }),
      update: vi.fn((...args: unknown[]) => {
        calls.push({ method: "update", args });
        return chain;
      }),
      order: vi.fn((...args: unknown[]) => {
        calls.push({ method: "order", args });
        return chain;
      }),
      eq: vi.fn((...args: unknown[]) => {
        calls.push({ method: "eq", args });
        return chain;
      }),
      in: vi.fn((...args: unknown[]) => {
        calls.push({ method: "in", args });
        return chain;
      }),
      limit: vi.fn((...args: unknown[]) => {
        calls.push({ method: "limit", args });
        return chain;
      }),
      single: vi.fn(() => Promise.resolve(dequeue())),
      maybeSingle: vi.fn(() => Promise.resolve(dequeue())),
      head: vi.fn(() => Promise.resolve(dequeue())),
    };

    // Make the chain thenable (so `await supabase.from(...)` works)
    Object.defineProperty(chain, "then", {
      value: (resolve: (v: MockResponse) => void) => resolve(dequeue()),
      writable: false,
    });

    return chain;
  }

  const from = vi.fn(() => createChain());

  const supabase = {
    from,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@test.com" } },
        error: null,
      }),
    },
    __calls: calls,
    __queue: queue,
  };

  return supabase;
}
