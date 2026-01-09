import { useMemo, useState } from "react"

type QuizOption = string

interface QuizQuestion {
	question : string
	options  : QuizOption[]
	answer   : QuizOption
}

interface PronounceQuizProps {
	onCorrectAnswer: () => void
	visible: boolean
}

// N / L minimal pairs to help Northern Vietnamese speakers
const QUESTION_POOL: QuizQuestion[] = [
	{
		question: "Chọn từ chứa âm N đúng trong câu: Tôi ...hận bạn.",
		options: ["nhó", "nhớ", "lớ"],
		answer: "nhớ",
	},
	{
		question: "Âm đầu đúng trong từ: ...ớc mơ",
		options: ["L", "N", "R"],
		answer: "N",
	},
	{
		question: "Chọn đúng: ...ang lạnh",
		options: ["N", "L", "R"],
		answer: "L",
	},
	{
		question: "Chọn từ chứa âm L đúng: ...úa chín",
		options: ["lúa", "núa", "rúa"],
		answer: "lúa",
	},
	{
		question: "Âm đầu đúng: ...i hướng",
		options: ["l", "n", "r"],
		answer: "n",
	},
	{
		question: "Chọn đúng: ...áo động",
		options: ["lào", "nào", "rào"],
		answer: "nào",
	},
	{
		question: "Từ có âm L: ...ựa chọn",
		options: ["lựa", "nựa", "rựa"],
		answer: "lựa",
	},
	{
		question: "Hoàn thiện: ...ghễ gỗ",
		options: ["Là", "Nà", "Rà"],
		answer: "Là",
	},
	{
		question: "Chọn âm đúng: ...ầm lặng",
		options: ["N", "L", "R"],
		answer: "Âm N",
	},
	{
		question: "Chọn từ đúng: ...hạc đỏ",
		options: ["nhạc", "lạc", "rạc"],
		answer: "nhạc",
	},
	{
		question: "Chọn từ đúng: ...ực rỡ",
		options: ["lực", "nực", "rực"],
		answer: "lực",
	},
	{
		question: "Âm đúng trong câu: Tôi ...ói thật.",
		options: ["n", "l", "r"],
		answer: "n",
	},
	{
		question: "Chọn từ đúng: ...ồng bằng",
		options: ["nồng", "lồng", "rồng"],
		answer: "nồng",
	},
	{
		question: "Âm đúng: ...ưng triều",
		options: ["l", "n", "r"],
		answer: "l",
	},
	{
		question: "Hoàn thiện: ...ân viên",
		options: ["l", "n", "r"],
		answer: "n",
	},
]

function shuffle<T>(arr: T[]): T[] {
	return [...arr].sort(() => Math.random() - 0.5)
}

export default function PronounceQuiz({ onCorrectAnswer, visible }: PronounceQuizProps) {
	const questions = useMemo(
		() => shuffle(QUESTION_POOL).slice(0, 10),
		[]
	)
	const [current, setCurrent] = useState(0)
	const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)

	if (!visible) return null
	if (questions.length === 0) return null

	const q = questions[current]

	function handleSelect(opt: QuizOption) {
		const isCorrect = opt.toLowerCase() === q.answer.toLowerCase()
		setFeedback(isCorrect ? "correct" : "wrong")
		if (isCorrect) {
			onCorrectAnswer()
			setTimeout(() => {
				setCurrent(prev => (prev + 1) % questions.length)
				setFeedback(null)
			}, 600)
		}
	}

	return (
		<div className="absolute top-4 left-4 z-[999999] w-[360px] bg-white/80 backdrop-blur border border-slate-300 shadow-lg rounded p-3 text-sm text-slate-900">
			<div className="font-bold mb-2">
				Luyện phát âm N / L · Câu {current + 1}/10
			</div>
			<div className="mb-3 leading-relaxed">{q.question}</div>
			<div className="grid gap-2">
				{q.options.map(opt => (
					<button
						key={opt}
						onClick={() => handleSelect(opt)}
						className={`text-left px-3 py-2 rounded border transition ${
							feedback === "correct" && opt.toLowerCase() === q.answer.toLowerCase()
								? "border-emerald-500 bg-emerald-100"
								: "border-slate-200 bg-slate-50 hover:bg-slate-100"
						}`}
					>
						{opt}
					</button>
				))}
			</div>
			{feedback === "correct" && (
				<div className="mt-2 text-emerald-600 font-semibold">
					Đúng rồi! Mario sẽ nhảy qua cột.
				</div>
			)}
			{feedback === "wrong" && (
				<div className="mt-2 text-rose-600 font-semibold">
					Chưa đúng, thử lại nhé.
				</div>
			)}
		</div>
	)
}

