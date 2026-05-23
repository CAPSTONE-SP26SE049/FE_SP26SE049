import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const EXCEL_BASE = `${BASE_URL}/excel/challenge-bank`;

/**
 * Hàm lấy token hiện tại.
 */
function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem('ACCESS_TOKEN') || window.localStorage.getItem('ACCESS_TOKEN');
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Service tái sử dụng cho Import/Export Excel.
 * Dùng axios trực tiếp (không qua apiClient) vì cần responseType: 'blob'.
 */
export const excelService = {
    // ─── Challenge Bank ───

    /** Download template Excel mẫu theo kỹ năng */
    downloadChallengeTemplate: async (skillType: string): Promise<Blob> => {
        const res = await axios.get(`${EXCEL_BASE}/${skillType}/template`, {
            responseType: 'blob',
            headers: authHeaders(),
        });
        return res.data;
    },

    /** Import câu hỏi từ file Excel */
    importChallenges: async (skillType: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${EXCEL_BASE}/${skillType}/import`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...authHeaders(),
            },
        });
        return res.data;
    },

    /** Export câu hỏi ra file Excel (optional filter theo skillType) */
    exportChallenges: async (skillType?: string): Promise<Blob> => {
        const params = skillType ? { skillType } : {};
        const res = await axios.get(`${EXCEL_BASE}/export`, {
            params,
            responseType: 'blob',
            headers: authHeaders(),
        });
        return res.data;
    },

    /** Download template Excel tổng hợp (4 kỹ năng - MIXED) */
    downloadMixedTemplate: async (): Promise<Blob> => {
        const res = await axios.get(`${EXCEL_BASE}/mixed/template`, {
            responseType: 'blob',
            headers: authHeaders(),
        });
        return res.data;
    },

    /** Import câu hỏi từ Excel vào Quiz (1 kỹ năng cụ thể) */
    importChallengesToQuiz: async (skillType: string, quizId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${EXCEL_BASE}/${skillType}/import-to-quiz/${quizId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...authHeaders(),
            },
        });
        return res.data;
    },

    /** Import câu hỏi tổng hợp (MIXED) từ Excel vào Quiz */
    importMixedToQuiz: async (quizId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${EXCEL_BASE}/mixed/import-to-quiz/${quizId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...authHeaders(),
            },
        });
        return res.data;
    },
};

/**
 * Helper: trigger download từ Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
