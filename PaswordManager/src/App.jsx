import { useEffect } from 'react'
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Header from './Components/header'
import Footer from './Components/footer'
import PasswordStrengthChecker from './Components/features/passwordStrengthChecker'
import PasswordGenerator from './Components/features/passwordGenerator'
import PasswordManager from './Components/features/passwordManager'
import PasswordDashboard from './Components/features/passwordDashboard'
import './App.css'

const homeCards = [
	{
		title: 'Dashboard Analytics',
		text: 'View your password security overview and health.',
		to: '/dashboard',
		button: 'View Dashboard',
	},
	{
		title: 'Check Your Password Strength',
		text: 'Enter a password and see how strong it is.',
		to: '/checker',
		button: 'Check Strength',
	},
	{
		title: 'Generate a Strong Password',
		text: 'Create a secure password based on your details.',
		to: '/generator',
		button: 'Generate Password',
	},
	{
		title: 'Save and Manage Passwords',
		text: 'Keep your passwords in one secure place.',
		to: '/manage',
		button: 'Explore',
	},
]

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

			<div className="card-grid">
				{homeCards.map((card) => (
					<article className="feature-card" key={card.title}>
						<h2>{card.title}</h2>
						<p>{card.text}</p>
						<Link className="button-link" to={card.to}>
							{card.button}
						</Link>
					</article>
				))}
			</div>
		</section>
	)
}

function App() {
  useEffect(() => {
		// If the Password Manager was opened with a `token` query param (handed off
		// from the Login app on a different dev port), save it into this origin's
		// localStorage and remove the param from the URL.
		try {
			const params = new URLSearchParams(window.location.search);
			const tokenFromUrl = params.get('token');
			if (tokenFromUrl) {
				localStorage.setItem('token', tokenFromUrl);
				params.delete('token');
				const newSearch = params.toString();
				const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
				window.history.replaceState(null, '', newUrl);
			}
		} catch (e) {
			// ignore malformed URL
		}

		const token = localStorage.getItem('token');
		if (!token) {
			// Redirect to the Login application if no token is found
			window.location.href = 'http://localhost:5174';
		}
  }, []);

  return (
		<Routes>
			<Route element={<Layout />}>
				<Route index element={<HomePage />} />
				<Route path="dashboard" element={<PasswordDashboard />} />
				<Route path="checker" element={<PasswordStrengthChecker />} />
				<Route path="generator" element={<PasswordGenerator />} />
				<Route path="manage" element={<PasswordManager />} />
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
  )
}

export default App
