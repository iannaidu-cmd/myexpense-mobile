// Supabase returns at most 1,000 rows per request (the project's max rows
// setting). Any list query that can grow past that must page, or rows past
// the 1,000th silently go missing: lists stop scrolling, and totals,
// exports and duplicate checks come out short.
//
// Wrap the query (not awaited) and await this instead:
//   const { data, error } = await allRows(supabase.from("expenses").select("*").eq(...));
//
// "id" is added as the last sort key so pages never overlap or skip rows
// when the main sort column has ties (many expenses share a date).

export const PAGE_SIZE = 1000;

type Pageable = {
  order: (column: string, options?: { ascending?: boolean }) => Pageable;
  range: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
};

type RowsOf<Q> = Q extends { range: (...a: never[]) => PromiseLike<{ data: infer D }> } ? D : never;

export async function allRows<Q extends Pageable>(
  query: Q,
): Promise<{ data: RowsOf<Q>; error: { message: string } | null }> {
  const ordered = query.order("id", { ascending: true });
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await ordered.range(from, from + PAGE_SIZE - 1);
    if (error) return { data: null as RowsOf<Q>, error };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { data: rows as RowsOf<Q>, error: null };
  }
}
