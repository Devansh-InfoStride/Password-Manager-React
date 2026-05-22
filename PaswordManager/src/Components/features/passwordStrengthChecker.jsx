import { useState } from 'react'
import { checkPasswordStrength, getStrengthInfo } from '../../utils/passwordStrength'

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

function PasswordStrengthChecker() {
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [submitted, setSubmitted] = useState(false)

	const strengthData = checkPasswordStrength(password)
	const strengthInfo = getStrengthInfo(strengthData.strength)

	const handleSubmit = (event) => {
		event.preventDefault()
		setSubmitted(true)
	}

	const handleReset = () => {
		setPassword('')
		setShowPassword(false)
		setSubmitted(false)
	}

	return (
		<section className="page-section narrow">
			<div className="page-heading">
				<p className="eyebrow">Checker</p>
				<h1>Password Strength Checker</h1>
				<p>Type a password and get a quick strength check with simple feedback.</p>
			</div>

			<div className="form-card">
				<form onSubmit={handleSubmit} className="stacked-form">
					<label htmlFor="password">Enter your password</label>
					<div className="password-input-wrap">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Enter a strong password"
						/>
						<button
							type="button"
							className="icon-toggle"
							onClick={() => setShowPassword((current) => !current)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							aria-pressed={showPassword}
						>
							<VisibilityIcon visible={showPassword} />
						</button>
					</div>

					{password ? (
						<div className="strength-display">
							<p>
								Password Strength: <strong>{strengthInfo.text}</strong>
							</p>
							<div className="strength-bar">
								<div
									className="strength-meter"
									style={{ width: `${strengthInfo.percent}%`, backgroundColor: strengthInfo.color }}
								/>
							</div>
						</div>
					) : null}

					<button type="submit">Check Strength</button>

					{submitted ? (
						<div className="result-display">
							<h2>Password Analysis</h2>
							<p>{password ? `Your password is ${strengthInfo.text.toLowerCase()}.` : 'Enter a password to begin.'}</p>
							{strengthData.feedback.length > 0 ? (
								<>
									<p>Try adding:</p>
									<ul>
										{strengthData.feedback.map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								</>
							) : null}
							<br />
							<button type="button" onClick={handleReset}>
								Check Another
							</button>
						</div>
					) : null}
				</form>
			</div>
		</section>
	)
}

export default PasswordStrengthChecker