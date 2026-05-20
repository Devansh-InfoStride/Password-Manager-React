import { Link, NavLink } from 'react-router-dom'
import logo from '../assets/Logo.png'

function Header() {
	const handleLogout = () => {
		localStorage.removeItem('token');
		window.location.href = 'http://localhost:5173/login';
	};

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
						<button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--muted)', padding: '10px 14px', borderRadius: '999px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
							Logout
						</button>
					</li>
				</ul>
			</nav>
		</header>
	)
}

export default Header
