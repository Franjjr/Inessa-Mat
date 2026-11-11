/* CR-3 / P6-07: the app is light only, so a browser in dark mode (Samsung Internet on the tablet) does not darken it its
   own way. The computed value on <html> is checked in the e2e (tests/e2e/pantallas-alcance.spec.ts). */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

describe('light colours only', () => {
  it('index.html says so to the browser: <meta name="color-scheme" content="light only">', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8')
    expect(html).toMatch(/<meta name="color-scheme" content="light only" \/>/)
  })

  it('the tokens set color-scheme: light only on :root', () => {
    const css = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8')
    expect(css).toMatch(/:root \{[^}]*color-scheme: light only;/)
  })
})
