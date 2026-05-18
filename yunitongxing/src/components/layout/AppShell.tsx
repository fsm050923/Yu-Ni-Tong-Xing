import { type ReactNode } from 'react'
import BottomNav from './BottomNav'
import Header from './Header'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-dvh w-full max-w-md mx-auto bg-warm-bg overflow-hidden relative shadow-2xl">
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
