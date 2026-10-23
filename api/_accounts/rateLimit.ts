/**
 * Fixed-window attempt counter, per key (an IP address or an email). In memory, so on serverless it is
 * per warm instance: a speed bump against guessing, with the database's own auth limits behind it.
 */
export class RateLimiter {
  private hits = new Map<string, { n: number; until: number }>();
  constructor(
    private max: number,
    private windowMs: number,
    private now: () => number = Date.now,
  ) {}

  /** Counts one attempt; false once the key is over the limit for this window. */
  take(key: string): boolean {
    const t = this.now();
    const h = this.hits.get(key);
    if (!h || h.until <= t) {
      if (this.hits.size > 5000) this.hits.clear();
      this.hits.set(key, { n: 1, until: t + this.windowMs });
      return true;
    }
    h.n++;
    return h.n <= this.max;
  }
}
