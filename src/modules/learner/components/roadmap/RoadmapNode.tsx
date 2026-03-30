import { motion } from 'framer-motion'
import { Tooltip } from 'antd'
import { Check, Play, Star, Lock } from 'lucide-react'
import type { TimelineItem } from '../../services/timelineService'

interface RoadmapNodeProps {
  item: TimelineItem
  index: number
}

const RoadmapNode: React.FC<RoadmapNodeProps> = ({ item, index }) => {
  const isLeft = index % 2 === 0

  const statusClasses =
    item.status === 'completed'
      ? 'bg-green-500 text-white border-green-600 shadow-[0_8px_0_0_#15803d]'
      : item.status === 'in_progress'
        ? 'bg-orange-400 text-white border-orange-500 animate-pulse shadow-[0_8px_0_0_#c2410c]'
        : 'bg-gray-300 text-gray-500 border-gray-400 shadow-[0_8px_0_0_#9ca3af]'

  const icon =
    item.status === 'completed' ? (
      <Check className="h-7 w-7" />
    ) : item.status === 'in_progress' ? (
      <>
        <Play className="h-6 w-6" />
        <Star className="h-4 w-4 absolute -top-1 -right-1 text-yellow-200" />
      </>
    ) : (
      <Lock className="h-6 w-6" />
    )

  return (
    <div className={`w-full flex ${isLeft ? 'justify-start' : 'justify-end'} relative`}>
      <div className={`w-full md:w-1/2 ${isLeft ? 'md:pr-8' : 'md:pl-8'}`}>
        <div className={`flex ${isLeft ? 'justify-end' : 'justify-start'}`}>
          <Tooltip title={item.tooltipDetails} placement={isLeft ? 'right' : 'left'}>
            <motion.div
              whileHover={{ scale: 1.1, y: -5 }}
              className={`relative h-20 w-20 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${statusClasses} ${
                item.locked ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              {icon}
            </motion.div>
          </Tooltip>
        </div>

        <div className={`mt-3 text-sm ${isLeft ? 'text-right' : 'text-left'}`}>
          <p className={`font-bold ${item.locked ? 'text-gray-500' : 'text-gray-800'}`}>{item.title}</p>
          <p className="text-xs text-gray-500">{item.date}</p>
        </div>
      </div>
    </div>
  )
}

export default RoadmapNode
