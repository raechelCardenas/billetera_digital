export function Notification({ type = 'info', title, message, onClose }) {
  const toneClass = {
    success: 'notification--success',
    error: 'notification--error',
    info: 'notification--info',
  }[type] || 'notification--info'

  return (
    <div className={`notification ${toneClass}`}>
      <div className="notification__content">
        <div className="notification__text">
          {title ? <p className="notification__title">{title}</p> : null}
          <p className="notification__message">{message}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            className="notification__close"
            onClick={onClose}
          >
            Cerrar
          </button>
        ) : null}
      </div>
    </div>
  )
}
