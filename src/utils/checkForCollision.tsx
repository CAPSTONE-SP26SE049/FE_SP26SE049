import { MutableRefObject } from "react"
import { isCollide, isTopCollide, isSideOrBottomCollide } from "./utils"
import { UseGameContextInterface } from "../hooks/useGameContext"
import { Platform, UseGameObjects, gameObject } from "../hooks/useGameObjects"
import { useGravityInterface } from "../hooks/useGravity"

interface CheckForCollisionProps {
    gameObjects   : UseGameObjects,
    game          : UseGameContextInterface,
    gravity       : useGravityInterface,
    maxJumpHeight : MutableRefObject<number>,
    level         : number,
    onPushBack?   : () => void
}

export default function checkForCollision({ 
    gameObjects, game, gravity, maxJumpHeight, level, onPushBack
} : CheckForCollisionProps) : void {

    const mario: HTMLDivElement = gameObjects.mario.current
    let   currentLevel: string  = 'level' + level

    // Check for Goomba collision - đẩy lùi khi va chạm
    const currentLevelGoombas: gameObject[] = gameObjects.goombas[currentLevel]
    currentLevelGoombas?.forEach( goomba => {
        if( isCollide( goomba.current, mario ) ) {
            game.pushBack(150)
        }
    })

    // Check for Giant Goomba collision - đẩy lùi khi va chạm
    const currentLevelGiantGoombas : gameObject[] = gameObjects.giantGoombas[currentLevel]
    currentLevelGiantGoombas?.forEach( giantGoomba => {
        if( isCollide( giantGoomba.current, mario ) ) {
            game.pushBack(200)
        }
    })

    // Check for Bullet Bill collision - đẩy lùi khi va chạm
    if( isCollide( gameObjects.bulletBill.current, mario ) ) {
        game.pushBack(200)
    } 

    // Check for Win Flag collision
    if( isCollide( gameObjects.winFlag.current, mario ) ) {
        game.winGame()
    } 

    // Check for Ground Top Collision
    if( isTopCollide( gameObjects.ground.current, gameObjects.mario.current ) ) {
        resetMaxJumpHeight()
    }

    // Check for Platforms Collision
    let isOnPlatform: boolean = false

    const currentLevelPlatforms: Platform[] = gameObjects.platforms[currentLevel]
    currentLevelPlatforms.forEach( (platform : Platform) => {
        // Kiểm tra va chạm từ trên xuống - cho phép đứng trên platform
        if( isTopCollide( platform.ref.current, gameObjects.mario.current ) ) {
            setPlatformJumpHeight(platform.jumpHeight)
            isOnPlatform = true
        }
        // Kiểm tra va chạm từ bên cạnh - chỉ đẩy lùi nếu đang đi từ phía trước (chưa vượt qua)
        else if( isSideOrBottomCollide( gameObjects.mario.current, platform.ref.current ) ) {
            // Kiểm tra xem nhân vật có đang ở phía trước cột không
            const marioRect = gameObjects.mario.current.getBoundingClientRect()
            const platformRect = platform.ref.current.getBoundingClientRect()
            const distanceToPlatform = platformRect.left - marioRect.right
            
            // Chỉ đẩy lùi nếu đang ở phía trước cột (chưa vượt qua)
            // Nếu đã vượt qua (distance < -50), không đẩy lùi để nhân vật có thể tiếp tục đi
            // Giảm khoảng cách đẩy lùi từ 150 xuống 50 để nhẹ nhàng hơn
            if (distanceToPlatform > -50) {
                game.pushBack(50)
                // Gọi callback để đếm số lần bị đẩy lùi
                if (onPushBack) {
                    onPushBack()
                }
            }
        }
    })
    if( !isOnPlatform ) gravity.resolveGravity()


    function resetMaxJumpHeight() : void {
        maxJumpHeight.current = 300
    }

    function setPlatformJumpHeight(height : number) : void {
        gravity.velocity.current = 0
        maxJumpHeight.current = height
    }

}