/**
 * Seeded pseudo-random generator for the simulation (ADR 0002).
 *
 * Every source of randomness in `src/sim` draws from an `Rng` instance so that a
 * Run is fully determined by its seed. A generator is a value: its whole state is
 * one 32-bit integer, exposed via `state` / `Rng.fromState` for save and replay.
 *
 * Algorithm: mulberry32 — a small, fast, well-distributed 32-bit PRNG.
 */
export class Rng {
  private s: number;

  constructor(seed: number) {
    // Fold to a 32-bit integer; distinct seeds stay distinct.
    this.s = seed | 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Next integer in [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}
