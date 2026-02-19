import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Learn from './pages/Learn';
import Practice from './pages/PracticePage';
import AdminDashboard from './pages/Admin';
import EducatorDashboard from './pages/Educator';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import PhoneticGuide from './pages/PhoneticGuide';
import GameLayout from './components/layout/GameLayout';

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				{/* Placeholder for future routes */}
				<Route path="/learn" element={<GameLayout><Learn /></GameLayout>} />
				<Route path="/practice/:levelId" element={<Practice />} />
				<Route path="/admin" element={<AdminDashboard />} />
				<Route path="/educator" element={<EducatorDashboard />} />
				<Route path="/leaderboard" element={<GameLayout><Leaderboard /></GameLayout>} />
				<Route path="/profile" element={<GameLayout><Profile /></GameLayout>} />
				<Route path="/guide" element={<GameLayout><PhoneticGuide /></GameLayout>} />
			</Routes>
		</Router>
	);
}

export default App;
