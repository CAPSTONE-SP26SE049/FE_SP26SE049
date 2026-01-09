

export function isCollide(a: HTMLDivElement, b: HTMLDivElement) : boolean {

    // Credit here: https://stackoverflow.com/questions/2440377/javascript-collision-detection

    if(!a || !b) return false

    const aRect = a.getBoundingClientRect()
    const bRect = b.getBoundingClientRect()

    return !(
        ((aRect.top + aRect.height) < (bRect.top)) ||
        (aRect.top > (bRect.top + bRect.height)) ||
        ((aRect.left + aRect.width) < bRect.left) ||
        (aRect.left > (bRect.left + bRect.width))
    );
}

export function isTopCollide(a: HTMLDivElement, b: HTMLDivElement) : boolean {

    if(!a || !b) return false

    const aRect = a.getBoundingClientRect()
    const bRect = b.getBoundingClientRect()

    return (
        ( aRect.top - bRect.bottom, Math.abs(aRect.top - bRect.bottom) < 15  ) &&
        ( aRect.left < bRect.right ) &&
        ( aRect.right > bRect.left )
    );
}

export function isSideOrBottomCollide(mario: HTMLDivElement, platform: HTMLDivElement) : boolean {
    if(!mario || !platform) return false

    const marioRect = mario.getBoundingClientRect()
    const platformRect = platform.getBoundingClientRect()

    // Kiểm tra va chạm tổng quát
    const isColliding = !(
        ((marioRect.top + marioRect.height) < platformRect.top) ||
        (marioRect.top > (platformRect.top + platformRect.height)) ||
        ((marioRect.left + marioRect.width) < platformRect.left) ||
        (marioRect.left > (platformRect.left + platformRect.width))
    )

    if (!isColliding) return false

    // Kiểm tra xem có phải va chạm từ trên xuống không (cho phép đứng trên)
    const isTopCollision = Math.abs(platformRect.top - marioRect.bottom) < 15 &&
                           marioRect.left < platformRect.right &&
                           marioRect.right > platformRect.left

    // Nếu không phải va chạm từ trên xuống, thì là va chạm từ bên cạnh hoặc từ dưới
    return !isTopCollision
}