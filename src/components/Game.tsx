import { ReactElement } from "react"

interface GameProps {
	children : ReactElement[] | ReactElement
}

export default function Game({children} : GameProps) {
	return (
		<>
			<div id="game" className='fixed inset-0 w-screen h-screen'>
				{/* Màn hình game full màn hình */}
				<div className='relative w-full h-full overflow-hidden border border-slate-400'>
					{children}
				</div>
			</div>
		</>
	)
}
