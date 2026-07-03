import { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { useTripStore } from '../../stores/useTripStore'
import { useMemoryStore } from '../../stores/useMemoryStore'
import { useWeatherStore } from '../../stores/useWeatherStore'
import { useUIStore } from '../../stores/useUIStore'

export default function MemoirCard() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const trip = useTripStore((s) => s.currentTrip)
  const profile = useMemoryStore((s) => s.profile)
  const forecast = useWeatherStore((s) => s.forecast)
  const showToast = useUIStore((s) => s.showToast)

  // Expose open method globally via store or event
  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('open-memoir-card', handler)
    return () => window.removeEventListener('open-memoir-card', handler)
  }, [])

  if (!isOpen || !trip) return null

  const allNodes = trip.days.flatMap((d) => [...d.segments.morning, ...d.segments.afternoon, ...d.segments.evening])
  const today = forecast[0]
  const childName = profile.childName || '宝贝'
  const weatherEmoji = today?.condition?.includes('雨') ? '🌧️' : today?.condition?.includes('云') ? '☁️' : '☀️'

  const handleSave = async () => {
    if (!cardRef.current) return
    setIsSaving(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#FFF8F0',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `与你童行_纪念卡_${trip.title}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      showToast('纪念卡片已保存', 'success')
    } catch {
      showToast('保存失败', 'error')
    }
    setIsSaving(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[3000]" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-0 z-[3001] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsOpen(false)}>
        <div
          ref={cardRef}
          className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #FFF8F0 0%, #FFF0E6 30%, #FFE8D6 60%, #FFECD2 100%)',
            fontFamily: '"Noto Sans SC", sans-serif',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top decoration */}
          <div className="relative pt-5 pb-3 text-center">
            <div className="absolute top-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(90deg, #FF6B8A, #FF8C42, #FFC93C, #FF6B8A)' }} />
            <div className="text-5xl mb-2 drop-shadow-sm">🧸</div>
            <h1 className="text-xl font-black tracking-wide" style={{ color: '#5B4636', fontFamily: 'var(--font-display)' }}>
              与你童行 · 出行纪念
            </h1>
            <p className="text-xs mt-1" style={{ color: '#B8956A' }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Trip info */}
          <div className="mx-5 mb-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold" style={{ color: '#FF6B35' }}>📍 {trip.destination}</p>
                <p className="text-lg font-black mt-0.5" style={{ color: '#5B4636' }}>{trip.title}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl">{weatherEmoji}</span>
                {today && <p className="text-[10px]" style={{ color: '#B8956A' }}>{today.tempHigh}°/{today.tempLow}°</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 text-[11px]" style={{ color: '#8B7355' }}>
              <span>👶 {childName} · {trip.childAge}岁</span>
              <span>📅 {trip.days.length}天</span>
              <span>📍 {allNodes.length}站</span>
            </div>

            {/* POI timeline */}
            <div className="space-y-2">
              {allNodes.slice(0, 8).map((n, i) => {
                const hour = parseInt(n.startTime?.split(':')[0] || '9')
                const isRestaurant = n.type === 'restaurant'
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isRestaurant ? '#FFF0E6' : '#FFF8E1',
                        color: isRestaurant ? '#FF6B35' : '#FF8C42',
                        fontSize: '11px',
                      }}
                    >
                      {isRestaurant ? '🍽️' : hour < 12 ? '☀️' : '🌤️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate" style={{ color: '#5B4636' }}>{n.name}</p>
                      {n.tips[0] && (
                        <p className="text-[9px] truncate" style={{ color: '#B8956A' }}>💡 {n.tips[0]}</p>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: '#C4A882' }}>{n.startTime}</span>
                  </div>
                )
              })}
              {allNodes.length > 8 && (
                <p className="text-[10px] text-center" style={{ color: '#C4A882' }}>...还有{allNodes.length - 8}个精彩地点</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pb-5">
            <p className="text-[10px]" style={{ color: '#D4B896' }}>
              AI 亲子出行智能体 · 与你童行
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: '#D4C4B0' }}>
              用AI守护每一段亲子时光 ❤️
            </p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[3002] flex gap-3">
        <button
          onClick={() => setIsOpen(false)}
          className="px-6 py-2.5 bg-white rounded-full text-sm font-bold shadow-lg active:scale-95"
          style={{ color: '#8B7355' }}
        >
          关闭
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #FF6B8A, #FF8C42)' }}
        >
          {isSaving ? '⏳ 生成中...' : '📸 保存卡片'}
        </button>
      </div>
    </>
  )
}
