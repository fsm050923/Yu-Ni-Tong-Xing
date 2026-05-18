import { useTripStore } from '../../stores/useTripStore'
import { useUIStore } from '../../stores/useUIStore'

interface HeaderProps {
  title?: string
  leftAction?: React.ReactNode
}

export default function Header({ title = '与你童行', leftAction }: HeaderProps) {
  const currentTrip = useTripStore((s) => s.currentTrip)
  const toggleShareSheet = useUIStore((s) => s.toggleShareSheet)

  return (
    <header className="safe-area-top glass flex items-center justify-between px-4 py-2.5 z-50">
      <div className="w-10 flex justify-start">{leftAction}</div>
      <div className="flex items-center gap-2">
        <span className="text-2xl">🧸</span>
        <h1
          className="text-lg font-bold gradient-text"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
      </div>
      <div className="w-10 flex justify-end">
        {currentTrip && (
          <button
            onClick={toggleShareSheet}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-yellow/10 text-warm-yellow hover:bg-warm-yellow/20 transition-colors"
          >
            <span className="text-sm">📤</span>
          </button>
        )}
      </div>
    </header>
  )
}
