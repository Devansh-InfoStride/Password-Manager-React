import { useEffect, useRef } from 'react'
import { AlertIcon } from './icons'
import '../../styles/modal.css'

/*
 * Controlled confirmation dialog — a calm, on-brand replacement for the native
 * window.confirm(). Render it with an `open` object describing the action, and
 * wire onConfirm / onCancel. Handles Escape, backdrop click, and autofocus.
 */
function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	tone = 'danger', // 'danger' | 'primary'
	busy = false,
	onConfirm,
	onCancel,
}) {
	const confirmRef = useRef(null)

	useEffect(() => {
		if (!open) return
		const onKey = (e) => {
			if (e.key === 'Escape' && !busy) onCancel?.()
		}
		window.addEventListener('keydown', onKey)
		// Focus the primary action so Enter/Space works immediately.
		const t = window.setTimeout(() => confirmRef.current?.focus(), 20)
		return () => {
			window.removeEventListener('keydown', onKey)
			window.clearTimeout(t)
		}
	}, [open, busy, onCancel])

	if (!open) return null

	return (
		<div
			className="modal-overlay"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget && !busy) onCancel?.()
			}}
		>
			<div className="modal-content confirm-dialog" role="alertdialog" aria-modal="true" aria-label={title}>
				<div className={`confirm-icon confirm-icon-${tone}`}>
					<AlertIcon size={22} />
				</div>
				<h3>{title}</h3>
				{message && <p>{message}</p>}
				<div className="confirm-actions">
					<button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
						{cancelLabel}
					</button>
					<button
						ref={confirmRef}
						type="button"
						className={tone === 'danger' ? 'btn-danger-solid' : 'btn-primary'}
						onClick={onConfirm}
						disabled={busy}
					>
						{busy ? 'Working…' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}

export default ConfirmDialog
