import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Header from './Components/header'
import Footer from './Components/footer'
import PasswordStrengthChecker from './Components/features/passwordStrengthChecker'
import PasswordGenerator from './Components/features/passwordGenerator'
import PasswordManager from './Components/features/passwordManager'
import PasswordDashboard from './Components/features/passwordDashboard'
import UserProfile from './Components/features/userProfile'
import Login from './Components/auth/Login'
import Signup from './Components/auth/Signup'
import './App.css'



// Guards the main app routes: sends anyone without a token to /login.
function RequireAuth() {
	const token = localStorage.getItem('token')
	if (!token) {
		return <Navigate to="/login" replace />
	}
	return <Outlet />
}

function Layout() {
	return (
		<>
			<Header />
			<main className="main-content">
				<Outlet />
			</main>
			<Footer />
		</>
	)
}

function HomePage() {
	return (
		<section className="page-section">
			<div className="hero">
				<p className="eyebrow">PassGuard</p>
				<h1>Welcome to your personalized password manager</h1>
				<p className="hero-text">
					Check password strength, generate safer passwords, and keep your digital life organized.
				</p>
			</div>

			<div className="bento-grid">
				<Link to="/dashboard" className="bento-item bento-large">
					<h2>Dashboard Analytics</h2>
					<p>Get a comprehensive overview of your vault's security health, exposed passwords, and overall safety score in real-time.</p>
					<div className="bento-action">
						<span className="button-link">View Dashboard</span>
					</div>
				</Link>

				<Link to="/checker" className="bento-item bento-medium">
					<h2>Strength Checker</h2>
					<p>Instantly analyze the resilience of your passwords against modern cracking techniques.</p>
					<div className="bento-action">
						<span className="button-link">Test Password</span>
					</div>
				</Link>

				<Link to="/generator" className="bento-item bento-wide">
					<h2>Smart Generator</h2>
					<p>Create cryptographically secure, unpredictable passwords instantly.</p>
					<div className="bento-action">
						<span className="button-link">Generate</span>
					</div>
				</Link>
				
				<Link to="/manage" className="bento-item bento-small">
					<h2>Your Vault</h2>
					<p>Access your securely encrypted credentials.</p>
					<div className="bento-action">
						<span className="button-link">Open</span>
					</div>
				</Link>
			</div>
		</section>
	)
}

function App() {
  return (
		<Routes>
			<Route path="login" element={<Login />} />
			<Route path="signup" element={<Signup />} />
			<Route element={<RequireAuth />}>
				<Route element={<Layout />}>
					<Route index element={<HomePage />} />
					<Route path="dashboard" element={<PasswordDashboard />} />
					<Route path="checker" element={<PasswordStrengthChecker />} />
					<Route path="generator" element={<PasswordGenerator />} />
					<Route path="manage" element={<PasswordManager />} />
					<Route path="profile" element={<UserProfile />} />
				</Route>
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
  )
}

export default App
