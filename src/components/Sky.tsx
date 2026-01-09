import cloudImg from "../assets/clouds.png"
import hillImg from "../assets/hill.png"
import hillsEyesImg from "../assets/hills-eyes.png"
import hoGuomImg from "../assets/hoguom.png"
import { gameObject } from "../hooks/useGameObjects"

interface SkyProps {
	sky : gameObject
}

export default function Sky({sky} : SkyProps) {
	return(
		<div 
			id="sky" 
			className='fixed inset-0 z-0 overflow-hidden' 
			ref={sky}
			style={{
				pointerEvents: 'none',
				transform: 'none',
				left: '0 !important',
				top: '0 !important',
				width: '100%',
				height: '100%'
			}}
		>
			{/* Phong cảnh GIF - phóng to tối đa, đưa lên trên crossline, mất ảnh ít nhất, cố định không di chuyển */}
			<img
				src={sceneryGif}
				alt="Scenery background"
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: 'center 30%',
					display: 'block',
					position: 'fixed',
					top: 0,
					left: 0,
					transform: 'none',
					zIndex: 0
				}}
			/>

			<img 
				src={hillImg}
				className="absolute bottom-[49px] left-[100px] h-[200px] max-w-none"
			/>

			<img 
				src={hillsEyesImg}
				className="absolute bottom-[49px] left-[1500px] h-[400px] max-w-none"
			/>

			{/* Phong cảnh Hồ Gươm (pixel) - đặt gần đầu map để dễ thấy */}
			<img
				src={hoGuomImg}
				className="absolute bottom-[49px] left-[2000px] h-[260px] max-w-none"
			/>

		</div>
	)
}