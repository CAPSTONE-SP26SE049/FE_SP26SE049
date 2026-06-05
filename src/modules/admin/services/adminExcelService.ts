import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
const ADMIN_EXCEL_BASE = `${BASE_URL}/admin/excel`

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem('ACCESS_TOKEN') || window.localStorage.getItem('ACCESS_TOKEN')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const adminExcelService = {
  // ===== Users / Teachers =====
  downloadTeacherTemplate: async (): Promise<Blob> => {
    const res = await axios.get(`${ADMIN_EXCEL_BASE}/users/template`, {
      responseType: 'blob',
      headers: authHeaders(),
    })
    return res.data
  },
  exportTeachers: async (): Promise<Blob> => {
    const res = await axios.get(`${ADMIN_EXCEL_BASE}/users/export`, {
      responseType: 'blob',
      headers: authHeaders(),
    })
    return res.data
  },
  importTeachers: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await axios.post(`${ADMIN_EXCEL_BASE}/users/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
    })
    return res.data
  },

  // ===== Levels =====
  downloadLevelsTemplate: async (): Promise<Blob> => {
    const res = await axios.get(`${ADMIN_EXCEL_BASE}/levels/template`, {
      responseType: 'blob',
      headers: authHeaders(),
    })
    return res.data
  },
  exportLevels: async (): Promise<Blob> => {
    const res = await axios.get(`${ADMIN_EXCEL_BASE}/levels/export`, {
      responseType: 'blob',
      headers: authHeaders(),
    })
    return res.data
  },
  importLevels: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await axios.post(`${ADMIN_EXCEL_BASE}/levels/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
    })
    return res.data
  },

  // ===== Challenge Bank (Admin) =====
  downloadChallengeBankTemplate: async (): Promise<Blob> => {
    const res = await axios.get(`${ADMIN_EXCEL_BASE}/challenge-bank/template`, {
      responseType: 'blob',
      headers: authHeaders(),
    })
    return res.data
  },
  exportChallengeBank: async (skillType?: string): Promise<Blob> => {
    const res = await axios.get(`${ADMIN_EXCEL_BASE}/challenge-bank/export`, {
      params: skillType ? { skillType } : {},
      responseType: 'blob',
      headers: authHeaders(),
    })
    return res.data
  },
  importChallengeBank: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await axios.post(`${ADMIN_EXCEL_BASE}/challenge-bank/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
    })
    return res.data
  },

  // ===== Rewards / Achievements =====
  downloadRewardTemplate: async (): Promise<Blob> => {
    const res = await axios.get(`${ADMIN_EXCEL_BASE}/rewards/template`, {
      responseType: 'blob',
      headers: authHeaders(),
    })
    return res.data
  },
  exportRewards: async (): Promise<Blob> => {
    const res = await axios.get(`${ADMIN_EXCEL_BASE}/rewards/export`, {
      responseType: 'blob',
      headers: authHeaders(),
    })
    return res.data
  },
  importRewards: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await axios.post(`${ADMIN_EXCEL_BASE}/rewards/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
    })
    return res.data
  },
}

/** Tải blob Excel từ API admin (dùng chung cho mọi nút Template / Xuất file). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

