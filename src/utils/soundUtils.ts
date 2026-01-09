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

// Biến để lưu trữ audio element của nhạc nền
let backgroundMusic: HTMLAudioElement | null = null

/**
 * Phát nhạc nền xuyên suốt trò chơi
 */
export function playBackgroundMusic() {
	try {
		// Nếu đã có nhạc nền đang phát, không tạo mới
		if (backgroundMusic && !backgroundMusic.paused) {
			return
		}
		
		// Nếu đã có nhưng đang pause, reset về đầu và phát lại
		if (backgroundMusic && backgroundMusic.paused) {
			backgroundMusic.currentTime = 0 // Reset về đầu bài hát
			backgroundMusic.play().catch(error => {
				console.log("Could not resume background music:", error)
			})
			return
		}
		
		backgroundMusic = new Audio('/broken-phones-by-prettysleepy-art-12685.mp3')
		backgroundMusic.volume = 0.3 // Volume thấp hơn để không che mất âm thanh jump
		backgroundMusic.loop = true // Lặp lại liên tục
		
		// Thử phát ngay, nếu lỗi thì thử lại sau khi user tương tác
		backgroundMusic.play().catch(error => {
			console.log("Could not play background music (may need user interaction):", error)
			// Thử lại sau khi user click vào trang
			const playOnInteraction = () => {
				if (backgroundMusic) {
					backgroundMusic.play().catch(err => {
						console.log("Could not play background music after interaction:", err)
					})
				}
				document.removeEventListener('click', playOnInteraction)
				document.removeEventListener('touchstart', playOnInteraction)
			}
			document.addEventListener('click', playOnInteraction, { once: true })
			document.addEventListener('touchstart', playOnInteraction, { once: true })
		})
	} catch (error) {
		console.log("Could not play background music:", error)
	}
}

/**
 * Dừng nhạc nền
 */
export function stopBackgroundMusic() {
	try {
		if (backgroundMusic) {
			backgroundMusic.pause()
			backgroundMusic.currentTime = 0
		}
	} catch (error) {
		console.log("Could not stop background music:", error)
	}
}

/**
 * Phát âm thanh khi Mario nhảy qua chướng ngại vật
 * Volume cao hơn để nghe rõ khi có nhạc nền
 */
export function playJumpSound() {
	try {
		const audio = new Audio('/jump-up-245782.mp3')
		audio.volume = 0.7 // Tăng volume để nghe rõ hơn khi có nhạc nền
		audio.play().catch(error => {
			console.log("Could not play jump sound:", error)
		})
	} catch (error) {
		console.log("Could not play jump sound:", error)
	}
}

/**
 * Phát âm thanh khi nhân vật đến đích (win game)
 */
export function playWinSound() {
	try {
		const audio = new Audio('/bouncing_sound_effects_in_game-3-363533.mp3')
		audio.volume = 0.6
		audio.play().catch(error => {
			console.log("Could not play win sound:", error)
		})
	} catch (error) {
		console.log("Could not play win sound:", error)
	}
}
