import { useState, useEffect } from 'react'

function PasswordManager() {
	const [passwords, setPasswords] = useState([])
	const [form, setForm] = useState({ site: '', username: '', password: '' })
	const [loading, setLoading] = useState(true)
	const [message, setMessage] = useState('')

	const API_URL = 'http://localhost:5000/api/passwords'
	const token = localStorage.getItem('token')

	useEffect(() => {
		fetchPasswords()
	}, [])

	const fetchPasswords = async () => {
		try {
			const response = await fetch(API_URL, {
				headers: { Authorization: `Bearer ${token}` }
			})
			if (response.ok) {
				const data = await response.json()
				setPasswords(data)
			}
		} catch (error) {
			console.error('Error fetching passwords', error)
		} finally {
			setLoading(false)
		}
	}

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value })
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form)
			})
			if (response.ok) {
				const data = await response.json()
				setPasswords([...passwords, data.password])
				setForm({ site: '', username: '', password: '' })
				setMessage('Password saved successfully!')
				setTimeout(() => setMessage(''), 3000)
			}
		} catch (error) {
			console.error('Error saving password', error)
		}
	}

	const handleDelete = async (id) => {
		if (!window.confirm('Are you sure you want to delete this password?')) return
		try {
			const response = await fetch(`${API_URL}/${id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			})
			if (response.ok) {
				setPasswords(passwords.filter((p) => p._id !== id))
			}
		} catch (error) {
			console.error('Error deleting password', error)
		}
	}

	return (
		<section className="page-section narrow">
			<div className="page-heading">
				<p className="eyebrow">Vault</p>
				<h1>Password Manager</h1>
				<p>Securely save and manage your passwords for different sites.</p>
			</div>

			<div className="form-card">
				<form onSubmit={handleSubmit} className="stacked-form">
					<label htmlFor="site">Site Name</label>
					<input id="site" name="site" type="text" value={form.site} onChange={handleChange} placeholder="e.g. Google, GitHub" required />

					<label htmlFor="username">Username/Email</label>
					<input id="username" name="username" type="text" value={form.username} onChange={handleChange} placeholder="Username or Email" required />

					<label htmlFor="password">Password</label>
					<input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" required />

					<button type="submit">Save Password</button>
				</form>
				{message && <p className="success-message">{message}</p>}
			</div>

			<div className="results-section">
				<h2>Your Saved Passwords</h2>
				{loading ? (
					<p>Loading passwords...</p>
				) : passwords.length === 0 ? (
					<p>No passwords saved yet.</p>
				) : (
					<div className="password-grid">
						{passwords.map((p) => (
							<article className="password-item" key={p._id}>
								<div className="password-info">
									<p className="password-label">{p.site}</p>
									<p className="password-username">User: {p.username}</p>
									<div className="password-field">
										<input type="text" value={p.password} readOnly />
									</div>
								</div>
								<button type="button" onClick={() => handleDelete(p._id)} className="delete-btn">
									Delete
								</button>
							</article>
						))}
					</div>
				)}
			</div>
		</section>
	)
}

export default PasswordManager
