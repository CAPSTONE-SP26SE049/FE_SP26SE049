import type React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { StarFilled, LockFilled, PlayCircleFilled, CheckCircleFilled } from '@ant-design/icons'
import clsx from 'clsx'

// Mock Data for the Roadmap nodes
const roadmapNodes = [
  { id: 1, title: 'Làm Quen', type: 'completed', stars: 3, position: { x: 50, y: 10 } },
  { id: 2, title: 'Phụ Âm Đầu', type: 'completed', stars: 2, position: { x: 20, y: 30 } },
  { id: 3, title: 'Nguyên Âm', type: 'completed', stars: 1, position: { x: 50, y: 50 } },
  { id: 4, title: 'Dấu Thanh', type: 'active', stars: 0, position: { x: 80, y: 70 } },
  { id: 5, title: 'Ghép Vần', type: 'locked', stars: 0, position: { x: 50, y: 90 } },
  { id: 6, title: 'Câu Căn Bản', type: 'locked', stars: 0, position: { x: 20, y: 110 } },
]

const RoadmapNode = ({ node, index }: { node: typeof roadmapNodes[0], index: number }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getStyles = () => {
    switch (node.type) {
      case 'completed':
        return 'bg-brand-yellow shadow-yellow-200/50 border-b-yellow-600'
      case 'active':
        return 'bg-brand-green shadow-green-200/50 border-b-green-700 ring-4 ring-green-100'
      case 'locked':
      default:
        return 'bg-gray-200 shadow-gray-100 border-b-gray-300 text-gray-400'
    }
  }

  const getIcon = () => {
    switch (node.type) {
      case 'completed': return <CheckCircleFilled className="text-3xl text-white" />
      case 'active': return <PlayCircleFilled className="text-3xl text-white" />
      case 'locked': return <LockFilled className="text-2xl text-gray-400" />
    }
  }

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 w-48 flex flex-col items-center z-10"
      style={{ left: `${node.position.x}%`, top: `${node.position.y * 120}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: node.type !== 'locked' ? 1.1 : 1 }}
        whileTap={{ scale: node.type !== 'locked' ? 0.95 : 1 }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: index * 0.1, type: 'spring', bounce: 0.5 }}
        className={clsx(
          "relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer shadow-xl border-b-[6px] transition-colors",
          getStyles()
        )}
      >
        {getIcon()}

        {/* Floating Crown / Stars for completed nodes */}
        {node.type === 'completed' && (
          <div className="absolute -top-4 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <StarFilled
                key={i}
                className={clsx("text-xs", i < node.stars ? "text-brand-yellow drop-shadow-md" : "text-yellow-200/50")}
              />
            ))}
          </div>
        )}

        {/* Hover Tooltip (Simulated) */}
        {isHovered && node.type !== 'locked' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 whitespace-nowrap z-50 font-bold text-gray-700"
          >
            Bắt đầu bài học
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-white border-r-[6px] border-r-transparent"></div>
          </motion.div>
        )}
      </motion.div>
      <h3 className={clsx("mt-3 font-bold text-lg text-center drop-shadow-sm", node.type === 'locked' ? 'text-gray-400' : 'text-gray-700')}>
        {node.title}
      </h3>
    </div>
  )
}

const RoadmapPage: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[800px] relative overflow-x-hidden pb-32 pt-10">

      {/* Background Decorators */}
      <div className="absolute top-0 w-full h-full pointer-events-none opacity-50 flex justify-center">
        {/* Simple SVG Path simulating a winding road */}
        <svg className="h-[1000px] w-full max-w-lg" viewBox="0 0 100 800" preserveAspectRatio="none">
          <path
            d="M50 10 C 20 20, 20 40, 50 50 C 80 60, 80 80, 50 90 C 20 100, 20 120, 50 130"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="20, 20"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="relative max-w-lg mx-auto w-full h-[800px] mt-8">
        {roadmapNodes.map((node, i) => (
          <RoadmapNode key={node.id} node={node} index={i} />
        ))}
      </div>

    </div>
  )
}

export default RoadmapPage

