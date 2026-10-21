// PLACEHOLDER — world-core implements the real ActivityHost (attempt logging, mastery, companion reactions).
import { ActivityHostProvider, defaultActivityHost } from '@/activities/host'
import type { GameHostProviderProps } from '../contracts'

export function GameHostProvider({ children }: GameHostProviderProps) {
  return <ActivityHostProvider value={defaultActivityHost}>{children}</ActivityHostProvider>
}
