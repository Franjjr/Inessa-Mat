/* Tiny music-theory helpers shared by the SFX recipes and the generative music. */

/** MIDI note number → frequency in Hz (A4 = 69 = 440 Hz). */
export function mtof(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Frequency ratio for a shift in cents. */
export function cents(c: number): number {
  return Math.pow(2, c / 1200)
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

/** Named notes used by the SFX recipes (all within C major / A minor pentatonic-friendly pitches). */
export const N = {
  G3: 55, A3: 57, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71,
  C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83,
  C6: 84, D6: 86, E6: 88, G6: 91, A6: 93, B6: 95,
  C7: 96, D7: 98, E7: 100, G7: 103, A7: 105, C8: 108,
} as const

export const PENTA_MAJOR = [0, 2, 4, 7, 9]
export const PENTA_MINOR = [0, 3, 5, 7, 10]

/** All MIDI notes of a scale (offsets from root) between lo and hi inclusive. */
export function scaleNotes(root: number, scale: number[], lo: number, hi: number): number[] {
  const out: number[] = []
  for (let base = root - 48; base <= hi; base += 12) {
    for (const s of scale) {
      const n = base + s
      if (n >= lo && n <= hi) out.push(n)
    }
  }
  return out.sort((a, b) => a - b)
}

/** Random element (rng in [0,1)). */
export function pick<T>(arr: readonly T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}

/** Uniform random in [a, b). */
export function rand(a: number, b: number, rng: () => number = Math.random): number {
  return a + (b - a) * rng()
}
