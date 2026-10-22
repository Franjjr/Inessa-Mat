/* Keeps one broken visual (bad content, a rendering bug) from taking the whole lesson down. */
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

export class SafeVisual extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown): void {
    if (import.meta.env.DEV) console.error('[lesson] visual failed', error)
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
