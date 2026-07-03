import { useState } from 'react'
import html2canvas from 'html2canvas'
import { useUIStore } from '../../stores/useUIStore'
import { useTripStore } from '../../stores/useTripStore'

export default function ShareSheet() {
  const isOpen = useUIStore((s) => s.isShareSheetOpen)
  const toggleSheet = useUIStore((s) => s.toggleShareSheet)
  const currentTrip = useTripStore((s) => s.currentTrip)
  const showToast = useUIStore((s) => s.showToast)
  const [isCapturing, setIsCapturing] = useState(false)

  if (!isOpen) return null

  const handleSaveImage = async () => {
    const mapEl = document.getElementById('child-map-container')
    if (!mapEl) {
      showToast('请先在地图页面生成行程', 'info')
      return
    }

    setIsCapturing(true)
    showToast('正在生成高清地图图片...', 'info')

    try {
      const canvas = await html2canvas(mapEl, {
        useCORS: true,
        backgroundColor: '#E8F4E8',
        scale: 2,
      })
      const link = document.createElement('a')
      link.download = `与你童行_${currentTrip?.title || '行程地图'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      showToast('地图图片已保存', 'success')
    } catch {
      showToast('截图失败，请重试', 'error')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleExportDoc = () => {
    if (!currentTrip) return
    const text = `与你童行 · ${currentTrip.title}\n
目的地：${currentTrip.destination}
年龄模式：${currentTrip.ageGroup}
${currentTrip.days.map(d => `
📅 ${d.date}
☀️ 上午：${d.segments.morning.map(n => n.name).join(' → ')}
🌤️ 下午：${d.segments.afternoon.map(n => n.name).join(' → ')}
${d.segments.evening.length > 0 ? `🌙 晚上：${d.segments.evening.map(n => n.name).join(' → ')}` : ''}
`).join('\n')}
—— 由「与你童行」AI智能体规划`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentTrip.title}_行程方案.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('行程文档已下载', 'success')
  }

  const handleShare = async () => {
    if (!currentTrip) return
    const text = `与你童行 · ${currentTrip.title}\n目的地：${currentTrip.destination}\n${currentTrip.days.length}天亲子游`
    if (navigator.share) {
      try {
        await navigator.share({ title: currentTrip.title, text, url: window.location.href })
      } catch {
        // user cancelled, ignore
      }
    } else {
      navigator.clipboard?.writeText(text)
      showToast('行程信息已复制，请粘贴分享', 'success')
    }
  }

  const handleOpenMemoir = () => {
    toggleSheet()
    window.dispatchEvent(new Event('open-memoir-card'))
  }

  const shareOptions = [
    { label: isCapturing ? '生成中...' : '保存地图图片', emoji: isCapturing ? '⏳' : '📸', action: handleSaveImage },
    { label: '生成纪念卡片', emoji: '🎨', action: handleOpenMemoir },
    { label: '导出行程文档', emoji: '📄', action: handleExportDoc },
    { label: '分享行程给朋友', emoji: '💬', action: handleShare },
    { label: '复制行程链接', emoji: '🔗', action: () => { navigator.clipboard?.writeText(window.location.href); showToast('链接已复制', 'success') } },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[2000]" onClick={toggleSheet} />
      <div className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-[24px] shadow-2xl animate-slide-up max-w-md mx-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-5 py-4">
          <h3 className="text-sm font-bold text-text-primary mb-3">分享与导出</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {shareOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={opt.action}
                className="flex flex-col items-center gap-1 py-3 bg-gray-50 rounded-2xl active:bg-warm-yellow/10 transition-colors"
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-xs text-text-secondary">{opt.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={toggleSheet}
            className="w-full py-2.5 text-sm text-text-muted font-medium"
          >
            取消
          </button>
        </div>
      </div>
    </>
  )
}
