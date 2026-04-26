/**
 * Global Configuration for SpeakVN
 * Toggle between local and deployed environments here.
 */

// 1. Backend URL
const USE_DEPLOYED_BE = true;
export const API_BASE_URL = USE_DEPLOYED_BE
    ? 'https://speakvn-backend-221596280724.asia-southeast1.run.app/api/v1'
    : 'http://localhost:8082/api/v1';

// 2. ASR (Speech-to-Text) URL
const USE_DEPLOYED_ASR = true;
export const ASR_BASE_URL = USE_DEPLOYED_ASR
    ? 'https://bao2311-capstone-final.hf.space/asr'
    : 'http://localhost:8000/asr';

// 3. Metadata
export const APP_VERSION = '1.0.0';
