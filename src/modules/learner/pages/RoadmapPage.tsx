import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  StarFilled,
  LockFilled,
  PlayCircleFilled,
  CheckCircleFilled,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { Spin, Empty, Tag } from 'antd'
import clsx from 'clsx'
import { learnerService, type Classroom } from '../services/learnerService'

// ─────────────────────────────────────────────
// Mock Data for the Roadmap nodes
// ─────────────────────────────────────────────
const roadmapNodes = [
  { id: 1, title: 'Làm Quen', type: 'completed', stars: 3, position: { x: 50, y: 10 } },
  { id: 2, title: 'Phụ Âm Đầu', type: 'completed', stars: 2, position: { x: 20, y: 30 } },
  { id: 3, title: 'Nguyên Âm', type: 'completed', stars: 1, position: { x: 50, y: 50 } },
  { id: 4, title: 'Dấu Thanh', type: 'active', stars: 0, position: { x: 80, y: 70 } },
  { id: 5, title: 'Ghép Vần', type: 'locked', stars: 0, position: { x: 50, y: 90 } },
  { id: 6, title: 'Câu Căn Bản', type: 'locked', stars: 0, position: { x: 20, y: 110 } },
]

// ─────────────────────────────────────────────
// Roadmap Node Component
// ─────────────────────────────────────────────
const RoadmapNode = ({ node, index }: { node: typeof roadmapNodes[0]; index: number }) => {
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
// Classroom Card Component
// ─────────────────────────────────────────────
const ClassroomCard = ({ classroom, index }: { classroom: Classroom; index: number }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', bounce: 0.3 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
    >
      {/* Top accent bar */}
      <div
        className="h-1.5 w-full"
        style={{
          background: classroom.isActive
            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
            : 'linear-gradient(90deg, #94a3b8, #64748b)',
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-base truncate leading-tight">{classroom.name}</h3>
            <code className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block font-mono">
              {classroom.code}
            </code>
          </div>
          <Tag
            color={classroom.isActive ? 'success' : 'default'}
            className="ml-2 shrink-0 text-xs"
            style={{ borderRadius: 12 }}
          >
            {classroom.isActive ? 'Đang học' : 'Tạm dừng'}
          </Tag>
        </div>

        {/* Description */}
        {classroom.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{classroom.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-50">
          {classroom.startDate && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CalendarOutlined className="text-blue-400" />
              <span>Bắt đầu: <span className="font-medium text-gray-700">{formatDate(classroom.startDate)}</span></span>
            </div>
          )}
          {classroom.endDate && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ClockCircleOutlined className="text-orange-400" />
              <span>Kết thúc: <span className="font-medium text-gray-700">{formatDate(classroom.endDate)}</span></span>
            </div>
          )}
          {classroom.currentStudents != null && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TeamOutlined className="text-purple-400" />
              <span>Tối đa: <span className="font-medium text-gray-700">{classroom.currentStudents} học viên</span></span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main RoadmapPage
// ─────────────────────────────────────────────
const RoadmapPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(true)
  const [classroomError, setClassroomError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMyClassrooms = async () => {
      try {
        setLoadingClassrooms(true)
        setClassroomError(null)
        const data = await learnerService.getMyClassrooms()
        setClassrooms(data)
      } catch (err: any) {
        console.error('Không thể tải danh sách lớp học:', err)
        setClassroomError(err?.message || 'Không thể tải danh sách lớp học')
      } finally {
        setLoadingClassrooms(false)
      }
    }

    fetchMyClassrooms()
  }, [])

  return (
    <div className="w-full min-h-screen bg-gray-50/50 pb-16">

      {/* ── My Classrooms Section ── */}
      <div className="px-6 pt-8 pb-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <BookOutlined className="text-blue-600 text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">Lớp Học Của Tôi</h2>
            <p className="text-sm text-gray-500">Các lớp học bạn đang tham gia</p>
          </div>
          {!loadingClassrooms && (
            <span className="ml-auto bg-blue-50 text-blue-600 font-semibold text-sm px-3 py-1 rounded-full">
              {classrooms.length} lớp
            </span>
          )}
        </div>

        {/* Loading */}
        {loadingClassrooms && (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" tip="Đang tải lớp học..." />
          </div>
        )}

        {/* Error */}
        {!loadingClassrooms && classroomError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center">
            ⚠️ {classroomError}
          </div>
        )}

        {/* Empty state */}
        {!loadingClassrooms && !classroomError && classrooms.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-12">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500">Bạn chưa tham gia lớp học nào</span>
              }
            />
          </div>
        )}

        {/* Classroom grid */}
        {!loadingClassrooms && !classroomError && classrooms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map((cls, i) => (
              <ClassroomCard key={cls.id} classroom={cls} index={i} />
            ))}
          </div>
        )}
      </div>

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
    </div>
  )
}

export default RoadmapPage
