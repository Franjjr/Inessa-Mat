/* CR-3 / P6-07: the app is light only, so a browser in dark mode (Samsung Internet on the tablet) does not darken it its
   own way. The computed value on <html> is checked in the e2e (tests/e2e/pantallas-alcance.spec.ts). */
import { describe, expect, it } from 'vitest'
import html from '../../index.html?raw'

// Read as text from disk (a CSS import is empty under vitest). Node is imported dynamically: the app tsconfig has no @types/node.
interface NodeFs { readFileSync(path: string, encoding: 'utf8'): string }
const fs = (await import(/* @vite-ignore */ 'node:' + 'fs')) as NodeFs
const ROOT = (globalThis as unknown as { process: { cwd(): string } }).process.cwd()
const css = fs.readFileSync(`${ROOT}/src/styles/tokens.css`, 'utf8')

describe('light colours only', () => {
  it('index.html says so to the browser: <meta name="color-scheme" content="light only">', () => {
    expect(html).toMatch(/<meta name="color-scheme" content="light only" \/>/)
  })

  it('the tokens set color-scheme: light only on :root', () => {
    expect(css).toMatch(/:root \{[^}]*color-scheme: light only;/)
  })
})
