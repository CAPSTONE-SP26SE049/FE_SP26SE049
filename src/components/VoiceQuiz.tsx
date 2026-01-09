import { useEffect, useRef, useState } from "react"
import { playCorrectSound, playWrongSound } from "../utils/soundUtils"

// Type definitions for Web Speech API
declare global {
	interface Window {
		SpeechRecognition: typeof SpeechRecognition
		webkitSpeechRecognition: typeof SpeechRecognition
	}
	
	interface SpeechRecognition extends EventTarget {
		lang: string
		continuous: boolean
		interimResults: boolean
		start(): void
		stop(): void
		abort(): void
		onresult: ((event: SpeechRecognitionEvent) => void) | null
		onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
		onend: (() => void) | null
	}
	
	interface SpeechRecognitionEvent extends Event {
		resultIndex: number
		results: SpeechRecognitionResultList
	}
	
	interface SpeechRecognitionResultList {
		length: number
		item(index: number): SpeechRecognitionResult
		[index: number]: SpeechRecognitionResult
	}
	
	interface SpeechRecognitionResult {
		length: number
		item(index: number): SpeechRecognitionAlternative
		[index: number]: SpeechRecognitionAlternative
		isFinal: boolean
	}
	
	interface SpeechRecognitionAlternative {
		transcript: string
		confidence: number
	}
	
	interface SpeechRecognitionErrorEvent extends Event {
		error: string
		message: string
	}
	
	var SpeechRecognition: {
		prototype: SpeechRecognition
		new (): SpeechRecognition
	}
	
	var webkitSpeechRecognition: {
		prototype: SpeechRecognition
		new (): SpeechRecognition
	}
}

interface VoiceQuestion {
	instruction: string  // "Hãy đọc từ: ..." hoặc "Hãy đọc câu: ..."
	answer: string      // Từ/câu cần đọc đúng
	isSentence: boolean // true nếu là câu, false nếu là từ đơn
}

interface VoiceQuizProps {
	onCorrectAnswer: () => void
	onNextQuestion: () => void
	visible: boolean
	shouldChangeQuestion?: boolean  // Flag để báo hiệu cần đổi câu hỏi
	resetKey?: number  // Key để reset quiz về câu hỏi đầu tiên
}

// 9 câu hỏi theo yêu cầu
const QUESTION_POOL: VoiceQuestion[] = [
	{
		instruction: "Hãy đọc từ: \"nồi\"",
		answer: "nồi",
		isSentence: false
	},
	{
		instruction: "Hãy đọc từ: \"lúa\"",
		answer: "lúa",
		isSentence: false
	},
	{
		instruction: "Hãy đọc từ: \"nắng\"",
		answer: "nắng",
		isSentence: false
	},
	{
		instruction: "Hãy đọc từ: \"làng\"",
		answer: "làng",
		isSentence: false
	},
	{
		instruction: "Hãy đọc từ: \"nồi lẩu\"",
		answer: "nồi lẩu",
		isSentence: false
	},
	{
		instruction: "Hãy đọc câu: \"Lan nấu nồi lẩu.\"",
		answer: "Lan nấu nồi lẩu",
		isSentence: true
	},
	{
		instruction: "Hãy đọc câu: \"Lúa non nằm trên núi.\"",
		answer: "Lúa non nằm trên núi",
		isSentence: true
	},
	{
		instruction: "Hãy đọc câu: \"Nam lấy lá nón.\"",
		answer: "Nam lấy lá nón",
		isSentence: true
	},
	{
		instruction: "Hãy đọc câu: \"Nắng lên làm lá non.\"",
		answer: "Nắng lên làm lá non",
		isSentence: true
	},
]

function shuffle<T>(arr: T[]): T[] {
	return [...arr].sort(() => Math.random() - 0.5)
}

export default function VoiceQuiz({ onCorrectAnswer, onNextQuestion, visible, shouldChangeQuestion, resetKey }: VoiceQuizProps) {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
	const [questions] = useState(() => shuffle([...QUESTION_POOL]))
	const [isListening, setIsListening] = useState(false)
	const [transcript, setTranscript] = useState("")
	const [isProcessing, setIsProcessing] = useState(false)
	const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
	
	const recognitionRef = useRef<SpeechRecognition | null>(null)
	const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

	// Reset về câu hỏi đầu tiên khi game reset
	useEffect(() => {
		if (resetKey !== undefined && resetKey > 0) {
			setCurrentQuestionIndex(0)
			setTranscript("")
			setIsProcessing(false)
			setFeedback(null)
			setIsListening(false)
			// Dừng recognition nếu đang chạy
			if (recognitionRef.current && isListening) {
				recognitionRef.current.stop()
			}
			if (silenceTimerRef.current) {
				clearTimeout(silenceTimerRef.current)
				silenceTimerRef.current = null
			}
			console.log("🔄 Quiz reset to question 1")
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [resetKey])

	// Khởi tạo Speech Recognition
	useEffect(() => {
		if (!visible) return

		// Kiểm tra browser support
		const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
		if (!SpeechRecognition) {
			console.error("Speech Recognition không được hỗ trợ trong trình duyệt này")
			return
		}

		const recognition = new SpeechRecognition()
		recognition.lang = "vi-VN" // Tiếng Việt
		recognition.continuous = true
		recognition.interimResults = true

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			let finalTranscript = ""
			let interimTranscript = ""

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript
				if (event.results[i].isFinal) {
					finalTranscript += transcript + " "
				} else {
					interimTranscript += transcript
				}
			}

			const fullTranscript = finalTranscript + interimTranscript
			setTranscript(fullTranscript.trim())

			// Nếu có kết quả cuối cùng, kiểm tra đáp án
			if (finalTranscript.trim()) {
				checkAnswer(finalTranscript.trim())
			}

			// Reset silence timer khi có speech
			if (silenceTimerRef.current) {
				clearTimeout(silenceTimerRef.current)
			}

			// Set timer để dừng sau khi im lặng 1.5 giây (ngay sau khi về đích)
			silenceTimerRef.current = setTimeout(() => {
				if (isListening && finalTranscript.trim()) {
					stopListening()
					checkAnswer(finalTranscript.trim())
				}
			}, 1500)
		}

		recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			console.error("Speech recognition error:", event.error)
			if (event.error === "no-speech") {
				// Không có giọng nói, tiếp tục lắng nghe
				return
			}
			setIsListening(false)
		}

		recognition.onend = () => {
			setIsListening(false)
		}

		recognitionRef.current = recognition

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop()
			}
			if (silenceTimerRef.current) {
				clearTimeout(silenceTimerRef.current)
			}
		}
	}, [visible, currentQuestionIndex])

	// Đổi câu hỏi khi nhân vật đã nhảy qua cột
	useEffect(() => {
		if (shouldChangeQuestion) {
			console.log("🔄 Changing question because player passed column, current index:", currentQuestionIndex)
			const nextIndex = (currentQuestionIndex + 1) % questions.length
			console.log("🔄 Changing to question index:", nextIndex, "question:", questions[nextIndex]?.instruction)
			setCurrentQuestionIndex(nextIndex)
			setTranscript("")
			setIsProcessing(false)
			setFeedback(null) // Reset feedback khi đổi câu hỏi
			// Reset flag trong App sau khi đổi câu hỏi
			setTimeout(() => {
				onNextQuestion()
			}, 100)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shouldChangeQuestion])

	// Hàm chuẩn hóa chuỗi tiếng Việt (bỏ dấu để so sánh linh hoạt hơn)
	function normalizeVietnamese(str: string): string {
		return str
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "") // Bỏ dấu
			.replace(/[.,!?;:]/g, "")
			.trim()
	}

	// Hàm tách từ trong câu (loại bỏ khoảng trắng thừa và tách thành mảng)
	function extractWords(str: string): string[] {
		return str
			.toLowerCase()
			.trim()
			.split(/\s+/)
			.filter(word => word.length > 0)
	}

	// Hàm kiểm tra đáp án
	function checkAnswer(userAnswer: string) {
		if (isProcessing) return
		
		setIsProcessing(true)
		const currentQuestion = questions[currentQuestionIndex]
		if (!currentQuestion) {
			setIsProcessing(false)
			return
		}

		let isCorrect = false

		if (currentQuestion.isSentence) {
			// Nếu là câu, so sánh toàn bộ câu (bỏ dấu câu, chữ hoa/thường, và dấu tiếng Việt)
			const normalizedUser = normalizeVietnamese(userAnswer)
			const normalizedAnswer = normalizeVietnamese(currentQuestion.answer)
			isCorrect = normalizedUser === normalizedAnswer
			
			console.log("Checking sentence:", {
				user: normalizedUser,
				answer: normalizedAnswer,
				isCorrect
			})
		} else {
			// Nếu là từ đơn, phải khớp chính xác từ đó
			// Tách các từ trong câu trả lời của người dùng
			const userWords = extractWords(userAnswer)
			const answerWords = extractWords(currentQuestion.answer)
			
			// Kiểm tra từng từ trong đáp án có xuất hiện chính xác trong câu trả lời không
			// Mỗi từ trong đáp án phải có một từ khớp chính xác trong câu trả lời
			// Đảm bảo phụ âm đầu đúng (không được nhầm lẫn N/L)
			let allWordsMatch = true
			
			for (const answerWord of answerWords) {
				let foundMatch = false
				
				for (const userWord of userWords) {
					// Ưu tiên 1: Khớp chính xác với dấu (chính xác nhất)
					if (userWord === answerWord) {
						foundMatch = true
						break
					}
					
					// Ưu tiên 2: Khớp không dấu nhưng phải đảm bảo phụ âm đầu giống nhau
					// Điều này tránh nhầm lẫn N/L (ví dụ: "lồi" vs "nồi", "lắng" vs "nắng")
					const normalizedUserWord = normalizeVietnamese(userWord)
					const normalizedAnswerWord = normalizeVietnamese(answerWord)
					
					// QUAN TRỌNG: Kiểm tra phụ âm đầu TRƯỚC để tránh nhầm lẫn N/L
					// Nếu phụ âm đầu khác nhau, không được chấp nhận dù có giống nhau về phần còn lại
					const userFirstChar = normalizedUserWord.charAt(0)
					const answerFirstChar = normalizedAnswerWord.charAt(0)
					
					// Chỉ kiểm tra khớp nếu phụ âm đầu giống nhau
					if (userFirstChar === answerFirstChar) {
						// Nếu phụ âm đầu giống nhau, mới kiểm tra phần còn lại
						if (normalizedUserWord === normalizedAnswerWord) {
							foundMatch = true
							break
						}
					}
					// Nếu phụ âm đầu khác nhau (ví dụ: "l" vs "n"), không chấp nhận
				}
				
				// Nếu một từ trong đáp án không tìm thấy match, thì sai
				if (!foundMatch) {
					allWordsMatch = false
					break
				}
			}
			
			isCorrect = allWordsMatch
			
			console.log("Checking word:", {
				userAnswer: userAnswer,
				userWords: userWords,
				answer: currentQuestion.answer,
				answerWords: answerWords,
				isCorrect,
				details: answerWords.map(answerWord => {
					const normAnswer = normalizeVietnamese(answerWord)
					const answerFirstChar = normAnswer.charAt(0)
					const match = userWords.find(userWord => {
						if (userWord === answerWord) return true
						const normUser = normalizeVietnamese(userWord)
						const userFirstChar = normUser.charAt(0)
						// Kiểm tra phụ âm đầu trước, sau đó mới kiểm tra normalized
						return userFirstChar === answerFirstChar && normUser === normAnswer
					})
					return { 
						answerWord, 
						answerNormalized: normAnswer,
						answerFirstChar: answerFirstChar,
						matched: match ? {
							word: match,
							normalized: normalizeVietnamese(match),
							firstChar: normalizeVietnamese(match).charAt(0)
						} : null
					}
				})
			})
		}

		if (isCorrect) {
			console.log("✅ Đáp án đúng! Unlocking column...")
			stopListening()
			setFeedback("correct")
			playCorrectSound() // Phát âm thanh đúng
			onCorrectAnswer()
			// KHÔNG đổi câu hỏi ngay - sẽ đổi khi nhân vật nhảy qua cột
			// Câu hỏi sẽ được đổi trong App.tsx khi nhân vật vượt qua cột
			// Xóa feedback sau 2 giây
			setTimeout(() => {
				setFeedback(null)
			}, 2000)
		} else {
			// Sai, hiển thị thông báo và tiếp tục lắng nghe
			console.log("❌ Đáp án sai, tiếp tục lắng nghe...")
			setFeedback("wrong")
			playWrongSound() // Phát âm thanh sai
			setIsProcessing(false)
			// Xóa feedback sau 3 giây để người chơi có thể thử lại
			setTimeout(() => {
				setFeedback(null)
			}, 3000)
		}
	}

	function startListening() {
		if (!recognitionRef.current || isListening) return
		
		setTranscript("")
		setIsProcessing(false)
		setIsListening(true)
		recognitionRef.current.start()
	}

	function stopListening() {
		if (!recognitionRef.current || !isListening) return
		
		setIsListening(false)
		recognitionRef.current.stop()
		if (silenceTimerRef.current) {
			clearTimeout(silenceTimerRef.current)
		}
	}

	function nextQuestion() {
		setCurrentQuestionIndex(prev => {
			const nextIndex = (prev + 1) % questions.length
			setTranscript("")
			setIsProcessing(false)
			onNextQuestion()
			return nextIndex
		})
	}

	if (!visible) return null

	const currentQuestion = questions[currentQuestionIndex]
	if (!currentQuestion) return null

	return (
		<div className="absolute top-4 left-4 z-[999999] w-[400px] bg-white/90 backdrop-blur border border-slate-300 shadow-lg rounded-lg p-4 text-sm text-slate-900">
			<div className="font-bold mb-3 text-base">
				Luyện phát âm N / L · Câu {currentQuestionIndex + 1}/{questions.length}
			</div>
			
			<div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
				<div className="font-semibold text-blue-900 mb-1">Câu hỏi:</div>
				<div className="text-base leading-relaxed text-blue-800">
					{currentQuestion.instruction}
				</div>
			</div>

			<div className="mb-4">
				<button
					onClick={isListening ? stopListening : startListening}
					disabled={isProcessing}
					className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
						isListening
							? "bg-red-500 hover:bg-red-600 text-white"
							: "bg-green-500 hover:bg-green-600 text-white"
					} disabled:opacity-50 disabled:cursor-not-allowed`}
				>
					{isListening ? "⏹ Dừng ghi âm" : "🎤 Bắt đầu ghi âm"}
				</button>
			</div>

			{transcript && (
				<div className="mb-3 p-3 bg-slate-50 rounded border border-slate-200">
					<div className="font-semibold text-slate-700 mb-1">Bạn đã đọc:</div>
					<div className="text-base text-slate-800 italic">
						"{transcript}"
					</div>
				</div>
			)}

			{isListening && (
				<div className="text-center text-slate-500 text-xs mt-2">
					🎙️ Đang lắng nghe... Hãy đọc to và rõ ràng
				</div>
			)}

			{feedback === "correct" && (
				<div className="mt-3 p-3 bg-emerald-100 border border-emerald-400 rounded-lg">
					<div className="text-emerald-700 font-semibold text-center">
						✅ Đúng rồi! Nhân vật sẽ nhảy qua cột khi đến gần.
					</div>
				</div>
			)}

			{feedback === "wrong" && (
				<div className="mt-3 p-3 bg-rose-100 border border-rose-400 rounded-lg">
					<div className="text-rose-700 font-semibold text-center">
						❌ Chưa đúng. Hãy thử lại! Đọc to và rõ ràng từ/câu được yêu cầu.
					</div>
				</div>
			)}
		</div>
	)
}

