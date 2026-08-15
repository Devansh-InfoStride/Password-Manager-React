import { useState, useEffect, useRef, useMemo } from 'react'
import { fetchWithAuth } from '../../utils/auth'
import { useShare } from '../../context/ShareContext'
import VaultModal from './VaultModal'
import { useToast } from '../ui/Toast'
import ConfirmDialog from '../ui/ConfirmDialog'
import {
	VisibilityIcon,
	CopyIcon,
	CheckIcon,
	SearchIcon,
	ShareIcon,
	EditIcon,
	TrashIcon,
	StarIcon,
	XIcon,
	ShieldCheckIcon,
	LockIcon,
	KeyIcon,
	ClockIcon,
	InboxIcon,
	SendIcon,
} from '../ui/icons'
import { encryptWithPublicKey, decryptWithPrivateKey } from '../../utils/cryptoUtils'
import '../../styles/modal.css'
import '../../styles/vault.css'

const FAVORITES_KEY = 'vault:favorites'
const REVEAL_TIMEOUT = 20000 // auto-hide a revealed secret after 20s

// Deterministic, calm avatar color from the site name so each credential is
// instantly recognizable without leaking anything sensitive.
const AVATAR_COLORS = ['#5b7cfa', '#3ecf8e', '#e0a53f', '#9b7cf5', '#4aa3df', '#e06b8b', '#3fb9b0', '#d98246']
const avatarColor = (str = '') => {
	let hash = 0
	for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
	return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const maskPassword = (value = '') => '•'.repeat(Math.min(Math.max(String(value).length, 8), 20))

function PasswordManager() {
	const [passwords, setPasswords] = useState([])
	const [sharedPasswords, setSharedPasswords] = useState([])
	const [sentSharedPasswords, setSentSharedPasswords] = useState([])
	const [view, setView] = useState('my-passwords') // 'my-passwords', 'shared-with-me', or 'shared-by-me'
	const [form, setForm] = useState({ site: '', username: '', password: '' })
	const [loading, setLoading] = useState(true)
	const [message, setMessage] = useState('')
	const [editingId, setEditingId] = useState(null)
	const [showFormPassword, setShowFormPassword] = useState(false)
	const [visiblePasswords, setVisiblePasswords] = useState({})
	const [query, setQuery] = useState('')
	const [favorites, setFavorites] = useState(() => {
		try {
			return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'))
		} catch {
			return new Set()
		}
	})
	const [copiedKey, setCopiedKey] = useState(null)
	const [revealedShared, setRevealedShared] = useState({}) // id -> decrypted string
	const [confirmState, setConfirmState] = useState(null) // { kind, id, site, busy }

	// Sharing state
	const [sharingPassword, setSharingPassword] = useState(null)
	const [receiverId, setReceiverId] = useState('')
	const [isSharing, setIsSharing] = useState(false)

	const { privateKey, isLocked } = useShare()
	const { toast } = useToast()

	const timersRef = useRef({}) // per-key auto-hide timers
	const copyTimerRef = useRef(null)

	const API_URL = '/api/passwords'

	useEffect(() => {
		return () => {
			Object.values(timersRef.current).forEach((t) => window.clearTimeout(t))
			window.clearTimeout(copyTimerRef.current)
		}
	}, [])

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
			const response = await fetchWithAuth('/api/share/received')
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

	const fetchSentSharedPasswords = async () => {
		try {
			setLoading(true)
			const response = await fetchWithAuth('/api/share/sent')
			if (response && response.ok) {
				const data = await response.json()
				setSentSharedPasswords(data)
			}
		} catch (error) {
			console.error('Error fetching sent shared passwords', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (view === 'my-passwords') {
			fetchPasswords()
		} else if (view === 'shared-with-me') {
			fetchSharedPasswords()
		} else if (view === 'shared-by-me') {
			fetchSentSharedPasswords()
		}
		// Hide any revealed secrets when switching tabs.
		setVisiblePasswords({})
		setRevealedShared({})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view, isLocked])

	const performRevoke = async (id) => {
		try {
			const response = await fetchWithAuth(`/api/share/${id}`, { method: 'DELETE' })
			if (response && response.ok) {
				setSentSharedPasswords((current) => current.filter((p) => p._id !== id))
				toast('Access revoked', { type: 'success' })
			} else {
				throw new Error('request failed')
			}
		} catch (error) {
			console.error('Error revoking sharing', error)
			toast('Failed to revoke access', { type: 'error' })
		}
	}

	const handleShare = async (e) => {
		e.preventDefault()
		setIsSharing(true)
		setMessage('')
		try {
			const keyRes = await fetchWithAuth(`/api/users/public-key/${receiverId}`)
			if (!keyRes || !keyRes.ok) {
				const errorData = await keyRes.json()
				throw new Error(errorData.error || 'Receiver not found or sharing not setup')
			}
			const { publicKey: receiverPubKey } = await keyRes.json()

			const encryptedPassword = await encryptWithPublicKey(sharingPassword.password, receiverPubKey)

			const shareRes = await fetchWithAuth('/api/share', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					receiverId,
					site: sharingPassword.site,
					username: sharingPassword.username,
					encryptedPassword,
				}),
			})

			if (shareRes && shareRes.ok) {
				toast(`${sharingPassword.site} shared securely`, { type: 'secure' })
				setSharingPassword(null)
				setReceiverId('')
				setMessage('')
			} else {
				throw new Error('Failed to share password')
			}
		} catch (error) {
			setMessage(error.message)
		} finally {
			setIsSharing(false)
		}
	}

	const decryptSharedPassword = async (p) => {
		// Toggle back to hidden if already revealed.
		if (revealedShared[p._id]) {
			hideKey(`shared:${p._id}`)
			setRevealedShared((current) => {
				const next = { ...current }
				delete next[p._id]
				return next
			})
			return
		}
		if (isLocked) {
			toast('Unlock your sharing vault to view this', { type: 'error' })
			return
		}
		try {
			const decrypted = await decryptWithPrivateKey(p.encryptedPassword, privateKey)
			setRevealedShared((current) => ({ ...current, [p._id]: decrypted }))
			scheduleHide(`shared:${p._id}`, () =>
				setRevealedShared((current) => {
					const next = { ...current }
					delete next[p._id]
					return next
				}),
			)
		} catch (error) {
			console.error('Decryption failed:', error)
			toast('Could not decrypt. Check your master password.', { type: 'error' })
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
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
			})
			if (response && response.ok) {
				const data = await response.json()
				setPasswords([...passwords, data.password])
				setForm({ site: '', username: '', password: '' })
				setShowFormPassword(false)
				toast('Password saved', { type: 'success' })
			}
		} catch (error) {
			console.error('Error saving password', error)
			toast('Failed to save password', { type: 'error' })
		}
	}

	const handleUpdate = async () => {
		try {
			const response = await fetchWithAuth(`${API_URL}/${editingId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
			})
			if (response && response.ok) {
				const data = await response.json()
				setPasswords(passwords.map((p) => (p._id === editingId ? data.password : p)))
				setForm({ site: '', username: '', password: '' })
				setEditingId(null)
				setShowFormPassword(false)
				toast('Password updated', { type: 'success' })
			}
		} catch (error) {
			console.error('Error updating password', error)
			toast('Failed to update password', { type: 'error' })
		}
	}

	const performDelete = async (id) => {
		try {
			const response = await fetchWithAuth(`${API_URL}/${id}`, { method: 'DELETE' })
			if (response && response.ok) {
				setPasswords((current) => current.filter((p) => p._id !== id))
				toast('Password deleted', { type: 'success' })
			} else {
				throw new Error('request failed')
			}
		} catch (error) {
			console.error('Error deleting password', error)
			toast('Failed to delete password', { type: 'error' })
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

	// --- reveal / auto-hide helpers ---
	const scheduleHide = (key, hide) => {
		window.clearTimeout(timersRef.current[key])
		timersRef.current[key] = window.setTimeout(hide, REVEAL_TIMEOUT)
	}
	const hideKey = (key) => {
		window.clearTimeout(timersRef.current[key])
		delete timersRef.current[key]
	}

	const toggleSavedPasswordVisibility = (id) => {
		setVisiblePasswords((current) => {
			const next = { ...current, [id]: !current[id] }
			if (next[id]) {
				scheduleHide(`own:${id}`, () => setVisiblePasswords((c) => ({ ...c, [id]: false })))
			} else {
				hideKey(`own:${id}`)
			}
			return next
		})
	}

	// --- copy helper ---
	const copyValue = async (value, key, label) => {
		try {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(value)
			}
			setCopiedKey(key)
			window.clearTimeout(copyTimerRef.current)
			copyTimerRef.current = window.setTimeout(() => setCopiedKey(null), 1400)
			toast(`${label} copied to clipboard`, { type: 'success', duration: 1800 })
		} catch {
			toast('Could not access clipboard', { type: 'error' })
		}
	}

	// --- favorites ---
	const toggleFavorite = (id) => {
		setFavorites((current) => {
			const next = new Set(current)
			next.has(id) ? next.delete(id) : next.add(id)
			localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]))
			return next
		})
	}

	// --- derived: filtered + sorted own passwords ---
	const filteredPasswords = useMemo(() => {
		const q = query.trim().toLowerCase()
		const matched = q
			? passwords.filter(
					(p) =>
						p.site?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q),
			  )
			: passwords
		return [...matched].sort((a, b) => {
			const fa = favorites.has(a._id) ? 0 : 1
			const fb = favorites.has(b._id) ? 0 : 1
			if (fa !== fb) return fa - fb
			return (a.site || '').localeCompare(b.site || '')
		})
	}, [passwords, query, favorites])

	const formatDate = (date) => (date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never')

	const isEditing = Boolean(editingId)

	return (
		<div className="password-manager-container">
			<VaultModal />
			<section className="page-section">
				<div className="page-heading">
					<p className="eyebrow">Vault</p>
					<h1>Password Manager</h1>
					<p>Securely save and manage your credentials behind end-to-end encryption.</p>
				</div>

				<div className="tab-navigation">
					<button className={`tab-btn ${view === 'my-passwords' ? 'active' : ''}`} onClick={() => setView('my-passwords')}>
						My Passwords
					</button>
					<button className={`tab-btn ${view === 'shared-with-me' ? 'active' : ''}`} onClick={() => setView('shared-with-me')}>
						Shared with Me
					</button>
					<button className={`tab-btn ${view === 'shared-by-me' ? 'active' : ''}`} onClick={() => setView('shared-by-me')}>
						Shared by Me
					</button>
				</div>

				<div className={view === 'my-passwords' ? 'vault-layout' : ''}>
					{view === 'my-passwords' && (
						<div className="form-card">
							<form onSubmit={handleSubmit} className="stacked-form">
								<label htmlFor="site">Site Name</label>
								<input id="site" name="site" type="text" value={form.site} onChange={handleChange} placeholder="e.g. Google, GitHub" required />

								<label htmlFor="username">Username / Email</label>
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

								<div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
									<button type="submit" style={{ flex: 1 }}>
										{isEditing ? 'Update Password' : 'Save Password'}
									</button>
									{isEditing && (
										<button type="button" className="btn-secondary" onClick={cancelEdit}>
											Cancel
										</button>
									)}
								</div>
							</form>
						</div>
					)}

					<div className="results-section">
						{/* ---- MY PASSWORDS ---- */}
						{view === 'my-passwords' && (
							<>
								<div className="vault-section-head">
									<h2>Your Saved Passwords</h2>
									{!loading && passwords.length > 0 && (
										<span className="vault-section-hint">
											<ShieldCheckIcon size={14} /> Encrypted at rest
										</span>
									)}
								</div>

								{!loading && passwords.length > 0 && (
									<div className="vault-toolbar">
										<div className="vault-search">
											<span className="search-icon">
												<SearchIcon size={17} />
											</span>
											<input
												type="text"
												value={query}
												onChange={(e) => setQuery(e.target.value)}
												placeholder="Search by site or username…"
												aria-label="Search passwords"
											/>
											{query && (
												<button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
													<XIcon size={15} />
												</button>
											)}
										</div>
										<span className="vault-count">
											{filteredPasswords.length} of {passwords.length}
										</span>
									</div>
								)}

								{loading ? (
									<SkeletonGrid />
								) : passwords.length === 0 ? (
									<EmptyState
										icon={<KeyIcon size={26} />}
										title="Your vault is empty"
										text="Add your first credential using the form on the left. Everything is encrypted before it leaves your device."
									/>
								) : filteredPasswords.length === 0 ? (
									<EmptyState
										icon={<SearchIcon size={26} />}
										title="No matches"
										text={`Nothing matches “${query}”. Try a different site or username.`}
									/>
								) : (
									<div className="password-grid">
										{filteredPasswords.map((p) => {
											const isVisible = Boolean(visiblePasswords[p._id])
											const fav = favorites.has(p._id)
											return (
												<article className="cred-card" key={p._id}>
													<div className="cred-head">
														<div className="cred-avatar" style={{ background: avatarColor(p.site) }}>
															{(p.site || '?').charAt(0)}
														</div>
														<div className="cred-identity">
															<span className="cred-site">{p.site}</span>
															<span className="cred-username">
																{p.username}
																<button
																	type="button"
																	className={`icon-btn cred-inline-copy ${copiedKey === `u:${p._id}` ? 'is-copied' : ''}`}
																	onClick={() => copyValue(p.username, `u:${p._id}`, 'Username')}
																	aria-label={`Copy username for ${p.site}`}
																>
																	{copiedKey === `u:${p._id}` ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
																</button>
															</span>
														</div>
														<button
															type="button"
															className={`cred-fav ${fav ? 'active' : ''}`}
															onClick={() => toggleFavorite(p._id)}
															aria-label={fav ? `Remove ${p.site} from favorites` : `Add ${p.site} to favorites`}
															aria-pressed={fav}
															title={fav ? 'Favorited' : 'Add to favorites'}
														>
															<StarIcon size={18} filled={fav} />
														</button>
													</div>

													<div className="cred-secret">
														<span className={`cred-secret-value ${isVisible ? 'is-shown' : 'is-hidden'}`}>
															{isVisible ? p.password : maskPassword(p.password)}
														</span>
														<div className="cred-secret-actions">
															<button
																type="button"
																className="icon-btn"
																onClick={() => toggleSavedPasswordVisibility(p._id)}
																aria-label={isVisible ? `Hide password for ${p.site}` : `Show password for ${p.site}`}
																aria-pressed={isVisible}
															>
																<VisibilityIcon visible={isVisible} size={17} />
															</button>
															<button
																type="button"
																className={`icon-btn ${copiedKey === `p:${p._id}` ? 'is-copied' : ''}`}
																onClick={() => copyValue(p.password, `p:${p._id}`, 'Password')}
																aria-label={`Copy password for ${p.site}`}
															>
																{copiedKey === `p:${p._id}` ? <CheckIcon size={17} /> : <CopyIcon size={17} />}
															</button>
														</div>
													</div>

													<div className="cred-meta">
														<ClockIcon size={13} />
														Updated {formatDate(p.last_updated)}
													</div>

													<div className="cred-actions">
														<button type="button" onClick={() => startEditing(p)} className="cred-btn ghost">
															<EditIcon size={15} /> Edit
														</button>
														<button type="button" onClick={() => setSharingPassword(p)} className="cred-btn ghost">
															<ShareIcon size={15} /> Share
														</button>
														<button
															type="button"
															onClick={() => setConfirmState({ kind: 'delete', id: p._id, site: p.site })}
															className="cred-btn danger-ghost"
															aria-label={`Delete ${p.site}`}
															title="Delete"
														>
															<TrashIcon size={15} />
														</button>
													</div>
												</article>
											)
										})}
									</div>
								)}
							</>
						)}

						{/* ---- SHARED WITH ME ---- */}
						{view === 'shared-with-me' && (
							<>
								<div className="vault-section-head">
									<h2>Passwords Shared with You</h2>
									<span className="vault-section-hint">
										<ShieldCheckIcon size={14} /> Encrypted for you only
									</span>
								</div>
								{loading ? (
									<SkeletonGrid />
								) : sharedPasswords.length === 0 ? (
									<EmptyState
										icon={<InboxIcon size={26} />}
										title="Nothing shared with you yet"
										text="When someone shares a credential with you, it appears here — encrypted so only you can unlock it."
									/>
								) : (
									<div className="password-grid">
										{sharedPasswords.map((p) => {
											const decrypted = revealedShared[p._id]
											const shown = Boolean(decrypted)
											return (
												<article className="cred-card" key={p._id}>
													<div className="cred-head">
														<div className="cred-avatar" style={{ background: avatarColor(p.site) }}>
															{(p.site || '?').charAt(0)}
														</div>
														<div className="cred-identity">
															<span className="cred-site">{p.site}</span>
															<span className="cred-username">{p.username}</span>
														</div>
													</div>

													<p className="cred-party">
														Shared by <strong>{p.senderId?.name || 'Unknown'}</strong>
													</p>

													<div className="cred-secret">
														<span className={`cred-secret-value ${shown ? 'is-shown' : 'is-hidden'}`}>
															{shown ? decrypted : maskPassword()}
														</span>
														<div className="cred-secret-actions">
															<button
																type="button"
																className="icon-btn"
																onClick={() => decryptSharedPassword(p)}
																aria-label={shown ? `Hide password for ${p.site}` : `Decrypt and view password for ${p.site}`}
																aria-pressed={shown}
																title={isLocked ? 'Unlock sharing vault first' : shown ? 'Hide' : 'Decrypt & view'}
															>
																<VisibilityIcon visible={shown} size={17} />
															</button>
															{shown && (
																<button
																	type="button"
																	className={`icon-btn ${copiedKey === `s:${p._id}` ? 'is-copied' : ''}`}
																	onClick={() => copyValue(decrypted, `s:${p._id}`, 'Password')}
																	aria-label={`Copy password for ${p.site}`}
																>
																	{copiedKey === `s:${p._id}` ? <CheckIcon size={17} /> : <CopyIcon size={17} />}
																</button>
															)}
														</div>
													</div>

													<div className="cred-badges">
														<span className="status-badge status-encrypted">
															<LockIcon size={12} /> End-to-end encrypted
														</span>
													</div>

													<div className="cred-meta">
														<ClockIcon size={13} /> Shared {formatDate(p.timestamp)}
													</div>
												</article>
											)
										})}
									</div>
								)}
							</>
						)}

						{/* ---- SHARED BY ME ---- */}
						{view === 'shared-by-me' && (
							<>
								<div className="vault-section-head">
									<h2>Passwords You Have Shared</h2>
									{!loading && sentSharedPasswords.length > 0 && (
										<span className="vault-section-hint">
											<ShieldCheckIcon size={14} /> Revoke access anytime
										</span>
									)}
								</div>
								{loading ? (
									<SkeletonGrid />
								) : sentSharedPasswords.length === 0 ? (
									<EmptyState
										icon={<SendIcon size={24} />}
										title="You haven't shared anything"
										text="Share a credential from the My Passwords tab. You stay in control and can revoke access whenever you like."
									/>
								) : (
									<div className="password-grid">
										{sentSharedPasswords.map((p) => (
											<article className="cred-card" key={p._id}>
												<div className="cred-head">
													<div className="cred-avatar" style={{ background: avatarColor(p.site) }}>
														{(p.site || '?').charAt(0)}
													</div>
													<div className="cred-identity">
														<span className="cred-site">{p.site}</span>
														<span className="cred-username">{p.username}</span>
													</div>
												</div>

												<p className="cred-party">
													Shared with <strong>{p.receiverId?.name || 'Unknown'}</strong>
													{p.receiverId?.email ? ` · ${p.receiverId.email}` : ''}
												</p>

												<div className="cred-badges">
													<span className="status-badge status-active">
														<span className="dot" /> Active
													</span>
												</div>

												<div className="cred-meta">
													<ClockIcon size={13} /> Shared {formatDate(p.timestamp)}
												</div>

												<div className="cred-actions">
													<button
														type="button"
														onClick={() => setConfirmState({ kind: 'revoke', id: p._id, site: p.site, name: p.receiverId?.name })}
														className="cred-btn ghost"
														style={{ color: 'var(--danger)' }}
													>
														<XIcon size={15} /> Revoke Access
													</button>
												</div>
											</article>
										))}
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</section>

			{/* Share Modal */}
			{sharingPassword && (
				<div
					className="modal-overlay"
					onMouseDown={(e) => {
						if (e.target === e.currentTarget && !isSharing) {
							setSharingPassword(null)
							setMessage('')
						}
					}}
				>
					<div className="modal-content">
						<button
							type="button"
							className="modal-close"
							onClick={() => {
								setSharingPassword(null)
								setMessage('')
							}}
							aria-label="Close"
							disabled={isSharing}
						>
							<XIcon size={16} />
						</button>
						<h3>Share Password</h3>
						<p>Send this credential securely. It's encrypted with the recipient's public key — only they can unlock it.</p>

						<div className="share-target">
							<div className="cred-avatar" style={{ background: avatarColor(sharingPassword.site) }}>
								{(sharingPassword.site || '?').charAt(0)}
							</div>
							<div className="cred-identity">
								<span className="cred-site">{sharingPassword.site}</span>
								<span className="cred-username">{sharingPassword.username}</span>
							</div>
						</div>

						<form onSubmit={handleShare} className="stacked-form">
							<label htmlFor="receiverId">Recipient User ID</label>
							<input
								id="receiverId"
								type="text"
								value={receiverId}
								onChange={(e) => setReceiverId(e.target.value)}
								placeholder="Paste the recipient's User ID"
								required
							/>

							<ul className="share-perms">
								<li>
									<KeyIcon size={16} />
									<span>
										<strong>Read-only access.</strong> The recipient can view and copy this password, but cannot edit your copy.
									</span>
								</li>
								<li>
									<ShieldCheckIcon size={16} />
									<span>
										<strong>End-to-end encrypted.</strong> The password is encrypted for the recipient and never stored in plain text.
									</span>
								</li>
								<li>
									<XIcon size={16} />
									<span>
										<strong>Revocable anytime.</strong> Remove access instantly from the “Shared by Me” tab.
									</span>
								</li>
							</ul>

							<div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
								<button type="submit" disabled={isSharing} className="btn-primary" style={{ flex: 1 }}>
									{isSharing ? 'Sharing…' : 'Confirm Share'}
								</button>
								<button
									type="button"
									onClick={() => {
										setSharingPassword(null)
										setMessage('')
									}}
									className="btn-secondary"
									style={{ flex: 1 }}
									disabled={isSharing}
								>
									Cancel
								</button>
							</div>
						</form>
						{message && (
							<p className="error-message" style={{ marginTop: '14px' }}>
								{message}
							</p>
						)}
					</div>
				</div>
			)}

			{/* Delete / Revoke confirmation */}
			<ConfirmDialog
				open={Boolean(confirmState)}
				title={confirmState?.kind === 'revoke' ? 'Revoke access?' : 'Delete password?'}
				message={
					confirmState?.kind === 'revoke'
						? `${confirmState?.name || 'The recipient'} will immediately lose access to ${confirmState?.site || 'this credential'}.`
						: `${confirmState?.site || 'This credential'} will be permanently removed from your vault. This can't be undone.`
				}
				confirmLabel={confirmState?.kind === 'revoke' ? 'Revoke access' : 'Delete'}
				onCancel={() => setConfirmState(null)}
				onConfirm={() => {
					if (confirmState?.kind === 'revoke') performRevoke(confirmState.id)
					else if (confirmState?.kind === 'delete') performDelete(confirmState.id)
					setConfirmState(null)
				}}
			/>
		</div>
	)
}

function EmptyState({ icon, title, text }) {
	return (
		<div className="vault-empty">
			<div className="vault-empty-icon">{icon}</div>
			<h3>{title}</h3>
			<p>{text}</p>
		</div>
	)
}

function SkeletonGrid() {
	return (
		<div className="skeleton-grid" aria-hidden="true">
			{Array.from({ length: 4 }).map((_, i) => (
				<div className="skeleton-card" key={i}>
					<div className="sk-row">
						<div className="sk sk-avatar" />
						<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
							<div className="sk sk-line w-60" />
							<div className="sk sk-line w-40" />
						</div>
					</div>
					<div className="sk sk-bar" />
					<div className="sk-row">
						<div className="sk sk-btn" />
						<div className="sk sk-btn" />
					</div>
				</div>
			))}
		</div>
	)
}

export default PasswordManager
