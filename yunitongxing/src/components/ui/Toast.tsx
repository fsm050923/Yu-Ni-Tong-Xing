import { useUIStore } from '../../stores/useUIStore'
import { useEffect } from 'react'

const iconMap = { success: '✅', error: '❌', info: 'ℹ️' }
const bgMap = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-gray-800' }

export default function Toast() {
  const message = useUIStore((s) => s.toastMessage)
  const type = useUIStore((s) => s.toastType)

  if (!message) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] animate-fade-in pointer-events-none">
      <div className={`${bgMap[type]} text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-medium max-w-[280px]`}>
        <span>{iconMap[type]}</span>
        <span>{message}</span>
      </div>
    </div>
  )
}
