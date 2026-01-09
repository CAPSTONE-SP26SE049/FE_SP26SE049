import sceneryGif from "../assets/2Hải Dương_ Quần thể Côn Sơn - Kiếp Bạc (Cảnh cổ trang_Lịch sử).png"
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
		</div>
	)
}