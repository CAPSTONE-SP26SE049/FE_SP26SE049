import type React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'

const HomePage: React.FC = () => {
  const { isAuthenticated, session, logout } = useAuth()

  return (
    <div style={{ padding: 32 }}>
      <h1>SpeakVN Portal</h1>
      <p>Chào mừng bạn đến với hệ thống SpeakVN.</p>

      {isAuthenticated && session ? (
        <div style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Xin chào, {session.user.name} ({session.user.role})</h3>
          <p>Bạn đang đăng nhập.</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            {session.user.role === 'admin' && (
              <Link to="/admin">Go to Admin Dashboard</Link>
            )}
            {session.user.role === 'educator' && (
              <Link to="/educator">Go to Educator Dashboard</Link>
            )}
            {session.user.role === 'user' && (
              <Link to="/learner/roadmap">Go to Learning Roadmap</Link>
            )}
            <button onClick={logout} style={{ cursor: 'pointer', color: 'red' }}>Logout</button>
          </div>
        </div>
      ) : (
        <p>
          <Link to="/login">Đi tới trang đăng nhập</Link>
        </p>
      )}
    </div>
  )
}

export default HomePage

