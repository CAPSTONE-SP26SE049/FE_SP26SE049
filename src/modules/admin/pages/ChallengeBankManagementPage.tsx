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
import { adminExcelService, downloadBlob } from '../services/adminExcelService'
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
  const [templateDownloading, setTemplateDownloading] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const isValidExcelFile = (file: File) => /\.(xlsx|xls|csv)$/i.test(file.name)

  // Custom Delete Confirm & Notification States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

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

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    setSubmitting(true)
    try {
      await adminService.deleteChallengeBankItem(deletingId)
      showToast('Xóa câu hỏi thành công!', 'success')
      loadChallenges()
    } catch (err: any) {
      console.error('Failed to delete challenge:', err)
      const rawError = (err?.response?.data?.message || err?.message || '').toString()
      
      let friendlyMessage = 'Lỗi không xác định.'
      if (rawError.includes('fk_dca_challenge') || rawError.includes('daily_challenge_attempt')) {
        friendlyMessage = 'Câu hỏi này đang được sử dụng trong các lượt tham gia Thử Thách Hàng Ngày (Mùa Giải của học viên). Không thể xóa!'
      } else if (rawError.includes('quiz_challenge_item') || rawError.includes('fk_quiz_challenge_item') || rawError.includes('quiz_challenge')) {
        friendlyMessage = 'Câu hỏi này đang được sử dụng trong các bài luyện tập. Vui lòng gỡ câu hỏi khỏi bài kiểm tra trước khi xóa!'
      } else if (rawError.includes('speaking_attempt') || rawError.includes('fk_speaking_attempt')) {
        friendlyMessage = 'Câu hỏi này đã có học viên thực hiện bài làm (phát âm). Không thể xóa để bảo toàn lịch sử học tập!'
      } else if (rawError.includes('foreign key constraint') || rawError.includes('violates foreign key')) {
        friendlyMessage = 'Câu hỏi này đang được liên kết với dữ liệu học tập hoặc giải đấu khác của hệ thống. Không thể xóa!'
      } else if (rawError) {
        friendlyMessage = rawError
      }
      
      showToast('Không thể xóa câu hỏi: ' + friendlyMessage, 'error')
    } finally {
      setSubmitting(false)
      setDeleteConfirmOpen(false)
      setDeletingId(null)
    }
  }

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formContentText.trim()) {
      showToast('Vui lòng điền nội dung câu hỏi!', 'error')
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
        showToast('Cập nhật câu hỏi thành công!', 'success')
      } else {
        await adminService.createChallengeBankItem(payload)
        showToast('Tạo mới câu hỏi thành công!', 'success')
      }
      setIsAddEditModalOpen(false)
      loadChallenges()
    } catch (err: any) {
      console.error('Failed to save challenge:', err)
      showToast('Lỗi: ' + (err?.response?.data?.message || err?.message || 'Không thể lưu câu hỏi.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Excel Import/Export/Template ---
  const handleDownloadTemplate = async () => {
    if (templateDownloading) return
    setTemplateDownloading(true)
    try {
          const blob = await adminExcelService.downloadChallengeBankTemplate()
          downloadBlob(blob, 'template_challenge_bank.xlsx')
          showToast('Tải file mẫu thành công!', 'success')
    } catch (err) {
      console.error('Failed to download template:', err)
      showToast('Lỗi tải file mẫu.', 'error')
    } finally {
      setTemplateDownloading(false)
    }
  }

  const handleExportExcel = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const blob = await adminExcelService.exportChallengeBank(
        filterSkill !== 'ALL' ? filterSkill : undefined
      )
          downloadBlob(blob, `challenge_bank_${filterSkill.toLowerCase()}.xlsx`)
          showToast('Xuất file thành công!', 'success')
    } catch (err) {
      console.error('Failed to export Excel:', err)
      showToast('Lỗi xuất file.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isValidExcelFile(file)) {
      showToast('Chỉ chấp nhận file .xlsx, .xls hoặc .csv', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setImporting(true)
    try {
      await adminExcelService.importChallengeBank(file)
      showToast('Nhập dữ liệu kho câu hỏi bằng file Excel thành công!', 'success')
      loadChallenges()
    } catch (err: any) {
      console.error('Failed to import Excel:', err)
      showToast('Lỗi nhập file: ' + (err?.response?.data?.message || err?.message || 'Lỗi không xác định.'), 'error')
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
    <div className="space-y-5 pb-10 text-slate-800">

      {/* Excel batch — compact bar */}
      <section className="rounded-[1.5rem] border-[3px] border-slate-900 bg-[#fffcf4] px-4 py-3 shadow-[4px_4px_0_#1f2937] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <span className="inline-flex shrink-0 rounded-full border-2 border-slate-900 bg-[#fef9c3] px-2.5 py-0.5 text-[9px] font-black uppercase text-slate-700 shadow-[2px_2px_0_#1f2937]">
            Excel
          </span>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Nhập/Xuất hàng loạt</h2>
          <span className="hidden xl:inline text-[10px] font-bold text-slate-500 max-w-md truncate">
            Tải mẫu → điền → nhập file .xlsx
          </span>
          <div
            className="flex items-center gap-3 ml-0 lg:ml-3 shrink-0 bg-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_#1f2937]"
            title="Tổng số câu hỏi trong kho (sau lần tải dữ liệu gần nhất)"
          >
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none whitespace-nowrap">
              Tổng câu hỏi
            </p>
            <p className="text-lg font-black text-slate-900 leading-none tabular-nums min-w-[2ch] text-center">
              {challenges.length}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="rounded-xl border-[2.5px] border-slate-900 bg-[#49B6E5] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-[3px_3px_0_#1f2937] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <Upload size={12} className="inline mr-1.5" strokeWidth={3} />
            {importing ? 'Đang nhập...' : 'Nhập file'}
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="rounded-xl border-[2.5px] border-slate-900 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-[2px_2px_0_#1f2937] hover:-translate-y-0.5 transition-all"
          >
            <Download size={12} className="inline mr-1.5" strokeWidth={3} />
            Tải mẫu
          </button>
          <button
            onClick={handleExportExcel}
            className="rounded-xl border-[2.5px] border-slate-900 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-[2px_2px_0_#1f2937] hover:-translate-y-0.5 transition-all"
          >
            <FileSpreadsheet size={12} className="inline mr-1.5" strokeWidth={3} />
            Xuất file
          </button>
          <button
            onClick={handleOpenAddModal}
            className="rounded-xl border-[2.5px] border-slate-900 bg-[#10b981] px-4 py-2 text-[10px] font-black text-white shadow-[3px_3px_0_#1f2937] hover:-translate-y-0.5 transition-all"
          >
            <Plus size={12} className="inline mr-1.5" strokeWidth={3} />
            Thêm câu
          </button>
        </div>
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
            </select>

            {/* Region Filter */}
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-[2px_2px_0_#1f2937] focus:outline-none"
            >
              <option value="ALL">TẤT CẢ GIỌNG VÙNG MIỀN</option>
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
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 w-[45%]">Mẫu câu phát âm (Tiếng Việt)</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Kỹ năng</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Giọng vùng miền</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center">Độ khó</th>
                  <th className="pb-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 text-right pr-4">Thao tác</th>
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

                  let skillLabel = 'Nói'
                  const skillType = (item.skillType || '').toUpperCase()
                  if (skillType === 'LISTENING') skillLabel = 'Nghe'
                  else if (skillType === 'READING') skillLabel = 'Đọc'
                  else if (skillType === 'WRITING') skillLabel = 'Viết'
                  else if (skillType === 'ENTRY_TEST') skillLabel = 'Entry Test'

                  let diffColor = 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  if (item.difficultyTag === 'KHÓ' || item.difficultyTag === 'HARD') {
                    diffColor = 'bg-rose-50 border-rose-200 text-rose-600'
                  } else if (item.difficultyTag === 'TRUNG BÌNH' || item.difficultyTag === 'MEDIUM') {
                    diffColor = 'bg-amber-50 border-amber-200 text-amber-600'
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="text-base font-bold text-slate-900">
                          "{item.contentText?.normalize('NFC')}"
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg border-[1.5px] border-indigo-200 bg-indigo-50 text-[10px] font-black uppercase text-indigo-600">
                          {skillLabel}
                        </span>
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
                            onClick={() => handleDeleteClick(item.id)}
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
                      <option value="ENTRY_TEST">BÀI TEST ĐẦU VÀO</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">Giọng vùng miền</label>
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

      {/* 🗑️ POPUP MODAL: XÁC NHẬN XÓA CÂU HỎI */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-[2.5rem] border-[3px] border-slate-900 bg-[#fbf6ef] p-8 shadow-[8px_8px_0_#1f2937]"
            >
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setDeletingId(null)
                }}
                className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border-2 border-slate-900 bg-white font-black text-slate-900 shadow-[3px_3px_0_#1f2937] active:translate-y-0.5"
              >
                X
              </button>

              <div className="text-center space-y-5 pt-4">
                <div className="w-16 h-16 rounded-full border-[3px] border-slate-900 bg-rose-100 flex items-center justify-center mx-auto shadow-[4px_4px_0_#1f2937]">
                  <Trash2 size={26} className="text-rose-500" strokeWidth={2.5} />
                </div>
                
                <div className="space-y-2">
                  <span className="inline-block rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-1 text-[10px] font-black uppercase text-rose-700">
                    Cảnh báo quản trị
                  </span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    Xác nhận xóa câu hỏi
                  </h3>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed px-2">
                    Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này khỏi kho dữ liệu? Thao tác này không thể hoàn tác.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmOpen(false)
                      setDeletingId(null)
                    }}
                    className="w-1/2 rounded-2xl border-[3px] border-slate-900 bg-white py-3.5 text-xs font-black text-slate-700 shadow-[4px_4px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    HUỶ BỎ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={submitting}
                    className="w-1/2 rounded-2xl border-[3px] border-slate-900 bg-rose-500 py-3.5 text-xs font-black text-white shadow-[4px_4px_0_#1f2937] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {submitting ? 'ĐANG XÓA...' : 'ĐỒNG Ý XÓA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔔 CUSTOM NEO-BRUTALIST TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-3 px-6 py-4 rounded-2xl border-[3px] border-slate-900 shadow-[4px_4px_0_#1f2937] font-black text-xs uppercase tracking-wider ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            <AlertCircle size={16} strokeWidth={3} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
