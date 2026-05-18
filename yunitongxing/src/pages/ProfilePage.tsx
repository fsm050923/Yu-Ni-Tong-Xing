import { useState, useEffect } from 'react'
import { useMemoryStore, type ChildProfile } from '../stores/useMemoryStore'
import { useTripStore } from '../stores/useTripStore'

const INTEREST_OPTIONS = [
  { value: '动物', emoji: '🐘' },
  { value: '恐龙', emoji: '🦕' },
  { value: '海洋', emoji: '🐠' },
  { value: '科技', emoji: '🚀' },
  { value: '自然', emoji: '🌿' },
  { value: '运动', emoji: '⚽' },
  { value: '音乐', emoji: '🎵' },
  { value: '绘画', emoji: '🎨' },
]

export default function ProfilePage() {
  const profile = useMemoryStore((s) => s.profile)
  const setProfile = useMemoryStore((s) => s.setProfile)
  const saveToStorage = useMemoryStore((s) => s.saveToStorage)
  const tripHistory = useTripStore((s) => s.tripHistory)

  const [form, setForm] = useState<ChildProfile>({ ...profile })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({ ...profile })
  }, [profile.childName, profile.childAge])

  const update = (field: keyof ChildProfile, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const toggleInterest = (value: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(value)
        ? f.interests.filter((i) => i !== value)
        : [...f.interests, value],
    }))
  }

  const handleSave = () => {
    setProfile(form)
    saveToStorage()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="flex-1 px-5 py-4 space-y-5">
        <div className="text-center mb-2">
          <div className="text-5xl mb-2">👶</div>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            宝贝信息
          </h2>
          <p className="text-xs text-text-muted">填写后 Agent 会自动参考，不用每次都告诉它</p>
        </div>

        {/* Name & Age */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="text-[10px] text-text-muted mb-1 block">昵称</label>
            <input
              type="text"
              value={form.childName}
              onChange={(e) => update('childName', e.target.value)}
              placeholder="如：小明"
              className="w-full text-sm font-bold text-text-primary bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="text-[10px] text-text-muted mb-1 block">年龄</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={12}
                value={form.childAge || ''}
                onChange={(e) => update('childAge', Number(e.target.value))}
                className="w-12 text-sm font-bold text-text-primary bg-transparent border-none outline-none"
              />
              <span className="text-sm text-text-muted">岁</span>
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-[10px] text-text-muted mb-2 block">性别</label>
          <div className="flex gap-2">
            {[
              { value: 'boy' as const, label: '👦 男孩', emoji: '👦' },
              { value: 'girl' as const, label: '👧 女孩', emoji: '👧' },
            ].map((g) => (
              <button
                key={g.value}
                onClick={() => update('gender', g.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  form.gender === g.value
                    ? 'bg-sky-blue/10 text-sky-blue border border-sky-blue/30'
                    : 'bg-gray-50 text-text-muted border border-gray-100'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Energy level */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-[10px] text-text-muted mb-2 block">体力水平</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'low' as const, label: '🔋 易累', desc: '多安排休息' },
              { value: 'medium' as const, label: '⚡ 正常', desc: '标准节奏' },
              { value: 'high' as const, label: '🚀 精力旺盛', desc: '可以多玩' },
            ].map((e) => (
              <button
                key={e.value}
                onClick={() => update('energyLevel', e.value)}
                className={`py-2.5 rounded-xl text-center transition-all ${
                  form.energyLevel === e.value
                    ? 'bg-warm-orange/10 text-warm-orange border border-warm-orange/30'
                    : 'bg-gray-50 text-text-muted border border-gray-100'
                }`}
              >
                <div className="text-xs font-medium">{e.label}</div>
                <div className="text-[9px] opacity-60">{e.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-[10px] text-text-muted mb-2 block">兴趣爱好（多选）</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleInterest(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  form.interests.includes(opt.value)
                    ? 'bg-mint-green/15 text-mint-green border border-mint-green/30'
                    : 'bg-gray-50 text-text-muted border border-gray-100'
                }`}
              >
                {opt.emoji} {opt.value}
              </button>
            ))}
          </div>
        </div>

        {/* Avoid crowds */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text-primary">避开人流密集</div>
            <div className="text-[10px] text-text-muted">优先推荐非高峰时段和冷门景点</div>
          </div>
          <button
            onClick={() => update('avoidCrowds', !form.avoidCrowds)}
            className={`w-12 h-7 rounded-full transition-all flex items-center ${
              form.avoidCrowds ? 'bg-warm-orange justify-end' : 'bg-gray-200 justify-start'
            }`}
          >
            <span className="w-5 h-5 bg-white rounded-full m-1 shadow-sm" />
          </button>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-[10px] text-text-muted mb-1 block">备注（过敏、特殊需求等）</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="如：对花生过敏、怕狗、午睡习惯..."
            className="w-full h-16 text-xs resize-none border-none outline-none bg-transparent text-text-primary placeholder:text-gray-300"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
            saved
              ? 'bg-mint-green text-white'
              : 'bg-warm-yellow text-white'
          }`}
        >
          {saved ? '✅ 已保存' : '💾 保存信息'}
        </button>

        {/* Trip history */}
        {tripHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <label className="text-[10px] text-text-muted mb-2 block">
              📝 历史行程 ({tripHistory.length})
            </label>
            <div className="space-y-2">
              {tripHistory.slice(0, 5).map((t, i) => (
                <div key={i} className="text-xs text-text-secondary flex items-center gap-2">
                  <span>📌</span>
                  <span className="font-medium">{t.title || t.destination}</span>
                  <span className="text-text-muted">
                    {t.mode === 'relaxed' ? '悠闲' : t.mode === 'compact' ? '紧凑' : '标准'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  )
}
