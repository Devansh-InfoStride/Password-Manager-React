import { useState } from 'react'
import { checkPasswordStrength, getStrengthInfo } from '../../utils/passwordStrength'

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
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						placeholder="Enter a strong password"
					/>

					<label className="checkbox-row" htmlFor="showPassword">
						<input
							id="showPassword"
							type="checkbox"
							checked={showPassword}
							onChange={(event) => setShowPassword(event.target.checked)}
						/>
						Show password
					</label>

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