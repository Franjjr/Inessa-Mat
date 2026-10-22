/* Page shell for the grown-ups' area: top bar with a back button, a scrollable column and safe areas. */
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { TopBar } from '@/ui'
import s from './adult.module.css'

export function AdultPage({
  title,
  back,
  actions,
  narrow,
  children,
}: {
  title: string
  back?: boolean | string
  actions?: ReactNode
  narrow?: boolean
  children: ReactNode
}) {
  return (
    <main className={s.root}>
      <TopBar back={back} title={<h1 className={s.topTitle}>{title}</h1>} right={actions} />
      <div className={clsx(s.page, narrow && s.narrow)}>{children}</div>
    </main>
  )
}
