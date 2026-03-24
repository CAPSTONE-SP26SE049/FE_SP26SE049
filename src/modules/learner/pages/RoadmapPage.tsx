import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  StarFilled,
  LockFilled,
  PlayCircleFilled,
  CheckCircleFilled,
} from '@ant-design/icons'
import { Spin } from 'antd'
import clsx from 'clsx'
import { learnerService, type Level } from '../services/learnerService'
import apiClient from '../../../services/apiClient'



// ─────────────────────────────────────────────
// Roadmap Node Component
// ─────────────────────────────────────────────
const RoadmapNode = ({ node, index }: { node: any; index: number }) => {
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
      case 'completed':
        return <CheckCircleFilled className="text-3xl text-white" />
      case 'active':
        return <PlayCircleFilled className="text-3xl text-white" />
      case 'locked':
        return <LockFilled className="text-2xl text-gray-400" />
    }
  }

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 w-48 flex flex-col items-center z-10"
      style={{ left: `${node.position.x}%`, top: `${node.position.y * 180 + 80}px` }}
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
          'relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer shadow-xl border-b-[6px] transition-colors',
          getStyles(),
        )}
      >
        {getIcon()}

        {/* Stars for completed nodes */}
        {node.type === 'completed' && (
          <div className="absolute -top-4 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <StarFilled
                key={i}
                className={clsx('text-xs', i < node.stars ? 'text-brand-yellow drop-shadow-md' : 'text-yellow-200/50')}
              />
            ))}
          </div>
        )}

        {/* Hover Tooltip */}
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
      <h3 className={clsx('mt-3 font-bold text-lg text-center drop-shadow-sm', node.type === 'locked' ? 'text-gray-400' : 'text-gray-700')}>
        {node.title}
      </h3>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main RoadmapPage
// ─────────────────────────────────────────────
const RoadmapPage: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true)
        const profileRes: any = await apiClient.get('/users/me')
        const userRegion = profileRes?.data?.region || 'NORTH'

        const dialects = await learnerService.getDialects()
        const matchedDialect = dialects.find((d) =>
          d.name.toLowerCase().includes(userRegion.toLowerCase()) ||
          (userRegion === 'NORTH' && d.name.includes('Bắc')) ||
          (userRegion === 'CENTRAL' && d.name.includes('Trung')) ||
          (userRegion === 'SOUTH' && d.name.includes('Nam'))
        )

        if (matchedDialect) {
          const levelData = await learnerService.getLevels(matchedDialect.id)
          setLevels(levelData)
        }
      } catch (err) {
        console.error('Không thể tải roadmap:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRoadmap()
  }, [])

  const roadmapNodes = levels.map((lvl, index) => ({
    id: lvl.id,
    title: lvl.name,
    type: lvl.isLocked ? 'locked' : lvl.isCompleted ? 'completed' : 'active',
    stars: lvl.starsEarned || 0,
    position: {
      x: index % 4 === 0 ? 50 : index % 4 === 1 ? 25 : index % 4 === 2 ? 50 : 75,
      y: index,
    },
  }))

  return (
    <div className="w-full min-h-screen bg-gray-50/50 pb-16">



      {loading ? (
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" tip="Đang tải lộ trình..." />
        </div>
      ) : (
        <>
          {/* ── Divider ── */}
          <div className="max-w-5xl mx-auto px-6 mb-6">
            <div className="border-t border-gray-200" />
          </div>

          {/* ── Roadmap Section ── */}
          <div className="px-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <PlayCircleFilled className="text-green-600 text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 leading-tight">Bản Đồ Hành Trình</h2>
                <p className="text-sm text-gray-500">Lộ trình học phát âm của bạn</p>
              </div>
            </div>
          </div>

          <div className="w-full relative overflow-x-hidden pb-32 pt-2">
            {/* Background SVG path */}
            <div className="absolute top-0 w-full h-full pointer-events-none opacity-50 flex justify-center">
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
        </>
      )}
    </div>
  )
}

export default RoadmapPage
