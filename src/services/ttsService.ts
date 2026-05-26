import { apiClient } from './apiClient';

const VOICE = 'banmai';

/**
 * Converts text to speech using backend proxy (which calls FPT.AI)
 * @param text The text to be converted
 * @returns The async link from FPT.AI
 */
export const synthesizeSpeechFPT = async (text: string): Promise<string> => {
    if (!text || text.length < 3) {
        throw new Error('Nội dung quá ngắn (tối thiểu 3 ký tự)');
    }

    try {
        const data: any = await apiClient.post('/tts/synthesize', {
            text,
            voice: VOICE
        });

        if (data && data.error === 0 && data.async) {
            // FPT.AI returns an async URL
            return data.async;
        } else {
            throw new Error(data?.message || 'Lỗi khi gọi API FPT.AI từ Backend');
        }
    } catch (error: any) {
        console.error('FPT.AI Synthesis Error:', error);
        const msg = error?.response?.data?.message || error.message || 'Lỗi kết nối Backend';
        throw new Error(msg);
    }
};

/**
 * Polls the FPT.AI URL until the file is actually ready
 * @param url The URL returned by FPT.AI
 * @param maxAttempts Number of times to check (default 10)
 */
export const waitForAudioLink = async (url: string, maxAttempts = 15): Promise<string> => {
    // Backend Spring Boot proxy now handles the polling to avoid browser CORS issues.
    // By the time apiClient.post('/tts/synthesize') returns, the audio URL is 100% ready.
    // We just return the URL immediately here for compatibility with existing components.
    return url;
};

