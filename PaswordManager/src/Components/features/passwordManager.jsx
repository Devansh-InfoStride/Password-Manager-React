import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../../utils/auth'

function VisibilityIcon({ visible }) {
	if (visible) {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
			</svg>
		)
	}

	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M3 3l18 18"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M10.5 6.4A11.2 11.2 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.6 4.1"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M6.2 9.2A17 17 0 0 0 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.1-.8"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

const maskPassword = (value = '') => {
	const length = Math.max(String(value).length, 8)
	return '\u2022'.repeat(length)
}

function PasswordManager() {
	const [passwords, setPasswords] = useState([])
	const [form, setForm] = useState({ site: '', username: '', password: '' })
	const [loading, setLoading] = useState(true)
	const [message, setMessage] = useState('')
	const [editingId, setEditingId] = useState(null)
	const [showFormPassword, setShowFormPassword] = useState(false)
	const [visiblePasswords, setVisiblePasswords] = useState({})

	const API_URL = 'http://localhost:5000/api/passwords'

	useEffect(() => {
		fetchPasswords()
	}, [])

	const fetchPasswords = async () => {
		try {
			const response = await fetchWithAuth(API_URL)
			if (response && response.ok) {
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
		if (editingId) {
			handleUpdate()
		} else {
			handleSave()
		}
	}

	const handleSave = async () => {
		try {
			const response = await fetchWithAuth(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			})
			if (response && response.ok) {
				const data = await response.json()
				setPasswords([...passwords, data.password])
				setForm({ site: '', username: '', password: '' })
				setShowFormPassword(false)
				setMessage('Password saved successfully!')
				setTimeout(() => setMessage(''), 3000)
			}
		} catch (error) {
			console.error('Error saving password', error)
		}
	}

	const handleUpdate = async () => {
		try {
			const response = await fetchWithAuth(`${API_URL}/${editingId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			})
			if (response && response.ok) {
				const data = await response.json()
				setPasswords(passwords.map(p => p._id === editingId ? data.password : p))
				setForm({ site: '', username: '', password: '' })
				setEditingId(null)
				setShowFormPassword(false)
				setMessage('Password updated successfully!')
				setTimeout(() => setMessage(''), 3000)
			}
		} catch (error) {
			console.error('Error updating password', error)
		}
	}

	const handleDelete = async (id) => {
		if (!window.confirm('Are you sure you want to delete this password?')) return
		try {
			const response = await fetchWithAuth(`${API_URL}/${id}`, {
				method: 'DELETE'
			})
			if (response && response.ok) {
				setPasswords(passwords.filter((p) => p._id !== id))
			}
		} catch (error) {
			console.error('Error deleting password', error)
		}
	}

	const startEditing = (password) => {
		setEditingId(password._id)
		setForm({ site: password.site, username: password.username, password: password.password })
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const cancelEdit = () => {
		setEditingId(null)
		setForm({ site: '', username: '', password: '' })
		setShowFormPassword(false)
	}

	const toggleSavedPasswordVisibility = (id) => {
		setVisiblePasswords((current) => ({
			...current,
			[id]: !current[id],
		}))
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
					<div className="password-input-wrap">
						<input
							id="password"
							name="password"
							type={showFormPassword ? 'text' : 'password'}
							value={form.password}
							onChange={handleChange}
							placeholder="Password"
							required
						/>
						<button
							type="button"
							className="icon-toggle"
							onClick={() => setShowFormPassword((current) => !current)}
							aria-label={showFormPassword ? 'Hide password' : 'Show password'}
							aria-pressed={showFormPassword}
						>
							<VisibilityIcon visible={showFormPassword} />
						</button>
					</div>

					<div style={{ display: 'flex', gap: '10px' }}>
						<button type="submit" style={{ flex: 1 }}>{editingId ? 'Update Password' : 'Save Password'}</button>
						{editingId && <button type="button" onClick={cancelEdit} style={{ background: '#64748b' }}>Cancel</button>}
					</div>
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
						{passwords.map((p) => {
							const isVisible = Boolean(visiblePasswords[p._id])

							return (
								<article className="password-item" key={p._id}>
								<div className="password-info">
									<p className="password-label">{p.site}</p>
									<p className="password-username">User: {p.username}</p>
									<div className="password-field">
										<div className="password-value password-value-row">
											<span className="password-value-text">{isVisible ? p.password : maskPassword(p.password)}</span>
											<button
												type="button"
												className="icon-toggle"
												onClick={() => toggleSavedPasswordVisibility(p._id)}
												aria-label={isVisible ? `Hide password for ${p.site}` : `Show password for ${p.site}`}
												aria-pressed={isVisible}
											>
												<VisibilityIcon visible={isVisible} />
											</button>
										</div>
									</div>
									<p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
										Last Updated: {p.last_updated ? new Date(p.last_updated).toLocaleDateString() : 'Never'}
									</p>
								</div>
								<div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
									<button type="button" onClick={() => startEditing(p)} style={{ background: '#3b82f6', flex: 1 }}>
										Edit
									</button>
									<button type="button" onClick={() => handleDelete(p._id)} className="delete-btn" style={{ flex: 1 }}>
										Delete
									</button>
								</div>
							</article>
							)
						})}
					</div>
				)}
			</div>
		</section>
	)
}

export default PasswordManager
