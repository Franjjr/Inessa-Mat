#!/usr/bin/env node
/*
  Numeria app icons (Lumi-style unicorn head on a purple → magenta background).
  Writes the SVG sources and renders the PNGs with Playwright's Chromium:

    node src/art/worlds/icons/build-icons.mjs

  Outputs:
    public/icons/icon.svg               full-bleed master (512)
    public/icons/icon-maskable.svg      content inside the 80% safe-zone circle
    public/icons/icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png (180, opaque)
    public/favicon.svg                  rounded-square, simplified strokes for 16–32 px
*/
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const out = (p) => resolve(root, p)
const INK = '#4c1d95'

function sparkle(x, y, r, fill, opacity = 1) {
  const k = r / 50
  return `<path transform="translate(${x - r} ${y - r}) scale(${k})" d="M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0 Z" fill="${fill}" opacity="${opacity}"/>`
}

function star(cx, cy, R, fill, stroke) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : R * 0.45
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${R * 0.22}" stroke-linejoin="round"/>`
}

/** Lumi's head + neck in a 200×222 box (after the printed workbook's unicorn), outline width w. */
function unicorn(w = 6) {
  const mane = [[74, 46, '#fca5a5'], [57, 68, '#fdba74'], [47, 94, '#fde68a'], [44, 122, '#86efac'], [44, 150, '#93c5fd'], [45, 178, '#a5b4fc'], [47, 206, '#d8b4fe'], [50, 234, '#f9a8d4'], [54, 262, '#fdba74']]
  const circles = mane.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="20" fill="${c}"/>`).join('')
  const neck = 'M68 128 C62 160 58 190 57 230 C56 250 56 270 56 300 L152 300 C150 270 149 250 148 230 C140 196 132 168 128 148 Z'
  return `
  <g stroke="${INK}" stroke-width="${w * 0.6}">${circles}</g>
  <path d="${neck}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>
  <ellipse cx="102" cy="100" rx="52" ry="48" fill="none" stroke="${INK}" stroke-width="${w}"/>
  <ellipse cx="140" cy="128" rx="36" ry="27" fill="none" stroke="${INK}" stroke-width="${w}"/>
  <path d="${neck}" fill="#ffffff"/>
  <ellipse cx="102" cy="100" rx="52" ry="48" fill="#ffffff"/>
  <ellipse cx="140" cy="128" rx="36" ry="27" fill="#fdf2f8"/>
  <path d="M70 68 Q62 28 92 46 Z" fill="#ffffff" stroke="${INK}" stroke-width="${w * 0.6}" stroke-linejoin="round"/>
  <path d="M74 62 Q70 38 87 48 Z" fill="#fbcfe8"/>
  <path d="M98 58 L132 4 L120 62 Z" fill="#fde68a" stroke="#b45309" stroke-width="${w * 0.6}" stroke-linejoin="round"/>
  <path d="M104 48 L124 42 M110 34 L127 28 M116 22 L129 17" stroke="#b45309" stroke-width="${w * 0.45}" stroke-linecap="round"/>
  <circle cx="88" cy="58" r="11" fill="#fca5a5" stroke="${INK}" stroke-width="${w * 0.55}"/>
  <circle cx="76" cy="66" r="10" fill="#d8b4fe" stroke="${INK}" stroke-width="${w * 0.55}"/>
  <ellipse cx="116" cy="96" rx="8" ry="10.5" fill="#3b0764"/>
  <circle cx="119" cy="91" r="3.2" fill="#ffffff"/>
  <circle cx="113" cy="101" r="1.6" fill="#ffffff"/>
  <path d="M106 83 L102 78 M111 81 L109 75 M117 81 L118 75" stroke="#3b0764" stroke-width="${w * 0.42}" stroke-linecap="round"/>
  <ellipse cx="128" cy="117" rx="9" ry="5.5" fill="#f9a8d4" opacity=".9"/>
  <ellipse cx="160" cy="122" rx="3" ry="4" fill="#be185d"/>
  <path d="M138 140 Q150 149 163 139" fill="none" stroke="${INK}" stroke-width="${w * 0.55}" stroke-linecap="round"/>`
}

function background(id, rounded) {
  const shape = rounded ? `<rect x="0" y="0" width="512" height="512" rx="112" fill="url(#${id}g)"/>` : `<rect x="0" y="0" width="512" height="512" fill="url(#${id}g)"/>`
  return `
  <defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="0.55" stop-color="#a21caf"/>
      <stop offset="1" stop-color="#db2777"/>
    </linearGradient>
    <radialGradient id="${id}h" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#f5d0fe" stop-opacity=".75"/>
      <stop offset="1" stop-color="#f5d0fe" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${shape}`
}

function iconSvg({ variant }) {
  const maskable = variant === 'maskable'
  const fav = variant === 'favicon'
  const id = variant
  // Unicorn placement: head centred. Maskable keeps the neck inside the 80% safe circle (r 205).
  const s = maskable ? 1.26 : fav ? 2.05 : 1.76
  const tx = 256 - 108 * s
  const ty = (maskable ? 468 : 506) - 222 * s
  const halo = `<circle cx="256" cy="${maskable ? 250 : 236}" r="${maskable ? 170 : 210}" fill="url(#${id}h)"/>`
  const deco = fav
    ? ''
    : maskable
      ? `${sparkle(150, 150, 22, '#ffffff', 0.95)}${sparkle(370, 170, 14, '#fde68a')}${star(392, 392, 16, '#fde68a', '#f59e0b')}${sparkle(140, 340, 12, '#ffffff', 0.8)}`
      : `${sparkle(96, 104, 30, '#ffffff', 0.95)}${sparkle(420, 120, 18, '#fde68a')}${sparkle(440, 300, 13, '#ffffff', 0.85)}${star(408, 214, 20, '#fde68a', '#f59e0b')}${sparkle(70, 300, 14, '#fde68a', 0.9)}`
  const clip = fav ? `<clipPath id="${id}c"><rect x="0" y="0" width="512" height="512" rx="112"/></clipPath>` : ''
  const body = `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s})">${unicorn(fav ? 8.5 : 6)}</g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${background(id, fav)}
  ${clip}
  <g${fav ? ` clip-path="url(#${id}c)"` : ''}>
  ${halo}
  ${deco}
  ${body}
  </g>
</svg>
`
}

mkdirSync(out('public/icons'), { recursive: true })
const master = iconSvg({ variant: 'any' })
const maskable = iconSvg({ variant: 'maskable' })
const favicon = iconSvg({ variant: 'favicon' }).replace('width="512" height="512"', 'width="32" height="32"')
writeFileSync(out('public/icons/icon.svg'), master)
writeFileSync(out('public/icons/icon-maskable.svg'), maskable)
writeFileSync(out('public/favicon.svg'), favicon)

const { chromium } = await import(resolve(root, 'node_modules/@playwright/test/index.mjs'))
// CHROME_PATH overrides the browser; otherwise use the Chromium that Playwright installed for this platform.
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const page = await browser.newPage({ deviceScaleFactor: 1 })
async function render(svg, size, file) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`)
  await page.screenshot({ path: out(file), omitBackground: false, clip: { x: 0, y: 0, width: size, height: size } })
  console.log('wrote', file)
}
await render(master, 512, 'public/icons/icon-512.png')
await render(master, 192, 'public/icons/icon-192.png')
await render(maskable, 512, 'public/icons/icon-512-maskable.png')
await render(master, 180, 'public/icons/apple-touch-icon.png')
await browser.close()
