import type React from 'react'
import './App.css'
import { AppRouter } from './router/AppRouter'
import { AuthProvider } from './core/auth/AuthContext'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
