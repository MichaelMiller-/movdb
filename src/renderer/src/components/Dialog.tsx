import { useEffect, type ReactNode } from 'react'

export interface DialogProps {
  labelledBy: string
  onClose: () => void
  closeDisabled?: boolean
  children: ReactNode
}

export function Dialog({
  labelledBy,
  onClose,
  closeDisabled = false,
  children
}: DialogProps): React.JSX.Element {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !closeDisabled) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeDisabled, onClose])

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) {
          onClose()
        }
      }}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </section>
    </div>
  )
}

export interface DialogHeaderProps {
  titleId: string
  title: string
  subtitle?: ReactNode
  onClose: () => void
  closeDisabled?: boolean
}

export function   DialogHeader({
  titleId,
  title,
  subtitle,
  onClose,
  closeDisabled = false
}: DialogHeaderProps): React.JSX.Element {
  return (
    <div className="dialog-header">
      <div>
        <h2 id={titleId}>{title}</h2>
        {subtitle !== undefined && <p>{subtitle}</p>}
      </div>
      <button type="button" onClick={onClose} disabled={closeDisabled}>
        Close
      </button>
    </div>
  )
}

export interface DialogFooterProps {
  children: ReactNode
}

export function DialogFooter({ children }: DialogFooterProps): React.JSX.Element {
  return <div className="dialog-footer">{children}</div>
}

export interface DialogActionsProps {
  children: ReactNode
}

export function DialogActions({ children }: DialogActionsProps): React.JSX.Element {
  return <div className="dialog-actions">{children}</div>
}
