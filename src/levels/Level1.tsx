import Platform from "../components/Platform";
import { LevelProps } from "./Level";


export default function Level1({ gameObjects, level } : LevelProps) : JSX.Element {

    const { platforms } = gameObjects

    return level.current === 1 ? (
        <>
            {/* 9 cột xanh, khoảng cách ~2300px (7.5s với speed=5) - đã bỏ cột đầu tiên */}
            <Platform platform={platforms.level1[0].ref}  x={3100}  y={49} type="pipe" width={120} />
            <Platform platform={platforms.level1[1].ref}  x={5400}  y={49} type="pipe" width={120} />
            <Platform platform={platforms.level1[2].ref}  x={7700}  y={49} type="pipe" width={120} />
            <Platform platform={platforms.level1[3].ref}  x={10000} y={49} type="pipe" width={120} />
            <Platform platform={platforms.level1[4].ref}  x={12300} y={49} type="pipe" width={120} />
            <Platform platform={platforms.level1[5].ref}  x={14600} y={49} type="pipe" width={120} />
            <Platform platform={platforms.level1[6].ref}  x={16900} y={49} type="pipe" width={120} />
            <Platform platform={platforms.level1[7].ref}  x={19200} y={49} type="pipe" width={120} />
            <Platform platform={platforms.level1[8].ref}  x={21500} y={49} type="pipe" width={120} />

        </>
    ) : (
        <></>
    )
}