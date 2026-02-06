import type React from 'react'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  return (
    <div style={{ padding: 32 }}>
      <h1>SpeakVN Portal</h1>
      <p>Chào mừng bạn đến với hệ thống SpeakVN.</p>
      <p>
        <Link to="/login">Đi tới trang đăng nhập</Link>
      </p>
    </div>
  )
}

export default HomePage

