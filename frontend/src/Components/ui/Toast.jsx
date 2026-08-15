import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckIcon, AlertIcon, ShieldCheckIcon, XIcon } from './icons'
import './toast.css'

const ToastContext = createContext(null)

// Non-throwing hook: if the provider is ever missing, callers still get a
// no-op so a stray toast can never crash a screen.
export function useToast() {
	return useContext(ToastContext) || { toast: () => {} }
}

const ICONS = {
	success: CheckIcon,
	error: AlertIcon,
	secure: ShieldCheckIcon,
	info: CheckIcon,
}

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([])
	const idRef = useRef(0)

	const dismiss = useCallback((id) => {
		setToasts((current) => current.filter((t) => t.id !== id))
	}, [])

	const toast = useCallback(
		(message, options = {}) => {
			const { type = 'success', duration = 2600 } = options
			const id = ++idRef.current
			setToasts((current) => [...current, { id, message, type }])
			if (duration > 0) {
				window.setTimeout(() => dismiss(id), duration)
			}
			return id
		},
		[dismiss],
	)

	return (
		<ToastContext.Provider value={{ toast, dismiss }}>
			{children}
			<div className="toast-viewport" role="status" aria-live="polite">
				{toasts.map((t) => {
					const IconComp = ICONS[t.type] || CheckIcon
					return (
						<div key={t.id} className={`toast toast-${t.type}`}>
							<span className="toast-icon">
								<IconComp size={16} />
							</span>
							<span className="toast-message">{t.message}</span>
							<button
								type="button"
								className="toast-close"
								onClick={() => dismiss(t.id)}
								aria-label="Dismiss notification"
							>
								<XIcon size={14} />
							</button>
						</div>
					)
				})}
			</div>
		</ToastContext.Provider>
	)
}
