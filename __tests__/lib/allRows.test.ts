import { allRows, PAGE_SIZE } from "@/lib/allRows";

// Fake Supabase query over `total` rows that honours range() like PostgREST.
function fakeQuery(total: number, failOnPage?: number) {
  const calls: { orders: string[]; ranges: [number, number][] } = { orders: [], ranges: [] };
  const q = {
    order(column: string) {
      calls.orders.push(column);
      return q;
    },
    range(from: number, to: number) {
      calls.ranges.push([from, to]);
      if (failOnPage !== undefined && calls.ranges.length - 1 === failOnPage) {
        return Promise.resolve({ data: null, error: { message: "boom" } });
      }
      const rows = Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => ({ id: from + i }));
      return Promise.resolve({ data: rows, error: null });
    },
  };
  return { q, calls };
}

describe("allRows", () => {
  it("returns every row past the 1,000-row cap", async () => {
    const { q, calls } = fakeQuery(1185);
    const { data, error } = await allRows(q);
    expect(error).toBeNull();
    expect(data).toHaveLength(1185);
    expect(new Set((data as { id: number }[]).map((r) => r.id)).size).toBe(1185);
    expect(calls.ranges).toEqual([[0, PAGE_SIZE - 1], [PAGE_SIZE, 2 * PAGE_SIZE - 1]]);
  });

  it("adds id as a tie-breaker sort exactly once", async () => {
    const { q, calls } = fakeQuery(2500);
    await allRows(q);
    expect(calls.orders).toEqual(["id"]);
  });

  it("makes one extra request when the total is an exact multiple of the page size", async () => {
    const { q, calls } = fakeQuery(2000);
    const { data } = await allRows(q);
    expect(data).toHaveLength(2000);
    expect(calls.ranges).toHaveLength(3);
  });

  it("handles an empty table", async () => {
    const { q } = fakeQuery(0);
    expect((await allRows(q)).data).toEqual([]);
  });

  it("passes a page error through", async () => {
    const { q } = fakeQuery(1500, 1);
    const { data, error } = await allRows(q);
    expect(error?.message).toBe("boom");
    expect(data).toBeNull();
  });
});
