/* Copies text to the clipboard. Resolves false when the browser does not allow it. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* permission denied or insecure context: fall through */
  }
  return false
}
