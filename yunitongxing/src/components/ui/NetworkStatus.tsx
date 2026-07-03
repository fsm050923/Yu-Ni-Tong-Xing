import { useState, useEffect } from 'react'

export default function NetworkStatus() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[4000] bg-red-500 text-white text-center py-1.5 text-xs font-medium animate-pulse-soft">
      当前处于离线状态，部分功能可能不可用
    </div>
  )
}
