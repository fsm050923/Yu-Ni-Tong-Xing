import { useUIStore } from '../../stores/useUIStore'
import { useTripStore } from '../../stores/useTripStore'

export default function ShareSheet() {
  const isOpen = useUIStore((s) => s.isShareSheetOpen)
  const toggleSheet = useUIStore((s) => s.toggleShareSheet)
  const currentTrip = useTripStore((s) => s.currentTrip)
  const showToast = useUIStore((s) => s.showToast)

  if (!isOpen) return null

  const handleSaveImage = async () => {
    showToast('正在生成高清地图图片...', 'info')
    // In production: html2canvas capture the map element
    setTimeout(() => showToast('图片已保存到相册', 'success'), 1500)
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

  const shareOptions = [
    { label: '保存地图图片', emoji: '📸', action: handleSaveImage },
    { label: '导出行程文档', emoji: '📄', action: handleExportDoc },
    { label: '分享给微信好友', emoji: '💬', action: () => showToast('请使用系统分享功能', 'info') },
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
          <div className="grid grid-cols-2 gap-2 mb-4">
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
