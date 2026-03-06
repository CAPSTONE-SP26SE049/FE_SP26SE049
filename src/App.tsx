import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing';
// // import Login from './pages/Login';
// import Register from './pages/Register';
import Learn from './pages/Learn';
import Practice from './pages/PracticePage';
// import AdminDashboard from './pages/Admin';
// import EducatorDashboard from './pages/Educator';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import PhoneticGuide from './pages/PhoneticGuide';
import GameLayout from './components/layout/GameLayout';

import { AuthProvider } from './core/auth/AuthContext';
import { AppRoutes } from './router/AppRouter';

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/" element={<Landing />} />
					{/* <Route path="/login" element={<Login />} /> */}
					{/* <Route path="/register" element={<Register />} /> */}

					{/* Game Routes */}
					<Route path="/learn" element={<GameLayout><Learn /></GameLayout>} />
					<Route path="/practice/:levelId" element={<Practice />} />
					<Route path="/leaderboard" element={<GameLayout><Leaderboard /></GameLayout>} />
					<Route path="/profile" element={<GameLayout><Profile /></GameLayout>} />
					<Route path="/guide" element={<GameLayout><PhoneticGuide /></GameLayout>} />

					{/* Admin & Educator Routes are handled by AppRoutes */}
					{/* <Route path="/admin" element={<AdminDashboard />} /> */}
					{/* <Route path="/educator" element={<EducatorDashboard />} /> */}

					{/* Merged Routes from frontend/src */}
					<Route path="/*" element={<AppRoutes />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
}

export default App;
