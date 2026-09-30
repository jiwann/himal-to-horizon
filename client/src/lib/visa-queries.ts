// Query definitions shared between a Visa Intelligence page and the
// sub-nav that prefetches it, so a prefetched result is reused as-is.
export const difficultyQuery = {
  queryKey: ["/api/visa/NP/difficulty"],
  queryFn: async (): Promise<unknown[]> => {
    const r = await fetch("/api/visa/NP/difficulty");
    if (!r.ok) throw new Error(`Failed to load difficulty ranking (${r.status})`);
    return r.json();
  },
};
