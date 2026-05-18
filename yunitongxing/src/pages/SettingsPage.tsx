import Header from '../components/layout/Header'

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="设置" />
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-bold text-text-primary mb-1">关于与你童行</h3>
          <p className="text-sm text-text-secondary">版本 1.0.0 - 初赛作品</p>
        </div>
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-bold text-text-primary mb-1">AIGC创新赛</h3>
          <p className="text-sm text-text-secondary">2026中国高校计算机大赛</p>
        </div>
      </div>
    </div>
  )
}
