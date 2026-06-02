import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../../utils/auth'
import { useShare } from '../../context/ShareContext'
import VaultModal from './VaultModal'
import { encryptWithPublicKey, decryptWithPrivateKey } from '../../utils/cryptoUtils'
import '../../styles/modal.css'

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
	const [sharedPasswords, setSharedPasswords] = useState([])
	const [view, setView] = useState('my-passwords') // 'my-passwords' or 'shared-with-me'
	const [form, setForm] = useState({ site: '', username: '', password: '' })
	const [loading, setLoading] = useState(true)
	const [message, setMessage] = useState('')
	const [editingId, setEditingId] = useState(null)
	const [showFormPassword, setShowFormPassword] = useState(false)
	const [visiblePasswords, setVisiblePasswords] = useState({})
	
	// Sharing state
	const [sharingPassword, setSharingPassword] = useState(null)
	const [receiverId, setReceiverId] = useState('')
	const [isSharing, setIsSharing] = useState(false)

	const { privateKey, isLocked } = useShare()

	const API_URL = 'http://localhost:5000/api/passwords'

	useEffect(() => {
		if (view === 'my-passwords') {
			fetchPasswords()
		} else {
			fetchSharedPasswords()
		}
	}, [view])

	const fetchPasswords = async () => {
		try {
			setLoading(true)
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

	const fetchSharedPasswords = async () => {
		try {
			setLoading(true)
			const response = await fetchWithAuth('http://localhost:5000/api/share/received')
			if (response && response.ok) {
				const data = await response.json()
				setSharedPasswords(data)
			}
		} catch (error) {
			console.error('Error fetching shared passwords', error)
		} finally {
			setLoading(false)
		}
	}

	const handleShare = async (e) => {
		e.preventDefault()
		setIsSharing(true)
		setMessage('')
		try {
			// 1. Fetch receiver's public key
			const keyRes = await fetchWithAuth(`http://localhost:5000/api/users/public-key/${receiverId}`)
			if (!keyRes || !keyRes.ok) {
				const errorData = await keyRes.json()
				throw new Error(errorData.error || 'Receiver not found or sharing not setup')
			}
			const { publicKey: receiverPubKey } = await keyRes.json()

			// 2. Encrypt password with receiver's public key
			const encryptedPassword = await encryptWithPublicKey(sharingPassword.password, receiverPubKey)

			// 3. Send to server
			const shareRes = await fetchWithAuth('http://localhost:5000/api/share', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					receiverId,
					site: sharingPassword.site,
					username: sharingPassword.username,
					encryptedPassword
				})
			})

			if (shareRes && shareRes.ok) {
				setMessage(`Successfully shared with user ${receiverId}`)
				setTimeout(() => {
					setSharingPassword(null)
					setReceiverId('')
					setMessage('')
				}, 2000)
			} else {
				throw new Error('Failed to share password')
			}
		} catch (error) {
			setMessage('Error: ' + error.message)
		} finally {
			setIsSharing(false)
		}
	}

	const decryptSharedPassword = async (p) => {
		if (isLocked) {
			alert('Please unlock your sharing vault first.')
			return
		}
		try {
			const decrypted = await decryptWithPrivateKey(p.encryptedPassword, privateKey)
			alert(`Decrypted Password for ${p.site}: ${decrypted}`)
		} catch (error) {
			console.error('Decryption failed:', error)
			alert('Failed to decrypt. Ensure your Master Password is correct.')
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
			<VaultModal />
			
			<div className="page-heading">
				<p className="eyebrow">Vault</p>
				<h1>Password Manager</h1>
				<p>Securely save and manage your passwords for different sites.</p>
			</div>

			<div className="tab-navigation" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
				<button 
					className={`tab-btn ${view === 'my-passwords' ? 'active' : ''}`}
					onClick={() => setView('my-passwords')}
					style={{ background: view === 'my-passwords' ? '#3b82f6' : '#64748b', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
				>
					My Passwords
				</button>
				<button 
					className={`tab-btn ${view === 'shared-with-me' ? 'active' : ''}`}
					onClick={() => setView('shared-with-me')}
					style={{ background: view === 'shared-with-me' ? '#3b82f6' : '#64748b', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
				>
					Shared with Me
				</button>
			</div>

			{view === 'my-passwords' && (
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
			)}

			<div className="results-section">
				<h2>{view === 'my-passwords' ? 'Your Saved Passwords' : 'Passwords Shared with You'}</h2>
				{loading ? (
					<p>Loading...</p>
				) : view === 'my-passwords' ? (
					passwords.length === 0 ? (
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
									<div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
										<button type="button" onClick={() => startEditing(p)} style={{ background: '#3b82f6', flex: 1, color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
											Edit
										</button>
										<button type="button" onClick={() => setSharingPassword(p)} style={{ background: '#8b5cf6', flex: 1, color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
											Share
										</button>
										<button type="button" onClick={() => handleDelete(p._id)} className="delete-btn" style={{ flex: '1 0 100%', background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', marginTop: '8px' }}>
											Delete
										</button>
									</div>
								</article>
								)
							})}
						</div>
					)
				) : (
					sharedPasswords.length === 0 ? (
						<p>No passwords shared with you yet.</p>
					) : (
						<div className="password-grid">
							{sharedPasswords.map((p) => (
								<article className="password-item" key={p._id}>
									<div className="password-info">
										<p className="password-label">{p.site}</p>
										<p className="password-username">User: {p.username}</p>
										<p className="password-username">Shared by: {p.senderId.name}</p>
										<div className="password-field">
											<div className="password-value password-value-row">
												<span className="password-value-text">••••••••</span>
												<button
													type="button"
													className="icon-toggle"
													onClick={() => decryptSharedPassword(p)}
													aria-label="Decrypt and view"
												>
													<VisibilityIcon visible={false} />
												</button>
											</div>
										</div>
										<p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
											Shared on: {new Date(p.timestamp).toLocaleDateString()}
										</p>
									</div>
								</article>
							))}
						</div>
					)
				)}
			</div>

			{/* Share Modal */}
			{sharingPassword && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h3>Share Password for {sharingPassword.site}</h3>
						<p>Enter the Recipient's User ID to share this password securely.</p>
						<form onSubmit={handleShare} className="stacked-form">
							<label htmlFor="receiverId">Recipient User ID</label>
							<input 
								id="receiverId"
								type="text" 
								value={receiverId} 
								onChange={(e) => setReceiverId(e.target.value)} 
								placeholder="Paste User ID here"
								required 
							/>
							<div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
								<button type="submit" disabled={isSharing} style={{ background: '#8b5cf6', flex: 1, color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
									{isSharing ? 'Sharing...' : 'Confirm Share'}
								</button>
								<button type="button" onClick={() => { setSharingPassword(null); setMessage(''); }} style={{ background: '#64748b', flex: 1, color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
									Cancel
								</button>
							</div>
						</form>
						{message && <p className={message.startsWith('Error') ? 'error-message' : 'success-message'} style={{ marginTop: '1rem' }}>{message}</p>}
					</div>
				</div>
			)}
		</section>
	)
}

export default PasswordManager