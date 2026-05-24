import React from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Filter,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react'
import { adminService, type ChallengeBank } from '../services/adminService'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChallengeBankManagementPage() {
  const [challenges, setChallenges] = React.useState<ChallengeBank[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterRegion, setFilterRegion] = React.useState('ALL')
  const [filterDifficulty, setFilterDifficulty] = React.useState('ALL')
  const [filterSkill, setFilterSkill] = React.useState('SPEAKING')
  
  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 8

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = React.useState(false)
  const [editingChallenge, setEditingChallenge] = React.useState<ChallengeBank | null>(null)
  
  // Form States
  const [formContentText, setFormContentText] = React.useState('')
  const [formSkillType, setFormSkillType] = React.useState('SPEAKING')
  const [formDifficultyTag, setFormDifficultyTag] = React.useState('DỄ')
  const [formRegion, setFormRegion] = React.useState('NAM')
  const [submitting, setSubmitting] = React.useState(false)

  // Excel Batch States
  const [importing, setImporting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const loadChallenges = async () => {
    try {
      setLoading(true)
      const res: any = await adminService.getChallengeBank()
      const list = res?.data?.data ?? res?.data ?? res ?? []
      setChallenges(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load challenge bank:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadChallenges()
  }, [])

  const handleOpenAddModal = () => {
    setEditingChallenge(null)
    setFormContentText('')
    setFormSkillType('SPEAKING')
    setFormDifficultyTag('DỄ')
    setFormRegion('NAM')
    setIsAddEditModalOpen(true)
  }

  const handleOpenEditModal = (item: ChallengeBank) => {
    setEditingChallenge(item)
    setFormContentText(item.contentText || '')
    setFormSkillType(item.skillType || 'SPEAKING')
    setFormDifficultyTag(item.difficultyTag || 'DỄ')
    setFormRegion(item.region || 'NAM')
    setIsAddEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi kho câu hỏi?')) return
    try {
      await adminService.deleteChallengeBankItem(id)
      alert('Xóa câu hỏi thành công!')
      loadChallenges()
    } catch (err: any) {
      console.error('Failed to delete challenge:', err)
      alert('Không thể xóa câu hỏi: ' + (err?.message || 'Lỗi không xác định.'))
    }
  }

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formContentText.trim()) {
      alert('Vui lòng điền nội dung câu hỏi!')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        contentText: formContentText.trim(),
        skillType: formSkillType,
        difficultyTag: formDifficultyTag,
        region: formRegion,
        metadataJson: editingChallenge?.metadataJson || {}
      }

      if (editingChallenge) {
        await adminService.updateChallengeBankItem(editingChallenge.id, payload)
        alert('Cập nhật câu hỏi thành công!')
      } else {
        await adminService.createChallengeBankItem(payload)
        alert('Tạo mới câu hỏi thành công!')
      }
      setIsAddEditModalOpen(false)
      loadChallenges()
    } catch (err: any) {
      console.error('Failed to save challenge:', err)
      alert('Lỗi: ' + (err?.response?.data?.message || err?.message || 'Không thể lưu câu hỏi.'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- Excel Import/Export/Template ---
  const handleDownloadTemplate = async () => {
    try {
      const data = await adminService.downloadChallengeBankTemplate()
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'template_challenge_bank.xlsx')
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (err) {
      console.error('Failed to download template:', err)
      alert('Lỗi tải file mẫu Excel.')
    }
  }

  const handleExportExcel = async () => {
    try {
      const data = await adminService.exportChallengeBankToExcel(
        filterSkill !== 'ALL' ? filterSkill : undefined
      )
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `challenge_bank_${filterSkill.toLowerCase()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (err) {
      console.error('Failed to export Excel:', err)
      alert('Lỗi xuất dữ liệu Excel.')
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      await adminService.importChallengeBankFromExcel(file)
      alert('Nhập dữ liệu kho câu hỏi bằng file Excel thành công!')
      loadChallenges()
    } catch (err: any) {
      console.error('Failed to import Excel:', err)
      alert('Lỗi nhập Excel: ' + (err?.response?.data?.message || err?.message || 'Lỗi không xác định.'))
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // --- Filtering & Searching logic ---
  const filteredChallenges = React.useMemo(() => {
    return challenges.filter((item) => {
      const matchesSearch = (item.contentText || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRegion = filterRegion === 'ALL' || (item.region || '').toUpperCase() === filterRegion.toUpperCase()
      const matchesDifficulty = filterDifficulty === 'ALL' || (item.difficultyTag || '').toUpperCase() === filterDifficulty.toUpperCase()
      const matchesSkill = filterSkill === 'ALL' || (item.skillType || '').toUpperCase() === filterSkill.toUpperCase()
      return matchesSearch && matchesRegion && matchesDifficulty && matchesSkill
    })
  }, [challenges, searchTerm, filterRegion, filterDifficulty, filterSkill])

  // Pagination slice
  const paginatedChallenges = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredChallenges.slice(start, start + itemsPerPage)
  }, [filteredChallenges, currentPage])

  const totalPages = Math.ceil(filteredChallenges.length / itemsPerPage)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterRegion, filterDifficulty, filterSkill])

  return (
    <div className="space-y-8 pb-10 text-slate-800">
      
      {/* Excel Batch controls in a beautiful top row card */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2 rounded-[2rem] border-[3px] border-slate-900 bg-[#fffcf4] p-6 shadow-[6px_6px_0_#1f2937] flex flex-col justify-between">
          <div>
            <span className="inline-flex rounded-full border-2 border-slate-900 bg-[#fef9c3] px-3 py-1 text-[10px] font-black uppercase text-slate-700 shadow-[2px_2px_0_#1f2937] mb-3">
              Excel Batch Engine
            </span>
            <h2 className="text-xl font-black text-slate-900 uppercase">Nhập/Xuất Dữ Liệu Hàng Loạt</h2>
            <p className="text-xs text-slate-600 mt-2">
              Quản trị viên có thể cập nhật nhanh hàng trăm câu hỏi bằng cách tải file Excel mẫu tiêu chuẩn, điền dữ liệu, và tải lên hệ thống. An toàn, đồng bộ và nhanh chóng.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportExcel}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="rounded-2xl border-[3px] border-slate-900 bg-[#49B6E5] px-6 py-3 text-xs font-black text-slate-900 shadow-[4px_4px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
            >
              <Upload size={14} className="inline mr-2" strokeWidth={3} />
              {importing ? 'ĐANG NHẬP FILE...' : 'NHẬP BẰNG FILE EXCEL'}
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="rounded-2xl border-[3px] border-slate-900 bg-white px-5 py-3 text-xs font-black text-slate-900 shadow-[3px_3px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <Download size={14} className="inline mr-2" strokeWidth={3} />
              TẢI FILE MẪU
            </button>
            <button
              onClick={handleExportExcel}
              className="rounded-2xl border-[3px] border-slate-900 bg-white px-5 py-3 text-xs font-black text-slate-900 shadow-[3px_3px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <FileSpreadsheet size={14} className="inline mr-2" strokeWidth={3} />
              XUẤT FILE EXCEL
            </button>
          </div>
        </article>

        {/* Quick info status block */}
        <article className="rounded-[2rem] border-[3px] border-slate-900 bg-[#eef9fe] p-6 shadow-[6px_6px_0_#1f2937] flex flex-col justify-between">
          <div>
            <span className="inline-flex rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-[10px] font-black uppercase text-[#49B6E5] shadow-[2px_2px_0_#1f2937] mb-3">
              Question Stats
            </span>
            <h2 className="text-xl font-black text-slate-900 uppercase">Tổng Quan Câu Hỏi</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_#1f2937]">
                <p className="text-[9px] font-black text-slate-400 uppercase">Tổng câu</p>
                <p className="text-2xl font-black text-slate-900">{challenges.length}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_#1f2937]">
                <p className="text-[9px] font-black text-slate-400 uppercase">Khớp bộ lọc</p>
                <p className="text-2xl font-black text-[#49B6E5]">{filteredChallenges.length}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="w-full mt-6 rounded-2xl border-[3px] border-slate-900 bg-[#10b981] py-3.5 text-xs font-black text-white shadow-[4px_4px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Plus size={14} className="inline mr-2" strokeWidth={3} />
            THÊM CÂU HỎI MỚI
          </button>
        </article>
      </section>

      {/* Main Table and filters section */}
      <section className="rounded-[2.5rem] border-[3px] border-slate-900 bg-white p-8 shadow-[8px_8px_0_#1f2937] space-y-6">
        
        {/* Filters and search header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b-2 border-slate-100 pb-6">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
              <Search size={18} strokeWidth={3} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu phát âm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-[2.5px] border-slate-900 text-sm font-bold text-slate-900 shadow-[2px_2px_0_#00000005] focus:outline-none focus:ring-2 focus:ring-[#49B6E5]/20 focus:border-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 shadow-[2px_2px_0_#1f2937]">
              <Filter size={12} strokeWidth={3} />
              BỘ LỌC
            </div>

            {/* Skill Filter */}
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-[2px_2px_0_#1f2937] focus:outline-none"
            >
              <option value="ALL">TẤT CẢ KỸ NĂNG</option>
              <option value="SPEAKING">PHÁT ÂM (NÓI)</option>
              <option value="LISTENING">NGHE</option>
              <option value="READING">ĐỌC</option>
              <option value="WRITING">VIẾT</option>
              <option value="ENTRY_TEST">ENTRY TEST</option>
            </select>

            {/* Region Filter */}
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-[2px_2px_0_#1f2937] focus:outline-none"
            >
              <option value="ALL">TẤT CẢ PHƯƠNG NGỮ</option>
              <option value="NAM">GIỌNG NAM</option>
              <option value="BAC">GIỌNG BẮC</option>
              <option value="TRUNG">GIỌNG TRUNG</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-[2px_2px_0_#1f2937] focus:outline-none"
            >
              <option value="ALL">TẤT CẢ ĐỘ KHÓ</option>
              <option value="DỄ">ĐỘ KHÓ: DỄ</option>
              <option value="TRUNG BÌNH">ĐỘ KHÓ: TRUNG BÌNH</option>
              <option value="KHÓ">ĐỘ KHÓ: KHÓ</option>
            </select>

            <button
              onClick={loadChallenges}
              className="p-2.5 rounded-xl border-2 border-slate-900 bg-white text-slate-700 shadow-[2px_2px_0_#1f2937] hover:bg-slate-50 transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} strokeWidth={3} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Data Grid table */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#49B6E5] animate-spin mx-auto" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang nạp ngân hàng câu hỏi...</p>
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b-[3px] border-slate-900/5 text-left">
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 w-[60%]">Mẫu câu phát âm (Tiếng Việt)</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Phương ngữ</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Độ khó</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-right pr-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-slate-100">
                {paginatedChallenges.map((item) => {
                  let regionLabel = 'Giọng Nam'
                  let regionColor = 'bg-orange-50 border-orange-200 text-orange-600'
                  if ((item.region || '').toUpperCase() === 'BAC' || (item.region || '').toUpperCase() === 'NORTH') {
                    regionLabel = 'Giọng Bắc'
                    regionColor = 'bg-blue-50 border-blue-200 text-blue-600'
                  } else if ((item.region || '').toUpperCase() === 'TRUNG' || (item.region || '').toUpperCase() === 'CENTRAL') {
                    regionLabel = 'Giọng Trung'
                    regionColor = 'bg-yellow-50 border-yellow-200 text-yellow-600'
                  }

                  let diffColor = 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  if (item.difficultyTag === 'KHÓ' || item.difficultyTag === 'HARD') {
                    diffColor = 'bg-rose-50 border-rose-200 text-rose-600'
                  } else if (item.difficultyTag === 'TRUNG BÌNH' || item.difficultyTag === 'MEDIUM') {
                    diffColor = 'bg-amber-50 border-amber-200 text-amber-600'
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-serif text-base font-bold text-slate-900">
                          "{item.contentText}"
                        </div>
                        <div className="text-[10px] font-black uppercase text-slate-400 mt-1">
                          Kỹ năng: {item.skillType || 'SPEAKING'}
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg border-[1.5px] text-[10px] font-black uppercase ${regionColor}`}>
                          {regionLabel}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg border-[1.5px] text-[10px] font-black uppercase ${diffColor}`}>
                          {item.difficultyTag || 'DỄ'}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 rounded-xl border-2 border-slate-900 bg-white text-slate-700 shadow-[2px_2px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                            title="Sửa câu hỏi"
                          >
                            <Edit2 size={13} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-xl border-2 border-slate-900 bg-white text-rose-500 shadow-[2px_2px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 size={13} strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 rounded-[2rem] border-2 border-dashed border-slate-200 text-center space-y-4 bg-slate-50">
            <AlertCircle className="text-slate-300 mx-auto" size={40} strokeWidth={2} />
            <div>
              <p className="text-sm font-black text-slate-700 uppercase">Không tìm thấy câu hỏi</p>
              <p className="text-xs text-slate-400 mt-1">Không có bản ghi nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.</p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterRegion('ALL')
                setFilterDifficulty('ALL')
                setFilterSkill('SPEAKING')
              }}
              className="rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-[2px_2px_0_#1f2937]"
            >
              XÓA BỘ LỌC
            </button>
          </div>
        )}

        {/* Pagination navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 flex-wrap gap-4">
            <span className="text-xs font-bold text-slate-500">
              Hiển thị {Math.min(filteredChallenges.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredChallenges.length, currentPage * itemsPerPage)} của {filteredChallenges.length} câu hỏi
            </span>
            <div className="flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white p-1 shadow-[3px_3px_0_#1f2937]">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-full border-[1.5px] border-slate-900 text-xs font-black bg-slate-50 disabled:opacity-30 active:scale-95"
              >
                Trước
              </button>
              <span className="px-3 text-xs font-black text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 rounded-full border-[1.5px] border-slate-900 text-xs font-black bg-slate-50 disabled:opacity-30 active:scale-95"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 🎤 POPUP MODAL: THÊM / SỬA CÂU HỎI THỦ CÔNG */}
      <AnimatePresence>
        {isAddEditModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-8 shadow-[10px_10px_0_#1f2937]"
            >
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[3px_3px_0_#1f2937] active:translate-y-0.5"
              >
                X
              </button>

              <div className="mb-6">
                <span className="inline-block rounded-full border-2 border-slate-900 bg-[#fef9c3] px-3 py-1 text-[10px] font-black uppercase text-slate-700">
                  Câu hỏi quản trị
                </span>
                <h3 className="mt-2 text-xl font-black text-slate-900 uppercase">
                  {editingChallenge ? 'CHỈNH SỬA CÂU HỎI' : 'TẠO CÂU HỎI PHÁT ÂM MỚI'}
                </h3>
              </div>

              <form onSubmit={handleSaveChallenge} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Nội dung câu nói (Tiếng Việt)</label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Lúa nếp là lúa nếp làng..."
                    value={formContentText}
                    onChange={(e) => setFormContentText(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl border-[2.5px] border-slate-900 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#49B6E5]/20 focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Kỹ năng áp dụng</label>
                    <select
                      value={formSkillType}
                      onChange={(e) => setFormSkillType(e.target.value)}
                      className="w-full px-3 py-3 rounded-2xl border-[2.5px] border-slate-900 text-xs font-black text-slate-800 bg-white focus:outline-none"
                    >
                      <option value="SPEAKING">PHÁT ÂM (NÓI)</option>
                      <option value="LISTENING">NGHE</option>
                      <option value="READING">ĐỌC</option>
                      <option value="WRITING">VIẾT</option>
                      <option value="ENTRY_TEST">ENTRY TEST</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Phương ngữ vùng miền</label>
                    <select
                      value={formRegion}
                      onChange={(e) => setFormRegion(e.target.value)}
                      className="w-full px-3 py-3 rounded-2xl border-[2.5px] border-slate-900 text-xs font-black text-slate-800 bg-white focus:outline-none"
                    >
                      <option value="NAM">GIỌNG NAM</option>
                      <option value="BAC">GIỌNG BẮC</option>
                      <option value="TRUNG">GIỌNG TRUNG</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Độ khó phát âm</label>
                  <select
                    value={formDifficultyTag}
                    onChange={(e) => setFormDifficultyTag(e.target.value)}
                    className="w-full px-3 py-3 rounded-2xl border-[2.5px] border-slate-900 text-xs font-black text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="DỄ">DỄ (EASY)</option>
                    <option value="TRUNG BÌNH">TRUNG BÌNH (MEDIUM)</option>
                    <option value="KHÓ">KHÓ (HARD)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="w-1/2 rounded-2xl border-[3px] border-slate-900 bg-white py-4 text-sm font-black text-slate-700 shadow-[4px_4px_0_#1f2937]"
                  >
                    HUỶ BỎ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 rounded-2xl border-[3px] border-slate-900 bg-[#10b981] py-4 text-sm font-black text-white shadow-[4px_4px_0_#1f2937] disabled:opacity-50"
                  >
                    {submitting ? 'ĐANG LƯU...' : 'LƯU CÂU HỎI'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
