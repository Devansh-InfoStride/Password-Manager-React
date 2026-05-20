import { useState, useEffect } from 'react'

function PasswordManager() {
	const [passwords, setPasswords] = useState([])
	const [form, setForm] = useState({ site: '', username: '', password: '' })
	const [loading, setLoading] = useState(true)
	const [message, setMessage] = useState('')
	const [editingId, setEditingId] = useState(null)

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
		if (editingId) {
			handleUpdate()
		} else {
			handleSave()
		}
	}

	const handleSave = async () => {
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

	const handleUpdate = async () => {
		try {
			const response = await fetch(`${API_URL}/${editingId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form)
			})
			if (response.ok) {
				const data = await response.json()
				setPasswords(passwords.map(p => p._id === editingId ? data.password : p))
				setForm({ site: '', username: '', password: '' })
				setEditingId(null)
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

	const startEditing = (password) => {
		setEditingId(password._id)
		setForm({ site: password.site, username: password.username, password: password.password })
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const cancelEdit = () => {
		setEditingId(null)
		setForm({ site: '', username: '', password: '' })
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
						{passwords.map((p) => (
							<article className="password-item" key={p._id}>
								<div className="password-info">
									<p className="password-label">{p.site}</p>
									<p className="password-username">User: {p.username}</p>
									<div className="password-field">
										<input type="text" value={p.password} readOnly />
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
						))}
					</div>
				)}
			</div>
		</section>
	)
}

export default PasswordManager
