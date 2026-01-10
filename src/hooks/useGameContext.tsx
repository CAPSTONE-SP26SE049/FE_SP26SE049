import { useState } from "react"
import { UsePlayerPosition } from "./usePlayerPosition"
import { UseGameObjects, gameObject } from "./useGameObjects"
import { UseController } from "./useController"


interface UseGameContextProps {
    playerPosition : UsePlayerPosition, 
    gameObjects    : UseGameObjects,
    controller     : UseController
}

export interface UseGameContextInterface {
    isGameOver     : boolean,
    isGameWon      : boolean,
    endGame        : Function,
    winGame        : Function,
    resetGame      : Function,
    pushBack       : Function,
    mario          : gameObject,
    playerPosition : UsePlayerPosition,
    controller     : UseController,
    gameObjects    : UseGameObjects
}

export default function useGameContext(
    {playerPosition, gameObjects, controller} : UseGameContextProps
) : UseGameContextInterface  {

    const [isGameOver, setIsGameOver] = useState(false)
    const [isGameWon, setIsGameWon]   = useState(false)

    const mario = gameObjects.mario

    function endGame() : void {
        setIsGameOver(true)
    }

    function winGame(): void {
        setIsGameWon(true)
    }

    function resetGame() : void {
        resetCamera()
        resetMario()
        resetPlayerPosition()
        resetSkyPosition()
        resetGameState()
    }
    
    // Helper functions
    
    function resetMario() : void {
        gameObjects.mario.current.classList.add('is-facing-right')
        gameObjects.mario.current.classList.remove('is-facing-left')
        gameObjects.mario.current.style.translate = "0"
    }
    
    function resetCamera() : void {
        gameObjects.camera.current.style.left = '0px'
    }
    
    function resetPlayerPosition() : void {
        playerPosition.setPosition({x: 0, y: 0})
    }
    
    function resetSkyPosition() {
        gameObjects.sky.current.style.left ='0px'
    }

    function resetGameState() {
        setIsGameOver(false)
        setIsGameWon(false)
    }

    function pushBack(pushDistance: number = 100) : void {
        // Xác định hướng Mario đang di chuyển và đẩy về phía ngược lại
        const isMovingRight = controller.controllerRef.current.right
        const isMovingLeft = controller.controllerRef.current.left
        
        if (isMovingRight) {
            // Đang di chuyển sang phải -> đẩy về trái
            playerPosition.setPosition(prev => ({ 
                x: prev.x + pushDistance, 
                y: prev.y 
            }))
            // Đẩy Mario về phía trái trong frame
            let currentTranslate: string = gameObjects.mario.current.style.translate || "0px"
            let currentPos: number = Number(currentTranslate.slice(0, -2)) || 0
            let newPos: number = currentPos - pushDistance / 2
            if (newPos >= -100) {
                gameObjects.mario.current.style.translate = newPos + 'px'
            }
        } else if (isMovingLeft) {
            // Đang di chuyển sang trái -> đẩy về phải
            playerPosition.setPosition(prev => ({ 
                x: prev.x - pushDistance, 
                y: prev.y 
            }))
            // Đẩy Mario về phía phải trong frame
            let currentTranslate: string = gameObjects.mario.current.style.translate || "0px"
            let currentPos: number = Number(currentTranslate.slice(0, -2)) || 0
            let newPos: number = currentPos + pushDistance / 2
            if (newPos <= 100) {
                gameObjects.mario.current.style.translate = newPos + 'px'
            }
        } else {
            // Không di chuyển -> đẩy về phía sau (mặc định về trái)
            playerPosition.setPosition(prev => ({ 
                x: prev.x + pushDistance, 
                y: prev.y 
            }))
        }
        
        // Cập nhật camera và background theo player
        gameObjects.camera.current.style.left = playerPosition.playerPosRef.current.x + 'px'
        gameObjects.sky.current.style.left = playerPosition.playerPosRef.current.x + 'px'
    }
    
    return { 
        isGameOver, isGameWon, 
        winGame, endGame, resetGame, pushBack,
        mario, controller, playerPosition, gameObjects,
    }
}