import { useContext, useMemo } from "react"
import { GameContext } from "../App"
import { UseGameContextInterface } from "../hooks/useGameContext"

interface GameOverProps {
    correctAnswersCount: number
}

export default function GameOver({ correctAnswersCount }: GameOverProps) {

    const game: UseGameContextInterface = useContext(GameContext)

    // Tính số sao dựa trên số câu trả lời đúng
    // 3/9 = 1 sao, 6/9 = 2 sao, 9/9 = 3 sao
    const stars = useMemo(() => {
        if (correctAnswersCount >= 9) return 3
        if (correctAnswersCount >= 6 && correctAnswersCount < 9) return 2
        if (correctAnswersCount >= 3 && correctAnswersCount < 6) return 1
        return 0
    }, [correctAnswersCount])
    
    // Debug log - chỉ log khi game over để tránh spam
    if( game.isGameOver ) {
        console.log('GameOver RENDER - correctAnswersCount:', correctAnswersCount, 'stars:', stars)
    }

    if( game.isGameOver ) {
        return(
            <div className="game-over-anim absolute inset-0 margin-auto grid place-items-center bg-red-400 text-6xl text-white z-50">
                <div className="text-center">
                    <div className="mb-4">THUA ROI</div>
                    <div className="text-4xl mb-2">Kết quả: {correctAnswersCount}/9</div>
                    <div className="flex justify-center gap-4 text-6xl">
                        {[1, 2, 3].map((starNum) => {
                            const isEarned = starNum <= stars
                            return (
                                <span 
                                    key={starNum} 
                                    className={isEarned ? 'text-yellow-400' : 'text-gray-400'}
                                    style={{ opacity: isEarned ? 1 : 0.3 }}
                                >
                                    ⭐
                                </span>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    return <></>

}