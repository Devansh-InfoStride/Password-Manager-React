import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import logo from '../assets/Logo.png'

function Header() {
	const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

	useEffect(() => {
		if (theme === 'light') {
			document.body.classList.add('light-mode')
		} else {
			document.body.classList.remove('light-mode')
		}
		localStorage.setItem('theme', theme)
	}, [theme])

	const toggleTheme = () => {
		setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
	}

	return (
		<header className="site-header">
			<nav className="nav-container">
				<Link className="logo" to="/">
					<img src={logo} alt="PassGuard logo" />
					<span>PassGuard</span>
				</Link>

				<ul className="nav-links">
					<li>
						<NavLink to="/" end>
							Home
						</NavLink>
					</li>
					<li>
						<NavLink to="/dashboard">Dashboard</NavLink>
					</li>
					<li>
						<NavLink to="/manage">Manage</NavLink>
					</li>
					<li>
						<NavLink to="/checker">Checker</NavLink>
					</li>
					<li>
						<NavLink to="/generator">Generator</NavLink>
					</li>
					<li>
						<NavLink to="/profile">Profile</NavLink>
					</li>
					<li style={{ display: 'flex', alignItems: 'center' }}>
						<button 
							className="theme-toggle-btn" 
							onClick={toggleTheme} 
							aria-label="Toggle Theme"
							title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
							style={{ marginLeft: '10px' }}
						>
							{theme === 'dark' ? (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
							) : (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
							)}
						</button>
					</li>
				</ul>
			</nav>
		</header>
	)
}

export default Header
