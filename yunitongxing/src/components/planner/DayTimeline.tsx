import type { TripDay } from '../../types/trip'
import NodeItem from './NodeItem'

interface DayTimelineProps {
  day: TripDay
}

const segmentLabels = { morning: '☀️ 上午', afternoon: '🌤️ 下午', evening: '🌙 晚上' }
const segmentColors = { morning: 'border-l-[#FFB347]', afternoon: 'border-l-[#FF6B6B]', evening: 'border-l-[#7B68EE]' }

export default function DayTimeline({ day }: DayTimelineProps) {
  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-bold text-text-primary mb-2">{day.date}</h3>
      <div className="space-y-2">
        {(Object.keys(day.segments) as Array<keyof typeof day.segments>).map((seg) => {
          const nodes = day.segments[seg]
          if (nodes.length === 0) return null
          return (
            <div key={seg} className="pl-3 border-l-2 border-dashed border-gray-200">
              <p className="text-[10px] text-text-muted mb-1">{segmentLabels[seg]}</p>
              <div className="space-y-1">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`pl-3 py-2 border-l-2 ${segmentColors[seg]} bg-white rounded-r-xl`}
                  >
                    <NodeItem node={node} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
