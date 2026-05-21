import { useState } from 'react'
import { checkPasswordStrength, getStrengthInfo } from '../../utils/passwordStrength'
import { generatePersonalizedPassword } from '../../utils/passwordGenerator'

const initialForm = {
	length: 12,
	name: '',
	dob: '',
	petname: '',
	platform: '',
	includeUppercase: true,
	includeLowercase: true,
	includeNumbers: true,
	includeSymbols: true,
}

function PasswordGenerator() {
	const [form, setForm] = useState(initialForm)
	const [passwords, setPasswords] = useState([])
	const [copiedIndex, setCopiedIndex] = useState(null)

	const handleChange = (event) => {
		const { name, type, checked, value } = event.target

		setForm((current) => ({
			...current,
			[name]: type === 'checkbox' ? checked : value,
		}))
	}

	const handleSubmit = (event) => {
		event.preventDefault()

		const generatedPasswords = Array.from({ length: 6 }, () =>
			generatePersonalizedPassword(
				Number(form.length),
				{
					name: form.name,
					dob: form.dob,
					petname: form.petname,
					platform: form.platform,
				},
				{
					includeUpper: form.includeUppercase,
					includeLower: form.includeLowercase,
					includeNumbers: form.includeNumbers,
					includeSymbols: form.includeSymbols,
				},
			),
		)

		setPasswords(generatedPasswords)
	}

	const handleCopy = async (password, index) => {
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(password)
		}

		setCopiedIndex(index)
		window.setTimeout(() => setCopiedIndex(null), 1200)
	}

	return (
		<section className="page-section narrow">
			<div className="page-heading">
				<p className="eyebrow">Generator</p>
				<h1>Password Generator</h1>
				<p>Fill out a few simple details and generate a few personalized passwords.</p>
			</div>

			<div className="form-card">
				<form onSubmit={handleSubmit} className="stacked-form">
					<label htmlFor="length">Password Length</label>
					<input id="length" name="length" type="number" min="6" max="20" value={form.length} onChange={handleChange} />

					<label htmlFor="name">Your name</label>
					<input id="name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Your name" />

					<label htmlFor="dob">Date of birth</label>
					<input id="dob" name="dob" type="date" value={form.dob} onChange={handleChange} />

					<label htmlFor="petname">Pet name</label>
					<input id="petname" name="petname" type="text" value={form.petname} onChange={handleChange} placeholder="Optional" />

					<label htmlFor="platform">Target platform</label>
					<input
						id="platform"
						name="platform"
						type="text"
						value={form.platform}
						onChange={handleChange}
						placeholder="e.g. Gmail, Instagram"
					/>

					<div className="checkbox-grid">
						<label className="checkbox-row" htmlFor="includeUppercase">
							<input id="includeUppercase" name="includeUppercase" type="checkbox" checked={form.includeUppercase} onChange={handleChange} />
							Include uppercase letters
						</label>
						<label className="checkbox-row" htmlFor="includeLowercase">
							<input id="includeLowercase" name="includeLowercase" type="checkbox" checked={form.includeLowercase} onChange={handleChange} />
							Include lowercase letters
						</label>
						<label className="checkbox-row" htmlFor="includeNumbers">
							<input id="includeNumbers" name="includeNumbers" type="checkbox" checked={form.includeNumbers} onChange={handleChange} />
							Include numbers
						</label>
						<label className="checkbox-row" htmlFor="includeSymbols">
							<input id="includeSymbols" name="includeSymbols" type="checkbox" checked={form.includeSymbols} onChange={handleChange} />
							Include symbols
						</label>
					</div>

					<button type="submit">Generate Passwords</button>
				</form>
			</div>

			{passwords.length > 0 ? (
				<div className="results-section">
					<h2>Your generated passwords</h2>
					<div className="password-grid">
						{passwords.map((password, index) => {
							const strengthInfo = getStrengthInfo(checkPasswordStrength(password).strength)

							return (
								<article className="password-item" key={password + index}>
									<p className="password-label">Password {index + 1}</p>
									<div className="password-value" title={password}>
										{password}
									</div>
									<button type="button" onClick={() => handleCopy(password, index)}>
										{copiedIndex === index ? 'Copied' : 'Copy'}
									</button>
									<p className="mini-strength">
										Strength: <strong>{strengthInfo.text}</strong>
									</p>
								</article>
							)
						})}
					</div>
				</div>
			) : null}
		</section>
	)
}

export default PasswordGenerator