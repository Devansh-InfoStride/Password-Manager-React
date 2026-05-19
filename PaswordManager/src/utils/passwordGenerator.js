export function generatePersonalizedPassword(length, personalInfo, options) {
    const { name, dob, petname, platform } = personalInfo
    const cleanDob = dob ? dob.replace(/-/g, '') : ''

    let prefix = ''
    if (name) {
        prefix = name.substring(0, Math.min(name.length, 4))
    } else if (petname) {
        prefix = petname.substring(0, Math.min(petname.length, 4))
    }

    let middle = ''
    if (dob) {
        const parts = dob.split('-')
        middle = parts[Math.floor(Math.random() * parts.length)]
    } else if (petname && prefix !== petname.substring(0, 4)) {
        middle = petname.substring(0, 3)
    }

    let connector = ''
    if (options.includeSymbols) {
        const symbols = '!@#$%^&*'
        connector = symbols[Math.floor(Math.random() * symbols.length)]
    } else if (options.includeNumbers) {
        connector = Math.floor(Math.random() * 10).toString()
    }

    const suffix = platform ? `@${platform.replace(/\s/g, '')}` : ''
    let password = prefix + connector + middle + suffix

    const combinedText = `${name}${petname}${platform}`
    let pool = ''
    if (options.includeUpper) pool += combinedText.toUpperCase().replace(/[^A-Z]/g, '')
    if (options.includeLower) pool += combinedText.toLowerCase().replace(/[^a-z]/g, '')
    if (options.includeNumbers) pool += cleanDob
    if (options.includeSymbols) pool += '!@#$%^&*'

    if (!pool) pool = 'password'

    if (password.length < length) {
        const needed = length - password.length
        let filler = ''

        for (let index = 0; index < needed; index += 1) {
            filler += pool[Math.floor(Math.random() * pool.length)]
        }

        const suffixIndex = platform ? password.indexOf(`@${platform.replace(/\s/g, '')}`) : password.length
        password = password.slice(0, suffixIndex) + filler + password.slice(suffixIndex)
    }

    if (options.includeUpper && !options.includeLower) {
        password = password.toUpperCase()
    } else if (options.includeLower && !options.includeUpper) {
        password = password.toLowerCase()
    }

    return password
}
