import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { updateProfileAPI } from '../services/userService'
import { useAuth } from '../core/auth/AuthContext'
import { getLearnerOnboardingPath, mapUiRegionToApi } from '../utils/onboarding'

const REGION_OPTIONS = [
  { id: 'BAC', label: 'Miền Bắc', theme: 'sky' as const },
  { id: 'TRUNG', label: 'Miền Trung', theme: 'purple' as const },
  { id: 'NAM', label: 'Miền Nam', theme: 'green' as const },
]

const themeColors = {
  sky: {
    active: 'bg-sky-50 border-sky-400 text-sky-700 ring-4 ring-sky-400/20',
    hover: 'hover:border-sky-300 hover:shadow-sky-100',
    icon: 'text-sky-500',
  },
  purple: {
    active: 'bg-purple-50 border-purple-400 text-purple-700 ring-4 ring-purple-400/20',
    hover: 'hover:border-purple-300 hover:shadow-purple-100',
    icon: 'text-purple-500',
  },
  green: {
    active: 'bg-green-50 border-brand-green text-green-700 ring-4 ring-green-500/30',
    hover: 'hover:border-green-400 hover:shadow-green-100',
    icon: 'text-brand-green',
  },
}

export default function SelectRegionPage() {
  const navigate = useNavigate()
  const { session, updateSessionItem, refreshUserProfile } = useAuth()
  const [selectedUi, setSelectedUi] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) return
    const target = getLearnerOnboardingPath(session.user)
    if (target !== '/learner/select-region') {
      navigate(target, { replace: true })
    }
  }, [session, navigate])

  const handleConfirm = async () => {
    if (!selectedUi) return
    setLoading(true)
    setError(null)
    try {
      const apiRegion = mapUiRegionToApi(selectedUi)
      const res = await updateProfileAPI({ region: apiRegion })
      const profile = res.data?.data ?? res.data
      updateSessionItem({
        region: profile?.region ?? apiRegion,
        hasDoneEntryTest: profile?.hasDoneEntryTest ?? session?.user.hasDoneEntryTest ?? false,
      })
      await refreshUserProfile()
      navigate('/learner/entrytest', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể lưu miền. Vui lòng thử lại.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-green-50 via-teal-50/50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-lg border border-white/60 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-green to-teal-500 text-white mb-3">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">Chọn vùng miền của bạn</h1>
          <p className="text-gray-500 text-sm md:text-base">
            Bước đầu tiên trên hành trình SpeakVN — chọn miền để hệ thống chuẩn bị bộ đề kiểm tra phù hợp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {REGION_OPTIONS.map((item) => {
            const isSelected = selectedUi === item.id
            const colors = themeColors[item.theme]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedUi(item.id)}
                className={`relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all w-full ${
                  isSelected
                    ? `${colors.active} scale-105 shadow-md`
                    : `border-slate-100 bg-white text-gray-500 hover:-translate-y-1 ${colors.hover}`
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow border">
                    <CheckCircle size={16} className={colors.icon} />
                  </div>
                )}
                <span className="font-extrabold text-base md:text-lg">{item.label}</span>
              </button>
            )
          })}
        </div>

        {error && (
          <p className="text-red-600 text-center text-sm mb-4 font-medium">{error}</p>
        )}

        <Button
          className="w-full h-14 rounded-2xl text-lg font-bold flex items-center justify-center gap-2"
          onClick={handleConfirm}
          disabled={!selectedUi || loading}
        >
          {loading ? 'Đang lưu...' : (
            <>
              TIẾP TỤC ĐẾN BÀI KIỂM TRA <ArrowRight size={22} />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
