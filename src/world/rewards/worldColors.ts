/* World colours as literal hex values (SVG attributes such as the crystal fill cannot read CSS variables).
   Mirrors the --wN tokens in src/styles/tokens.css. */
const WORLD_HEX: Record<string, string> = {
  w1: '#15803d', w2: '#2563eb', w3: '#dc2626', w4: '#0e7490',
  w5: '#7c3aed', w6: '#c026d3', w7: '#ea580c', w8: '#a16207',
}

export function worldHex(worldId: string): string {
  return WORLD_HEX[worldId] ?? '#7c3aed'
}
