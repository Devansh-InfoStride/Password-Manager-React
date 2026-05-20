import { useState, useEffect } from 'react'
import Chart from 'react-apexcharts'
import { checkPasswordStrength, getStrengthInfo } from '../../utils/passwordStrength'
import '../../styles/passwordDashboard.css'

function PasswordDashboard() {
	const [passwords, setPasswords] = useState([])
	const [stats, setStats] = useState({
		total: 0,
		strong: 0,
		moderate: 0,
		weak: 0,
		reused: 0,
		compromised: 0,
		lengthDist: [0, 0, 0, 0, 0], // <6, 6-8, 9-12, 13-16, 17+
		unique: 0,
	})
	const [loading, setLoading] = useState(true)

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
				calculateStats(data)
			}
		} catch (error) {
			console.error('Error fetching passwords', error)
		} finally {
			setLoading(false)
		}
	}

	const calculateStats = (data) => {
		let strong = 0, moderate = 0, weak = 0, compromised = 0
		let lengthDist = [0, 0, 0, 0, 0]
		const passwordMap = {}

		data.forEach((p) => {
			const { strength } = checkPasswordStrength(p.password)
			if (strength >= 5) strong++
			else if (strength >= 3) moderate++
			else {
				weak++
				if (strength < 2) compromised++
			}

			// Length Distribution
			const len = p.password.length
			if (len < 6) lengthDist[0]++
			else if (len <= 8) lengthDist[1]++
			else if (len <= 12) lengthDist[2]++
			else if (len <= 16) lengthDist[3]++
			else lengthDist[4]++

			passwordMap[p.password] = (passwordMap[p.password] || 0) + 1
		})

		let reusedCount = 0
		Object.values(passwordMap).forEach(count => {
			if (count > 1) {
				reusedCount += count
			}
		})

		setStats({
			total: data.length,
			strong,
			moderate,
			weak,
			reused: reusedCount,
			compromised,
			lengthDist,
			unique: data.length - reusedCount,
		})
	}

	// Chart Options
	const strengthDonutOptions = {
		labels: ['Strong', 'Medium', 'Weak', 'Very Weak'],
		colors: ['#22c55e', '#f59e0b', '#f97316', '#ef4444'],
		legend: { position: 'right', fontSize: '14px', markers: { radius: 12 } },
		plotOptions: {
			pie: {
				donut: {
					size: '70%',
					labels: {
						show: true,
						total: {
							show: true,
							label: 'Total',
							formatter: () => stats.total
						}
					}
				}
			}
		},
		stroke: { show: false },
		dataLabels: { enabled: false }
	}

	const lengthBarOptions = {
		chart: { toolbar: { show: false } },
		colors: ['#818cf8'],
		plotOptions: {
			bar: {
				borderRadius: 6,
				columnWidth: '45%',
				dataLabels: { position: 'top' }
			}
		},
		xaxis: {
			categories: ['< 6', '6-8', '9-12', '13-16', '17+'],
			labels: { style: { colors: '#94a3b8' } }
		},
		yaxis: { show: false },
		grid: { show: false },
		dataLabels: {
			enabled: true,
			offsetY: -20,
			style: { fontSize: '12px', colors: ['#475569'] }
		}
	}

	const typeDonutOptions = {
		labels: ['Unique', 'Reused', 'Compromised'],
		colors: ['#818cf8', '#6366f1', '#f43f5e'],
		legend: { position: 'right' },
		stroke: { show: false },
		dataLabels: { enabled: false },
		plotOptions: {
			pie: {
				donut: {
					size: '75%',
					labels: {
						show: true,
						total: {
							show: true,
							label: 'Total',
							formatter: () => stats.total
						}
					}
				}
			}
		}
	}

	const isStale = (date) => {
		if (!date) return true
		const lastUpdate = new Date(date)
		const now = new Date()
		const diffDays = Math.ceil((now - lastUpdate) / (1000 * 60 * 60 * 24))
		return diffDays > 30
	}

	const formatDate = (date) => {
		if (!date) return 'Long ago'
		return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	}

	if (loading) return <div className="page-section"><p>Loading dashboard...</p></div>

	return (
		<section className="page-section dashboard-container">
			{/* Dashboard Header */}
			<div className="dashboard-header">
				<div className="header-left">
					<h1>Password Overview</h1>
					<p>Insights about your passwords and overall security health.</p>
				</div>
		
			</div>

			{/* Metrics Row */}
			<div className="metrics-grid">
				<div className="stat-card">
					<div className="stat-icon-wrapper blue">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
					</div>
					<div className="stat-content">
						<span className="stat-value">{stats.total}</span>
						<span className="stat-label">Total Passwords</span>
					</div>
					<div className="stat-trend trend-up">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
						Overall Vault Size
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon-wrapper green">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 11 11 13 15 9"></polyline></svg>
					</div>
					<div className="stat-content">
						<span className="stat-value">{stats.strong}</span>
						<span className="stat-label">Strong Passwords</span>
					</div>
					<div className="stat-trend trend-up">
						{Math.round((stats.strong / (stats.total || 1)) * 100)}% of total
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon-wrapper orange">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
					</div>
					<div className="stat-content">
						<span className="stat-value">{stats.weak}</span>
						<span className="stat-label">Weak Passwords</span>
					</div>
					<div className="stat-trend trend-down">
						{Math.round((stats.weak / (stats.total || 1)) * 100)}% of total
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon-wrapper red">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
					</div>
					<div className="stat-content">
						<span className="stat-value">{stats.compromised}</span>
						<span className="stat-label">Compromised</span>
					</div>
					<div className="stat-trend trend-down">
						{Math.round((stats.compromised / (stats.total || 1)) * 100)}% of total
					</div>
				</div>
			</div>

			{/* Charts Section */}
			<div className="charts-grid">
				<div className="chart-card">
					<div className="chart-card-header">
						<h3>Password Strength Distribution</h3>
						<svg className="info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
					</div>
					<Chart options={strengthDonutOptions} series={[stats.strong, stats.moderate, stats.weak - stats.compromised, stats.compromised]} type="donut" width="100%" height={280} />
				</div>

				<div className="chart-card">
					<div className="chart-card-header">
						<h3>Password Health Timeline</h3>
						<span className="view-all">Last Updated</span>
					</div>
					<div className="timeline-list">
						{passwords.sort((a, b) => new Date(b.last_updated || 0) - new Date(a.last_updated || 0)).map((p, i) => {
							const stale = isStale(p.last_updated)
							return (
								<div className={`timeline-item ${stale ? 'stale' : ''}`} key={i}>
									<div className="timeline-info">
										<span className="timeline-site">{p.site}</span>
										<span className="timeline-date">Updated: {formatDate(p.last_updated)}</span>
									</div>
									<span className={`timeline-status ${stale ? 'status-stale' : 'status-fresh'}`}>
										{stale ? 'Update Required' : 'Fresh'}
									</span>
								</div>
							)
						})}
						{passwords.length === 0 && <p className="reused-text">No passwords to track.</p>}
					</div>
				</div>
			</div>

			{/* Lists Section */}
			<div className="bottom-grid">
				<div className="list-card">
					<div className="list-header">
						<h3>Top Weak Passwords</h3>
						<a href="#" className="view-all">View all</a>
					</div>
					<div className="list-items">
						{passwords.filter(p => checkPasswordStrength(p.password).strength < 3).slice(0, 3).map((p, i) => (
							<div className="list-item" key={i}>
								<div className="item-info">
									<div className="item-icon">{p.site[0].toUpperCase()}</div>
									<div className="item-details">
										<span className="item-name">{p.site}</span>
										<span className="item-user">{p.username}</span>
									</div>
								</div>
								<span className={`item-tag ${checkPasswordStrength(p.password).strength < 2 ? 'tag-very-weak' : 'tag-weak'}`}>
									{getStrengthInfo(checkPasswordStrength(p.password).strength).text}
								</span>
							</div>
						))}
						{passwords.filter(p => checkPasswordStrength(p.password).strength < 3).length === 0 && <p className="reused-text">No weak passwords found!</p>}
					</div>
				</div>

				<div className="list-card">
					<div className="list-header">
						<h3>Compromised Passwords</h3>
						<a href="#" className="view-all">View all</a>
					</div>
					<div className="list-items">
						{passwords.filter(p => checkPasswordStrength(p.password).strength < 2).slice(0, 3).map((p, i) => (
							<div className="list-item" key={i}>
								<div className="item-info">
									<div className="item-icon">{p.site[0].toUpperCase()}</div>
									<div className="item-details">
										<span className="item-name">{p.site}</span>
										<span className="item-user">{p.username}</span>
									</div>
								</div>
								<span className="item-tag tag-compromised">Compromised</span>
							</div>
						))}
						{stats.compromised === 0 && <p className="reused-text">No compromised passwords found.</p>}
					</div>
				</div>

				<div className="list-card">
					<div className="list-header">
						<h3>Reused Passwords</h3>
						<a href="#" className="view-all">View all</a>
					</div>
					<div className="reused-content">
						<h2 className="reused-count">{stats.reused}</h2>
						<p className="reused-text">passwords are reused across multiple accounts</p>
						<div className="avatar-stack">
							{passwords.filter((p, i, self) => self.findIndex(t => t.password === p.password) !== i).slice(0, 5).map((p, i) => (
								<div className="avatar" key={i}>{p.site[0].toUpperCase()}</div>
							))}
							{stats.reused > 5 && <div className="avatar more">+{stats.reused - 5}</div>}
						</div>
						<button className="view-details-btn">View details</button>
					</div>
				</div>
			</div>

			{/* Distribution Section */}
			<div className="distribution-grid">
				<div className="chart-card">
					<div className="chart-card-header">
						<h3>Password Length</h3>
					</div>
					<Chart options={lengthBarOptions} series={[{ name: 'Count', data: stats.lengthDist }]} type="bar" width="100%" height={280} />
				</div>

				<div className="chart-card">
					<div className="chart-card-header">
						<h3>Password Types</h3>
					</div>
					<Chart options={typeDonutOptions} series={[stats.unique, stats.reused, stats.compromised]} type="donut" width="100%" height={280} />
				</div>
			</div>



			<div className="footer-note">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
				Analytics are computed locally on your device and your data is always encrypted.
			</div>
		</section>
	)
}

export default PasswordDashboard
