/**
 * Password strength checker function
 * @param {string} password - The password to check
 * @returns {object} Object containing strength score (0-7) and feedback array
 */
export const checkPasswordStrength = (password) => {
  let strength = 0;
  let feedback = [];

  if (!password || password.length === 0) return { strength: -1, feedback: [] };

  // Check for length
  if(password.length <= 6) strength=strength-2;
  if (password.length >= 6) strength++;
  else feedback.push("At least 6 characters");
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) strength++;
  else feedback.push("Uppercase letter");

  // Check for lowercase letters
  if (/[a-z]/.test(password)) strength++;
  else feedback.push("Lowercase letter");

  // Check for numbers
  if (/\d/.test(password)) strength++;
  else feedback.push("Number");

  // Check for special characters
  if (/[@$!%*?&\/#^()_+=\-\[\]{}|;:',.<>?]/.test(password)) strength++;
  else feedback.push("Special character (@$!%*?&/#^()_+=...)");

  return { strength, feedback };
};

/**
 * Get strength label, color, and percentage based on strength score
 * @param {number} strength - The strength score from checkPasswordStrength
 * @returns {object} Object containing text label, hex color, and percentage
 */
export const getStrengthInfo = (strength) => {
  if (strength === -1) return { text: "-", color: "#6b7280", percent: 0 };
  const normalizedStrength = Math.max(0, Math.min(strength, 6));
  const labels = [
    { text: "Very Weak", color: "#ef4444", percent: 10 },
    { text: "Very Weak", color: "#ef4444", percent: 20 },
    { text: "Weak", color: "#f97316", percent: 30 },
    { text: "Moderate", color: "#eab308", percent: 50 },
    { text: "Strong", color: "#84cc16", percent: 75 },
    { text: "Very Strong", color: "#22c55e", percent: 90 },
    { text: "Very Strong", color: "#22c55e", percent: 100 }
  ];
  return labels[normalizedStrength];
};
