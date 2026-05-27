/**
 * Global Configuration for SpeakVN
 * Toggle between local and deployed environments here.
 */

// 1. Backend URL
const USE_DEPLOYED_BE = false;
export const API_BASE_URL = USE_DEPLOYED_BE
    ? 'https://speakvn-backend-221596280724.asia-southeast1.run.app/api/v1'
    : 'http://localhost:8082/api/v1';

// 2. ASR (Speech-to-Text) URL
const USE_DEPLOYED_ASR = true;
export const ASR_BASE_URL = USE_DEPLOYED_ASR
    ? 'https://nguyenductuan-speak-journey-vn.hf.space/api/v1/transcribe'
    : 'http://localhost:8000/api/v1/transcribe';

// 3. ASR Model Configuration
export const ASR_MODEL = 'NguyenDucTuan/Speak_Journey_VN';
export const ASR_LANGUAGE = 'vi';
export const ASR_SAMPLING_RATE = '16000';

// 4. Metadata
export const APP_VERSION = '1.0.0';
