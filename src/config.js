/**
 * Global Configuration for SpeakVN
 * Toggle between local and deployed environments here.
 */

// 1. Backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://speakvn-backend-670338943429.asia-southeast1.run.app/api/v1';

// 2. ASR (Speech-to-Text) URL
// original ASR for Entry Test
export const ENTRY_TEST_ASR_URL = import.meta.env.VITE_ASR_URL || 'https://nguyenductuan-speak-journey-vn.hf.space/api/v1/transcribe';

// new ASR for the rest of the application (Quiz, Tournament, etc.)
export const ASR_BASE_URL = import.meta.env.VITE_NEW_ASR_URL || 'https://hangulonline-speakvn-asr.hf.space/api/v1/transcribe';

// 3. ASR Model Configuration
export const ASR_MODEL = 'NguyenDucTuan/Speak_Journey_VN';
export const ASR_LANGUAGE = 'vi';
export const ASR_SAMPLING_RATE = '16000';

// 4. Metadata
export const APP_VERSION = '1.0.0';
