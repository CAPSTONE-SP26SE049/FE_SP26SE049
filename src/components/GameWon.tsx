import { MouseEventHandler, useContext, useMemo } from "react"
import { GameContext } from "../App"
import { UseGameContextInterface } from "../hooks/useGameContext"
import { UseLevelsReturn } from "../hooks/useLevels"

interface GameWonProps {
    level       : UseLevelsReturn,
    totalLevels : number,
    correctAnswersCount: number
}

export default function GameWon({ level, totalLevels, correctAnswersCount } : GameWonProps ) : JSX.Element {

    const game: UseGameContextInterface = useContext(GameContext)

    // Tính số sao dựa trên số câu trả lời đúng
    // 3/9 = 1 sao, 6/9 = 2 sao, 9/9 = 3 sao
    const stars = useMemo(() => {
        if (correctAnswersCount >= 9) return 3
        if (correctAnswersCount >= 6 && correctAnswersCount < 9) return 2
        if (correctAnswersCount >= 3 && correctAnswersCount < 6) return 1
        return 0
    }, [correctAnswersCount])
    
    // Debug log - chỉ log khi game won
    if( game.isGameWon ) {
        console.log('GameWon RENDER - correctAnswersCount:', correctAnswersCount, 'stars:', stars)
    }

    function gotoNextLevel() : void {
        level.next()
        game.resetGame()
    }

    function resetGame() : void {
        level.reset()
        game.resetGame()
    }

    if( game.isGameWon ) {
        return(
        <>
            <div className="game-over-anim absolute inset-0 z-40  bg-emerald-400 ">
            </div>


            <div className="game-over-anim absolute inset-0 z-50 grid place-items-center font-bold  text-8xl text-white ">

                { level.current !== totalLevels ? (
                    <NextLevelBtn func={gotoNextLevel} />
                ) : (
                    <ResetGameBtn func={resetGame} />
                )}

                <div className="bg-emerald-700 bg-opacity-50 p-6 text-center">
                    { level.current === totalLevels ? (
                        <span>
                            Ban da chien thang!!!
                        </span>
                    ) : (
                        <span>
                            Tuyet voi!
                        </span>
                    )}
                    <div className="text-4xl mt-4">Kết quả: {correctAnswersCount}/9</div>
                    <div className="flex justify-center gap-4 text-6xl mt-4">
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
        </>
        )
    }

    return <></>

}


interface BtnProps {
    func : MouseEventHandler<HTMLButtonElement>
}


export function NextLevelBtn( {func} : BtnProps ) {
    return(
        <button onClick={ func } className="text-2xl border border-slate-400 bg-slate-600 px-8 py-4 rounded">
            Cap do tiep theo
        </button>
    )
}


export function ResetGameBtn( {func} : BtnProps ) {
    return(
        <button onClick={ func } className="text-2xl border border-slate-400 bg-slate-600 px-8 py-4 rounded">
            Choi lai
        </button>
    )
}