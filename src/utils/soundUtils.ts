// Utility để phát âm thanh sử dụng Web Audio API

/**
 * Phát âm thanh đúng (success sound)
 */
export function playCorrectSound() {
	try {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
		const oscillator = audioContext.createOscillator()
		const gainNode = audioContext.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(audioContext.destination)

		// Tạo âm thanh vui vẻ (2 nốt cao)
		oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
		oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
		oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5

		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

		oscillator.start(audioContext.currentTime)
		oscillator.stop(audioContext.currentTime + 0.3)
	} catch (error) {
		console.log("Could not play correct sound:", error)
	}
}

/**
 * Phát âm thanh sai (error sound)
 */
export function playWrongSound() {
	try {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
		const oscillator = audioContext.createOscillator()
		const gainNode = audioContext.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(audioContext.destination)

		// Tạo âm thanh cảnh báo (nốt thấp)
		oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
		oscillator.type = 'sawtooth'

		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

		oscillator.start(audioContext.currentTime)
		oscillator.stop(audioContext.currentTime + 0.2)
	} catch (error) {
		console.log("Could not play wrong sound:", error)
	}
}

/**
 * Phát âm thanh đếm ngược (tick sound)
 */
export function playCountdownTick() {
	try {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
		const oscillator = audioContext.createOscillator()
		const gainNode = audioContext.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(audioContext.destination)

		// Tạo âm thanh tick ngắn
		oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
		oscillator.type = 'sine'

		gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

		oscillator.start(audioContext.currentTime)
		oscillator.stop(audioContext.currentTime + 0.1)
	} catch (error) {
		console.log("Could not play countdown tick:", error)
	}
}

/**
 * Phát âm thanh cảnh báo khi thời gian sắp hết (3 giây cuối)
 */
export function playCountdownWarning() {
	try {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
		const oscillator = audioContext.createOscillator()
		const gainNode = audioContext.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(audioContext.destination)

		// Tạo âm thanh cảnh báo (nốt cao hơn)
		oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
		oscillator.type = 'square'

		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

		oscillator.start(audioContext.currentTime)
		oscillator.stop(audioContext.currentTime + 0.15)
	} catch (error) {
		console.log("Could not play countdown warning:", error)
	}
}

