import pipeImg from "../assets/pipe.png"
import { gameObject } from "../hooks/useGameObjects"

interface PlatformProps {
    platform : gameObject,
    x        : number,
    y        : number,
    type?    : 'pipe' | 'ledge',
    width?   : number
}

export default function Platform({ platform, x, y, type = 'ledge', width = 300 } : PlatformProps) {

    // Hide brick ledge platforms as requested; keep pipes visible
    if (type === 'ledge') {
        return <></>
    }

    return(
        <div 
            ref={platform}
            className={` platform
                absolute overflow-hidden
                ${ type === 'pipe' ? `w-[120px] h-[120px]` : '' } 
                ${ type === 'ledge' ? `h-[50px] brick` : ''}
            `}
            style={{left : x + 'px', bottom : y + 'px', width : width + 'px'}}
        >
            { type === 'pipe' && <img src={pipeImg} className="w-full h-full object-cover" /> }

        </div>
    )
}