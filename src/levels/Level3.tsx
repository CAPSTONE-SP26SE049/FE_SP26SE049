import GiantGoomba from "../components/GiantGoomba";
import Platform from "../components/Platform";
import { LevelProps } from "./Level";


export default function level3({ gameObjects, level } : LevelProps) : JSX.Element {

    const { platforms, giantGoombas } = gameObjects

    return level.current === 3 ? (
        <>
            {/* 10 cột xanh, khoảng cách ~2300px (7.5s với speed=5) */}
            <Platform platform={platforms.level3[0].ref}  x={800}   y={49} type="pipe" />
            <Platform platform={platforms.level3[1].ref}  x={3100}  y={49} type="pipe" />
            <Platform platform={platforms.level3[2].ref}  x={5400}  y={49} type="pipe" />
            <Platform platform={platforms.level3[3].ref}  x={7700}  y={49} type="pipe" />
            <Platform platform={platforms.level3[4].ref}  x={10000} y={49} type="pipe" />
            <Platform platform={platforms.level3[5].ref}  x={12300} y={49} type="pipe" />
            <Platform platform={platforms.level3[6].ref}  x={14600} y={49} type="pipe" />
            <Platform platform={platforms.level3[7].ref}  x={16900} y={49} type="pipe" />
            <Platform platform={platforms.level3[8].ref}  x={19200} y={49} type="pipe" />
            <Platform platform={platforms.level3[9].ref}  x={21500} y={49} type="pipe" />

            {/* Vật cản đã bị ẩn - chỉ giữ lại cột xanh (Platform) */}
            {/* <GiantGoomba giantGoomba={giantGoombas.level3[0]} x={1000} />
            <GiantGoomba giantGoomba={giantGoombas.level3[1]} x={2500} />
            <GiantGoomba giantGoomba={giantGoombas.level3[2]} x={4000} />
            <GiantGoomba giantGoomba={giantGoombas.level3[3]} x={5500} />
            <GiantGoomba giantGoomba={giantGoombas.level3[4]} x={6500} />
            <GiantGoomba giantGoomba={giantGoombas.level3[5]} x={7600} /> */}
        </>
    ) : (
        <></>
    )

}