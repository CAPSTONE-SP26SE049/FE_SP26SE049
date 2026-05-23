import { useState, useRef, useCallback } from 'react'

export interface AudioRecorderState {
    isRecording: boolean
    audioBlob: Blob | null
    audioUrl: string | null
    durationSeconds: number
    error: string | null
}

export interface UseAudioRecorderReturn extends AudioRecorderState {
    startRecording: () => Promise<void>
    /** Stop recording. Returns a Promise that resolves with the final Blob. */
    stopRecording: () => Promise<Blob | null>
    resetRecording: () => void
    /** Always holds the latest blob — safe to read from stale closures */
    blobRef: React.MutableRefObject<Blob | null>
    noiseCancellation: boolean
    setNoiseCancellation: React.Dispatch<React.SetStateAction<boolean>>
}

const MAX_DURATION = 30 // seconds

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [state, setState] = useState<AudioRecorderState>({
        isRecording: false,
        audioBlob: null,
        audioUrl: null,
        durationSeconds: 0,
        error: null,
    })

    const [noiseCancellation, setNoiseCancellation] = useState<boolean>(true)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const blobRef = useRef<Blob | null>(null)
    // Holds the resolve of the current stopRecording() Promise
    const stopResolveRef = useRef<((blob: Blob | null) => void) | null>(null)

    const stopRecording = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                resolve(blobRef.current)
                return
            }
            stopResolveRef.current = resolve
            mediaRecorderRef.current.stop()
            if (timerRef.current) clearInterval(timerRef.current)
            if (autoStopRef.current) clearTimeout(autoStopRef.current)
        })
    }, [])

    const startRecording = useCallback(async () => {
        blobRef.current = null
        setState({
            isRecording: false,
            audioBlob: null,
            audioUrl: null,
            durationSeconds: 0,
            error: null,
        })
        chunksRef.current = []

        try {
            const constraints: MediaStreamConstraints = {
                audio: noiseCancellation
                    ? {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                      }
                    : true,
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
                        ? 'audio/ogg;codecs=opus'
                        : 'audio/mp4'

            const recorder = new MediaRecorder(stream, { mimeType })
            mediaRecorderRef.current = recorder

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                stream.getTracks().forEach((t) => t.stop())

                const blob = new Blob(chunksRef.current, { type: mimeType })
                const url = URL.createObjectURL(blob)
                blobRef.current = blob

                setState((prev) => ({
                    ...prev,
                    isRecording: false,
                    audioBlob: blob,
                    audioUrl: url,
                }))

                if (stopResolveRef.current) {
                    stopResolveRef.current(blob)
                    stopResolveRef.current = null
                }
            }

            recorder.start(250)
            setState((prev) => ({ ...prev, isRecording: true }))

            let elapsed = 0
            timerRef.current = setInterval(() => {
                elapsed++
                setState((prev) => ({ ...prev, durationSeconds: elapsed }))
            }, 1000)

            autoStopRef.current = setTimeout(() => {
                stopRecording()
            }, MAX_DURATION * 1000)

        } catch (err: any) {
            const msg =
                err?.name === 'NotAllowedError'
                    ? 'Bạn cần cấp quyền truy cập microphone để thu âm.'
                    : 'Không thể bắt đầu thu âm: ' + (err?.message ?? '')
            setState((prev) => ({ ...prev, error: msg }))
        }
    }, [stopRecording, noiseCancellation])

    const resetRecording = useCallback(() => {
        stopRecording()
        blobRef.current = null
        setState({
            isRecording: false,
            audioBlob: null,
            audioUrl: null,
            durationSeconds: 0,
            error: null,
        })
        chunksRef.current = []
    }, [stopRecording])

    return { ...state, startRecording, stopRecording, resetRecording, blobRef, noiseCancellation, setNoiseCancellation }
}
