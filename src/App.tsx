import { createContext, useEffect, useRef, useState } from 'react'
import useController from './hooks/useController'
import useResolveKeyPress from './hooks/useResolveKeyPress'
import usePlayerPosition from './hooks/usePlayerPosition'
import useGameObjects from './hooks/useGameObjects'
import Game from './components/Game'
import Sky from './components/Sky'
import Mario from './components/Mario'
import useControls from './hooks/useControls'
import useGameContext, { UseGameContextInterface } from './hooks/useGameContext'
import GameOver from './components/GameOver'
import GameWon from './components/GameWon'
import useGravity from './hooks/useGravity'
import Level1 from './levels/Level1'
import useLevels from './hooks/useLevels'
import Ground from './components/Ground'
import WinFlag from './components/WinFlag'
import Level2 from './levels/Level2'
import BulletBill from './components/BulletBill'
import WatchOut from './components/WatchOut'
import GameResetBtn from './components/GameResetBtn'
import checkForCollision from './utils/checkForCollision'
import Level3 from './levels/Level3'
import Camera from './components/Camera'
import VoiceQuiz from './components/VoiceQuiz'
import { playCountdownTick, playCountdownWarning } from './utils/soundUtils'



// General Game Context
export const GameContext = createContext<any>(null)



function App() {

	// Config
	// Giảm tốc để khoảng cách 7.5s giữa các cột (khoảng 2300px với 60fps)
	const speed: number = 5

	// Tăng chiều dài map để chứa 10 cột cách nhau ~2300px
	const gameLength: number = 25000

	const maxJumpHeight = useRef(300)

	const totalLevels = 3

	// Doc Title
	useEffect( () => {
		document.title = 'Mario React'
	}, [])

	// KeyPress controller -  Controls which keys are pressed
	const controller = useController()

	// Player position - Updates player position in game
	const playerPosition = usePlayerPosition()

	// Game objects - stores DOM element useRefs
	const gameObjects = useGameObjects()

	// Gravity
	const gravity = useGravity()

	// General Game Context
	const game = useGameContext({ playerPosition, gameObjects, controller })

	// Levels
	const level = useLevels({totalLevels})

	// Control actions - maps actions to keypress events
	const controls = useControls({ playerPosition, gameObjects, speed, gameLength, maxJumpHeight, gravity })

	// Resolve keypress - DOM keyup and keydown event listeners
	useResolveKeyPress(controller)

	// State for quiz visibility - hiển thị ngay khi bắt đầu game
	const [isQuizVisible, setIsQuizVisible] = useState(true)
	// Track which columns have been jumped (bỏ cột đầu tiên - index 0)
	const jumpedColumns = useRef<Set<number>>(new Set())
	// Track which columns have been unlocked (đã đọc đúng) - mỗi cột tương ứng với một câu hỏi
	const unlockedColumns = useRef<Set<number>>(new Set())
	// Track which columns have triggered question change (đã đổi câu hỏi)
	const questionChangedColumns = useRef<Set<number>>(new Set())
	// Đếm số lần bị đẩy lùi khi chạm vào cột
	const pushBackCount = useRef(0)
	// State cho đếm ngược thời gian thua cuộc
	const [countdownTimer, setCountdownTimer] = useState<number | null>(null)
	const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
	// Ref để track xem timer có đang active không (để tránh gọi endGame khi đã reset)
	const isTimerActive = useRef(false)
	// Key để reset quiz khi game reset
	const [quizResetKey, setQuizResetKey] = useState(0)
	// Lưu số câu trả lời đúng khi game kết thúc để hiển thị sao
	const [correctAnswersCount, setCorrectAnswersCount] = useState(0)



	// Game loop
	const loopRef = useRef<number>(0) 
	const gameRef = useRef<UseGameContextInterface | null>(null)

	useEffect( () => {
		gameRef.current = game
	}, [game.playerPosition, game.isGameOver, level.current])

	// Reset quiz state when game resets (player position returns to 0)
	useEffect(() => {
		if (playerPosition.position.x === 0 && playerPosition.position.y === 0) {
			setIsQuizVisible(true)
			jumpedColumns.current.clear()
			unlockedColumns.current.clear()
			questionChangedColumns.current.clear()
			pushBackCount.current = 0
			isTimerActive.current = false
			setCountdownTimer(null)
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current)
				countdownIntervalRef.current = null
			}
			// Reset quiz về câu hỏi đầu tiên
			setQuizResetKey(prev => prev + 1)
			setCorrectAnswersCount(0)
		}
	}, [playerPosition.position.x, playerPosition.position.y])

	// Cleanup interval khi component unmount
	useEffect(() => {
		return () => {
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current)
			}
		}
	}, [])

	// Theo dõi countdownTimer và gọi game over khi về 0
	useEffect(() => {
		if (countdownTimer === 0 && isTimerActive.current && gameRef.current && !gameRef.current.isGameOver) {
			console.log("⏰ Timer reached 0! Game Over")
			isTimerActive.current = false
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current)
				countdownIntervalRef.current = null
			}
			// Lưu số câu trả lời đúng TRƯỚC KHI game over để đảm bảo giá trị đúng
			const count = unlockedColumns.current.size
			console.log('Timer 0 - Saving correctAnswersCount:', count)
			setCorrectAnswersCount(count)
			// Đợi một chút để state được update trước khi gọi endGame
			setTimeout(() => {
				gameRef.current?.endGame()
			}, 0)
		}
	}, [countdownTimer])

	// Ẩn quiz khi game over và đảm bảo correctAnswersCount được set
	useEffect(() => {
		if (game.isGameOver) {
			setIsQuizVisible(false)
			// Đảm bảo correctAnswersCount được set (nếu chưa được set từ timer)
			const count = unlockedColumns.current.size
			if (correctAnswersCount !== count) {
				console.log('Game Over effect - Setting correctAnswersCount:', count)
				setCorrectAnswersCount(count)
			}
		}
	}, [game.isGameOver, correctAnswersCount])

	// Lưu số câu trả lời đúng khi game won
	useEffect(() => {
		if (game.isGameWon) {
			const count = unlockedColumns.current.size
			console.log('Game Won - unlockedColumns size:', count)
			setCorrectAnswersCount(count)
		}
	}, [game.isGameWon])

	// Hàm xử lý khi bị đẩy lùi
	function handlePushBack() {
		pushBackCount.current += 1
		console.log("Push back count:", pushBackCount.current)
		
		// Nếu bị đẩy lùi 3 lần trở lên, bắt đầu đếm ngược
		if (pushBackCount.current >= 3 && countdownTimer === null && !isTimerActive.current) {
			const initialTime = 10 // 10 giây
			setCountdownTimer(initialTime)
			isTimerActive.current = true
			
			// Bắt đầu đếm ngược
			countdownIntervalRef.current = setInterval(() => {
				// Kiểm tra xem timer có còn active không
				if (!isTimerActive.current) {
					if (countdownIntervalRef.current) {
						clearInterval(countdownIntervalRef.current)
						countdownIntervalRef.current = null
					}
					return
				}
				
				setCountdownTimer(prev => {
					// Kiểm tra lại xem timer có còn active không
					if (!isTimerActive.current) {
						return null
					}
					
					// Nếu timer đã về 0 hoặc null, không làm gì cả
					if (prev === null || prev === 0) {
						return 0
					}
					
					const newTime = prev - 1
					
					// Nếu hết thời gian (về 0), game over
					if (newTime <= 0) {
						// Dừng timer trước
						isTimerActive.current = false
						if (countdownIntervalRef.current) {
							clearInterval(countdownIntervalRef.current)
							countdownIntervalRef.current = null
						}
						
						// Gọi game over ngay lập tức (sử dụng gameRef để đảm bảo có reference mới nhất)
						setTimeout(() => {
							console.log("⏰ Time's up! Game Over")
							if (gameRef.current && !gameRef.current.isGameOver) {
								gameRef.current.endGame()
							}
						}, 0)
						
						return 0
					}
					
					// Phát âm thanh đếm ngược
					if (newTime <= 3 && newTime > 0) {
						// 3 giây cuối - phát âm cảnh báo
						playCountdownWarning()
					} else if (newTime > 0) {
						// Các giây khác - phát tick
						playCountdownTick()
					}
					
					return newTime
				})
			}, 1000)
		}
	}

	// Reset đếm khi trả lời đúng
	function handleQuizCorrect() {
		// Reset đếm đẩy lùi khi trả lời đúng
		pushBackCount.current = 0
		
		// Dừng timer ngay lập tức
		isTimerActive.current = false
		if (countdownIntervalRef.current) {
			clearInterval(countdownIntervalRef.current)
			countdownIntervalRef.current = null
		}
		setCountdownTimer(null)
		console.log("✅ Timer stopped - correct answer")
		
		// Unlock cột tiếp theo theo thứ tự (mỗi câu hỏi đúng = unlock 1 cột)
		// Số cột unlock = số câu hỏi đã trả lời đúng
		const nextColumnIndex = unlockedColumns.current.size
		console.log("handleQuizCorrect called, unlocking column:", nextColumnIndex)
		
		if (nextColumnIndex < gameObjects.platforms.level1.length) {
			unlockedColumns.current.add(nextColumnIndex)
			console.log("Unlocked columns:", Array.from(unlockedColumns.current))
			
			// Đã trả lời đủ 9 câu → đóng bảng câu hỏi
			if (unlockedColumns.current.size >= 9) {
				setIsQuizVisible(false)
				console.log("✅ Completed 9 questions, hiding quiz")
			}
			
			// Kiểm tra xem nhân vật có đang ở gần cột vừa unlock không, nếu có thì nhảy ngay
			const platform = gameObjects.platforms.level1[nextColumnIndex]
			if (platform?.ref?.current && !jumpedColumns.current.has(nextColumnIndex)) {
				const marioRect = gameObjects.mario.current.getBoundingClientRect()
				const platformRect = platform.ref.current.getBoundingClientRect()
				const distanceToPlatform = platformRect.left - marioRect.right
				
				console.log("Distance to platform:", distanceToPlatform)
				
				// Nếu đang ở trong khoảng cách hợp lý (0-300px), nhảy ngay
				if (distanceToPlatform >= 0 && distanceToPlatform <= 300) {
					console.log("Jumping immediately! Column:", nextColumnIndex, "Distance:", distanceToPlatform)
					maxJumpHeight.current = platform.jumpHeight
					controls.jumpOnce()
					jumpedColumns.current.add(nextColumnIndex)
				} else {
					console.log("Too far from platform, will jump when closer. Distance:", distanceToPlatform, "Column:", nextColumnIndex)
				}
			}
		}
	}

	// State để báo hiệu cần đổi câu hỏi
	const [shouldChangeQuestion, setShouldChangeQuestion] = useState(false)
	
	// Chuyển sang câu hỏi tiếp theo khi nhảy qua cột
	function handleNextQuestion() {
		// Reset flag sau khi đổi câu hỏi
		setShouldChangeQuestion(false)
	}

	
		function loop() {
		const currentLevel: number = level.ref.current

		checkForCollision({ gameObjects, game, gravity, maxJumpHeight, level : currentLevel, onPushBack: handlePushBack })

		// Controls
		if( !gameRef.current?.isGameOver && !gameRef.current?.isGameWon ) {

			// Tự động di chuyển sang phải
			controls.move('right')

			// Tự động nhảy khi đến các cột - chỉ nhảy nếu đã đọc đúng câu hỏi
			if (currentLevel === 1 && gameObjects.platforms.level1) {
				const marioRect = gameObjects.mario.current.getBoundingClientRect()
				
				// Kiểm tra tất cả các cột từ index 0 (vì đã bỏ cột đầu tiên)
				for (let i = 0; i < gameObjects.platforms.level1.length; i++) {
					const platform = gameObjects.platforms.level1[i]
					
					// Bỏ qua nếu platform chưa sẵn sàng
					if (!platform?.ref?.current) {
						continue
					}
					
					const platformRect = platform.ref.current.getBoundingClientRect()
					const distanceToPlatform = platformRect.left - marioRect.right
					
					// Kiểm tra nếu đã vượt qua cột và cần đổi câu hỏi (kiểm tra trước để ưu tiên)
					if (distanceToPlatform < -20 && unlockedColumns.current.has(i) && jumpedColumns.current.has(i) && !questionChangedColumns.current.has(i)) {
						questionChangedColumns.current.add(i)
						console.log("✅ Marked column", i, "as passed - changing question, distance:", distanceToPlatform)
						
						// Reset timer và đếm đẩy lùi khi nhảy qua cột thành công
						pushBackCount.current = 0
						
						// Dừng timer ngay lập tức
						isTimerActive.current = false
						if (countdownIntervalRef.current) {
							clearInterval(countdownIntervalRef.current)
							countdownIntervalRef.current = null
						}
						setCountdownTimer(null)
						console.log("✅ Timer cleared after passing column", i)
						
						// Đổi câu hỏi khi đã nhảy qua cột
						setShouldChangeQuestion(true)
						console.log("✅ Setting shouldChangeQuestion to true for column", i)
						continue // Bỏ qua logic nhảy nếu đã vượt qua
					}
					
					// Bỏ qua nếu đã nhảy qua cột này
					if (jumpedColumns.current.has(i)) {
						continue
					}
					
					// Chỉ nhảy nếu đã unlock cột này (đã đọc đúng câu hỏi tương ứng)
					// Mở rộng khoảng cách để đảm bảo nhảy được (0-200px)
					if (distanceToPlatform >= 0 && distanceToPlatform <= 100) {
						if (unlockedColumns.current.has(i)) {
							// Đã đọc đúng → nhảy
							maxJumpHeight.current = platform.jumpHeight
							controls.jumpOnce()
							jumpedColumns.current.add(i)
							console.log("Jumped over column", i, "distance:", distanceToPlatform)
							break // Chỉ xử lý một cột mỗi frame
						} else {
							// Chưa unlock - log để debug
							if (distanceToPlatform <= 200 && distanceToPlatform >= 0) {
								console.log("Column", i, "not unlocked yet, distance:", distanceToPlatform, "unlocked:", Array.from(unlockedColumns.current))
							}
						}
						// Nếu chưa unlock, không nhảy → sẽ bị đẩy lùi khi đụng cột (logic trong checkForCollision)
					}
				}
			}

			// Vẫn cho phép nhảy bằng phím mũi tên lên (tùy chọn)
			if( controller.controllerRef.current.up ) {
				controls.move('up')
			}
		}

		loopRef.current = requestAnimationFrame(loop)
	}

	useEffect( () => {
		loopRef.current = requestAnimationFrame(loop)
		return () => { cancelAnimationFrame(loopRef.current) }
	}, [] )

	

	return (
		<GameContext.Provider value={game}>
			{/* Hiển thị đếm ngược thời gian thua cuộc */}
			{countdownTimer !== null && countdownTimer > 0 && (
				<div className='fixed top-20 right-4 z-[999999] bg-red-500/90 backdrop-blur border-2 border-red-600 shadow-lg rounded-lg p-4 text-white'>
					<div className="font-bold text-xl mb-2 text-center">
						⏰ Thời gian còn lại
					</div>
					<div className="text-4xl font-bold text-center">
						{countdownTimer}s
					</div>
					<div className="text-sm mt-2 text-center opacity-90">
						Trả lời đúng để tiếp tục!
					</div>
				</div>
			)}
			<Game>

				<Mario mario={gameObjects.mario} gravity={gravity.ref.current}/>

				<Sky   sky={gameObjects.sky} />

				<Camera camera={gameObjects.camera} style={{}}>

					<WinFlag winFlag={gameObjects.winFlag} />

					<Ground ground={gameObjects.ground} />

					{/* Vật cản đã bị ẩn - chỉ giữ lại cột xanh (Platform) */}
					{/* <BulletBill bulletBill={gameObjects.bulletBill} />

					<WatchOut /> */}

					<Level1 level={level} gameObjects={ gameObjects } />
					<Level2 level={level} gameObjects={ gameObjects } />
					<Level3 level={level} gameObjects={ gameObjects } />
				</Camera>

				<VoiceQuiz 
					onCorrectAnswer={handleQuizCorrect} 
					onNextQuestion={handleNextQuestion}
					visible={isQuizVisible}
					shouldChangeQuestion={shouldChangeQuestion}
					resetKey={quizResetKey}
				/>

				<GameResetBtn />
				<GameOver correctAnswersCount={correctAnswersCount} />
				<GameWon level={level} totalLevels={totalLevels} correctAnswersCount={correctAnswersCount} />

				<div className='absolute z-50 p-8'>
					Cap do {level.current}/{totalLevels}
				</div>

				{/* Dev debugging */}
				{/* <p className='absolute z-50'>
					level: { level.current} <br />
					POs {playerPosition.playerPosRef.current.x}
				</p> */}

			</Game>		
		</GameContext.Provider>
	)
}

export default App
