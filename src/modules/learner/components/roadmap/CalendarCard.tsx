import React from 'react'
import { Tooltip } from 'antd'
import { Check, Lock, Play } from 'lucide-react'
import type { TimelineItem } from '../../services/timelineService'
import { ROADMAP_STATUS, STATUS_LABEL } from '../../constants/roadmapConstants'

interface CalendarCardProps {
  item: TimelineItem
}

const CARD_BASE_CLASS =
  'w-full rounded-lg border p-3 text-left shadow-sm transition-all hover:shadow-md'

const STATUS_STYLE_MAP: Record<string, string> = {
  [ROADMAP_STATUS.COMPLETED]: 'bg-green-50 border-green-600/60 text-green-900',
  [ROADMAP_STATUS.IN_PROGRESS]: 'bg-orange-50 border-orange-600/60 text-orange-900 animate-pulse',
  [ROADMAP_STATUS.UPCOMING]: 'bg-gray-50 border-gray-300 text-gray-500 opacity-70',
}

const STATUS_ICON_MAP: Record<string, React.ReactNode> = {
  [ROADMAP_STATUS.COMPLETED]: <Check className="h-5 w-5 text-green-600" />,
  [ROADMAP_STATUS.IN_PROGRESS]: <Play className="h-5 w-5 text-orange-600 fill-current" />,
  [ROADMAP_STATUS.UPCOMING]: <Lock className="h-5 w-5 text-gray-400" />,
}

const CalendarCard: React.FC<CalendarCardProps> = ({ item }) => {
  const normalizedStatus = (item.status ?? '').toString().trim().toLowerCase()
  const statusKey =
    normalizedStatus === ROADMAP_STATUS.COMPLETED ||
    normalizedStatus === ROADMAP_STATUS.IN_PROGRESS ||
    normalizedStatus === ROADMAP_STATUS.UPCOMING
      ? normalizedStatus
      : ROADMAP_STATUS.UPCOMING

  const isLockedUpcoming = statusKey === ROADMAP_STATUS.UPCOMING && item.locked
  const variantClass = STATUS_STYLE_MAP[statusKey] ?? STATUS_STYLE_MAP[ROADMAP_STATUS.UPCOMING]
  const icon = STATUS_ICON_MAP[statusKey] ?? STATUS_ICON_MAP[ROADMAP_STATUS.UPCOMING]
  const statusText = STATUS_LABEL[statusKey] ?? STATUS_LABEL[ROADMAP_STATUS.UPCOMING]

  return (
    <Tooltip title={item.tooltipDetails} placement="top">
      <div className={`${CARD_BASE_CLASS} ${variantClass} ${isLockedUpcoming ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex-shrink-0">{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm leading-snug break-words">{item.title}</div>
            <div className="text-xs opacity-80 mt-1">{statusText}</div>
          </div>
        </div>
      </div>
    </Tooltip>
  )
}

export default CalendarCard
