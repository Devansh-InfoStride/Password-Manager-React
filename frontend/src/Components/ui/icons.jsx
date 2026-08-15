/*
 * Shared icon set — one consistent stroke language across the whole app.
 * Every icon inherits `currentColor` and sizes from the `size` prop so it can
 * live inside buttons, badges, and inline text without extra styling.
 */

function Icon({ size = 18, children, ...rest }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...rest}
		>
			{children}
		</svg>
	)
}

export function EyeIcon(props) {
	return (
		<Icon {...props}>
			<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
			<circle cx="12" cy="12" r="3" />
		</Icon>
	)
}

export function EyeOffIcon(props) {
	return (
		<Icon {...props}>
			<path d="M3 3l18 18" />
			<path d="M10.5 6.4A11.2 11.2 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.6 4.1" />
			<path d="M6.2 9.2A17 17 0 0 0 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.1-.8" />
		</Icon>
	)
}

// Backwards-compatible helper that mirrors the old inline component's API.
export function VisibilityIcon({ visible, ...props }) {
	return visible ? <EyeIcon {...props} /> : <EyeOffIcon {...props} />
}

export function CopyIcon(props) {
	return (
		<Icon {...props}>
			<rect x="9" y="9" width="12" height="12" rx="2" />
			<path d="M5 15V5a2 2 0 0 1 2-2h10" />
		</Icon>
	)
}

export function CheckIcon(props) {
	return (
		<Icon {...props}>
			<path d="M20 6 9 17l-5-5" />
		</Icon>
	)
}

export function SearchIcon(props) {
	return (
		<Icon {...props}>
			<circle cx="11" cy="11" r="7" />
			<path d="m21 21-4.3-4.3" />
		</Icon>
	)
}

export function ShareIcon(props) {
	return (
		<Icon {...props}>
			<circle cx="18" cy="5" r="3" />
			<circle cx="6" cy="12" r="3" />
			<circle cx="18" cy="19" r="3" />
			<path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
		</Icon>
	)
}

export function EditIcon(props) {
	return (
		<Icon {...props}>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
		</Icon>
	)
}

export function TrashIcon(props) {
	return (
		<Icon {...props}>
			<path d="M3 6h18" />
			<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
			<path d="M10 11v6M14 11v6" />
		</Icon>
	)
}

export function StarIcon({ filled, ...props }) {
	return (
		<Icon fill={filled ? 'currentColor' : 'none'} {...props}>
			<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9Z" />
		</Icon>
	)
}

export function ShieldIcon(props) {
	return (
		<Icon {...props}>
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
		</Icon>
	)
}

export function ShieldCheckIcon(props) {
	return (
		<Icon {...props}>
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			<path d="m9 12 2 2 4-4" />
		</Icon>
	)
}

export function LockIcon(props) {
	return (
		<Icon {...props}>
			<rect x="4" y="11" width="16" height="10" rx="2" />
			<path d="M8 11V7a4 4 0 0 1 8 0v4" />
		</Icon>
	)
}

export function KeyIcon(props) {
	return (
		<Icon {...props}>
			<circle cx="7.5" cy="15.5" r="4.5" />
			<path d="m10.5 12.5 8-8" />
			<path d="M16 4.5 20 8.5M14 6.5l2 2" />
		</Icon>
	)
}

export function PlusIcon(props) {
	return (
		<Icon {...props}>
			<path d="M12 5v14M5 12h14" />
		</Icon>
	)
}

export function XIcon(props) {
	return (
		<Icon {...props}>
			<path d="M18 6 6 18M6 6l12 12" />
		</Icon>
	)
}

export function UsersIcon(props) {
	return (
		<Icon {...props}>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
		</Icon>
	)
}

export function InboxIcon(props) {
	return (
		<Icon {...props}>
			<path d="M22 12h-6l-2 3h-4l-2-3H2" />
			<path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.5Z" />
		</Icon>
	)
}

export function SendIcon(props) {
	return (
		<Icon {...props}>
			<path d="M22 2 11 13" />
			<path d="M22 2 15 22l-4-9-9-4Z" />
		</Icon>
	)
}

export function ClockIcon(props) {
	return (
		<Icon {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</Icon>
	)
}

export function AlertIcon(props) {
	return (
		<Icon {...props}>
			<path d="M12 9v4M12 17h.01" />
			<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
		</Icon>
	)
}
