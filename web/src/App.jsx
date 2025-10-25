import { useMemo, useState } from 'react'
import './App.css'
import { apiClient } from './api/client.js'
import { Notification } from './components/Notification.jsx'

const registerInitial = {
  document: '',
  fullName: '',
  email: '',
  phone: '',
}

const rechargeInitial = {
  document: '',
  phone: '',
  amount: '',
  reference: '',
  notes: '',
}

const initiateInitial = {
  document: '',
  phone: '',
  amount: '',
  description: '',
}

const confirmInitial = {
  sessionId: '',
  token: '',
}

const balanceInitial = {
  document: '',
  phone: '',
}

const tabs = [
  {
    id: 'register',
    icon: '🧑‍💼',
    label: 'Registrar cliente',
    description: 'Crea un nuevo cliente y billetera con saldo inicial en 0.',
  },
  {
    id: 'recharge',
    icon: '⚡',
    label: 'Recargar billetera',
    description: 'Aumenta el saldo disponible utilizando documento y celular.',
  },
  {
    id: 'initiate',
    icon: '🧾',
    label: 'Generar compra',
    description: 'Solicita un pago y envía un token de confirmación al correo del cliente.',
  },
  {
    id: 'confirm',
    icon: '🔐',
    label: 'Confirmar pago',
    description: 'Valida el token de 6 dígitos y descuenta el saldo de la billetera.',
  },
  {
    id: 'balance',
    icon: '💳',
    label: 'Consultar saldo',
    description: 'Consulta el saldo actual enviando documento y número de celular.',
  },
]

const formatErrors = (error) => {
  if (!error) return ''
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors
      .map((item) => `${item.field ? `${item.field}: ` : ''}${item.message}`)
      .join('\n')
  }
  if (typeof error.raw === 'object' && error.raw?.message) {
    return error.raw.message
  }
  return error.message || 'Ocurrió un error inesperado.'
}

const formatCurrency = (value) => {
  const numeric = Number(value ?? 0)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number.isNaN(numeric) ? 0 : numeric)
}

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha registrada'
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const formatBoolean = (value) => (value ? 'Sí' : 'No')

const resultIcon = {
  register: '🧑‍💼',
  recharge: '⚡',
  payment: '🧾',
  confirm: '🔐',
  balance: '💳',
}

function App() {
  const [activeTab, setActiveTab] = useState('register')
  const [registerForm, setRegisterForm] = useState(registerInitial)
  const [rechargeForm, setRechargeForm] = useState(rechargeInitial)
  const [initiateForm, setInitiateForm] = useState(initiateInitial)
  const [confirmForm, setConfirmForm] = useState(confirmInitial)
  const [balanceForm, setBalanceForm] = useState(balanceInitial)

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [result, setResult] = useState(null)

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTab),
    [activeTab],
  )

  const handleTabChange = (id) => {
    setActiveTab(id)
    setFeedback(null)
    setResult(null)
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)
    try {
      const payload = {
        document: registerForm.document.trim(),
        fullName: registerForm.fullName.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
      }

      const response = await apiClient.post('/clients', payload)

      setResult({
        action: 'Registro de cliente',
        type: 'register',
        message: response.message,
        data: response.data,
      })
      setRegisterForm(registerInitial)
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'Error registrando cliente',
        message: formatErrors(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRechargeSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)
    try {
      const amountValue = Number(rechargeForm.amount)

      if (Number.isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Ingresa un valor positivo para recargar la billetera.')
      }

      const payload = {
        document: rechargeForm.document.trim(),
        phone: rechargeForm.phone.trim(),
        amount: amountValue,
      }

      const metadata = {
        reference: rechargeForm.reference.trim(),
        notes: rechargeForm.notes.trim(),
      }

      if (metadata.reference || metadata.notes) {
        payload.metadata = metadata
      }

      const response = await apiClient.post('/wallets/recharge', payload)

      setResult({
        action: 'Recarga de billetera',
        type: 'recharge',
        message: response.message,
        data: response.data,
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'Error recargando billetera',
        message: formatErrors(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)
  try {
    const amountValue = Number(initiateForm.amount)

      if (Number.isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Ingresa un valor positivo para el valor de la compra.')
      }

      const payload = {
        document: initiateForm.document.trim(),
        phone: initiateForm.phone.trim(),
        amount: amountValue,
        description: initiateForm.description.trim() || undefined,
      }

    const response = await apiClient.post('/payments/initiate', payload)

    setResult({
      action: 'Generación de compra',
      type: 'payment',
      message: response.message,
      data: response.data,
    })
    setConfirmForm((prev) => ({
      ...prev,
      sessionId: response.data.sessionId ?? prev.sessionId,
    }))
  } catch (error) {
      setFeedback({
        type: 'error',
        title: 'Error generando la compra',
        message: formatErrors(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)
    try {
      const payload = {
        token: confirmForm.token.trim(),
      }

      const response = await apiClient.post('/payments/confirm', payload)

      setResult({
        action: 'Confirmación de pago',
        type: 'confirm',
        message: response.message,
        data: response.data,
      })
      setConfirmForm(confirmInitial)
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'Error confirmando el pago',
        message: formatErrors(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBalanceSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)
    try {
      const payload = {
        document: balanceForm.document.trim(),
        phone: balanceForm.phone.trim(),
      }

      const response = await apiClient.get('/wallets/balance', payload)

      setResult({
        action: 'Consulta de saldo',
        type: 'balance',
        message: response.message,
        data: response.data,
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        title: 'Error consultando saldo',
        message: formatErrors(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const renderActiveForm = () => {
    switch (activeTab) {
      case 'register':
        return (
          <form onSubmit={handleRegisterSubmit} className="form-grid">
            <div className="form-control">
              <label htmlFor="register-document">Documento</label>
              <input
                id="register-document"
                value={registerForm.document}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, document: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="register-fullName">Nombres completos</label>
              <input
                id="register-fullName"
                value={registerForm.fullName}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="register-email">Correo electrónico</label>
              <input
                id="register-email"
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="register-phone">Celular</label>
              <input
                id="register-phone"
                value={registerForm.phone}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control form-control--full">
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Procesando...' : 'Registrar cliente'}
              </button>
            </div>
          </form>
        )
      case 'recharge':
        return (
          <form onSubmit={handleRechargeSubmit} className="form-grid">
            <div className="form-control">
              <label htmlFor="recharge-document">Documento</label>
              <input
                id="recharge-document"
                value={rechargeForm.document}
                onChange={(event) =>
                  setRechargeForm((prev) => ({ ...prev, document: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="recharge-phone">Celular</label>
              <input
                id="recharge-phone"
                value={rechargeForm.phone}
                onChange={(event) =>
                  setRechargeForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="recharge-amount">Valor a recargar</label>
              <input
                id="recharge-amount"
                type="number"
                min="0"
                step="0.01"
                value={rechargeForm.amount}
                onChange={(event) =>
                  setRechargeForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="recharge-reference">Referencia (opcional)</label>
              <input
                id="recharge-reference"
                value={rechargeForm.reference}
                onChange={(event) =>
                  setRechargeForm((prev) => ({ ...prev, reference: event.target.value }))
                }
                autoComplete="off"
              />
            </div>
            <div className="form-control form-control--full">
              <label htmlFor="recharge-notes">Notas (opcional)</label>
              <textarea
                id="recharge-notes"
                value={rechargeForm.notes}
                onChange={(event) =>
                  setRechargeForm((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </div>
            <div className="form-control form-control--full">
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Procesando...' : 'Recargar billetera'}
              </button>
            </div>
          </form>
        )
      case 'initiate':
        return (
          <form onSubmit={handleInitiateSubmit} className="form-grid">
            <div className="form-control">
              <label htmlFor="initiate-document">Documento</label>
              <input
                id="initiate-document"
                value={initiateForm.document}
                onChange={(event) =>
                  setInitiateForm((prev) => ({ ...prev, document: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="initiate-phone">Celular</label>
              <input
                id="initiate-phone"
                value={initiateForm.phone}
                onChange={(event) =>
                  setInitiateForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="initiate-amount">Valor de la compra</label>
              <input
                id="initiate-amount"
                type="number"
                min="0"
                step="0.01"
                value={initiateForm.amount}
                onChange={(event) =>
                  setInitiateForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control form-control--full">
              <label htmlFor="initiate-description">Descripción (opcional)</label>
              <textarea
                id="initiate-description"
                value={initiateForm.description}
                onChange={(event) =>
                  setInitiateForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className="form-control form-control--full">
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Procesando...' : 'Generar compra'}
              </button>
            </div>
          </form>
        )
      case 'confirm':
        return (
          <form onSubmit={handleConfirmSubmit} className="form-grid">
            <div className="form-control">
              <label htmlFor="confirm-session">ID de sesión</label>
              <input
                id="confirm-session"
                value={confirmForm.sessionId}
                readOnly
                disabled
                placeholder="Genera una compra para obtenerlo"
              />
            </div>
            <div className="form-control">
              <label htmlFor="confirm-token">Token</label>
              <input
                id="confirm-token"
                value={confirmForm.token}
                onChange={(event) =>
                  setConfirmForm((prev) => ({ ...prev, token: event.target.value }))
                }
                required
                autoComplete="off"
                placeholder="123456"
              />
            </div>
            <div className="form-control form-control--full">
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </div>
          </form>
        )
      case 'balance':
        return (
          <form onSubmit={handleBalanceSubmit} className="form-grid">
            <div className="form-control">
              <label htmlFor="balance-document">Documento</label>
              <input
                id="balance-document"
                value={balanceForm.document}
                onChange={(event) =>
                  setBalanceForm((prev) => ({ ...prev, document: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control">
              <label htmlFor="balance-phone">Celular</label>
              <input
                id="balance-phone"
                value={balanceForm.phone}
                onChange={(event) =>
                  setBalanceForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="form-control form-control--full">
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Procesando...' : 'Consultar saldo'}
              </button>
            </div>
          </form>
        )
      default:
        return null
    }
  }

  const renderResultCard = () => {
    if (!result) return null

    if (result.type === 'balance') {
      const { fullName, balance, updatedAt, clientId } = result.data ?? {}
      return (
        <div className="result-wrapper">
          <div className="balance-card">
            <div className="balance-card__header">
              <span className="balance-card__label">Saldo disponible</span>
              <span className="balance-card__chip">
                ID&nbsp;
                {clientId ?? 'N/D'}
              </span>
            </div>
            <p className="balance-card__amount">{formatCurrency(balance)}</p>
            <div className="balance-card__meta">
              <span>{fullName || 'Cliente sin nombre'}</span>
              <span>Actualizado el {formatDateTime(updatedAt)}</span>
            </div>
          </div>
        </div>
      )
    }

    const icon = resultIcon[result.type] || '✨'
    const renderDetails = () => {
      switch (result.type) {
        case 'register': {
          const { document, fullName, email, phone } = result.data ?? {}
          return (
            <dl className="details-grid">
              <div>
                <dt>Documento</dt>
                <dd>{document ?? 'N/D'}</dd>
              </div>
              <div>
                <dt>Nombres</dt>
                <dd>{fullName ?? 'N/D'}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{email ?? 'N/D'}</dd>
              </div>
              <div>
                <dt>Celular</dt>
                <dd>{phone ?? 'N/D'}</dd>
              </div>
            </dl>
          )
        }
        case 'recharge': {
          const { clientName, balance } = result.data ?? {}
          return (
            <dl className="details-grid">
              <div>
                <dt>Cliente</dt>
                <dd>{clientName ?? 'N/D'}</dd>
              </div>
              <div>
                <dt>Saldo actual</dt>
                <dd>{formatCurrency(balance)}</dd>
              </div>
            </dl>
          )
        }
        case 'payment': {
          const { sessionId, expiresAt, amount, client, emailDelivery } = result.data ?? {}
          return (
            <dl className="details-grid">
              <div>
                <dt>Monto</dt>
                <dd>{formatCurrency(amount)}</dd>
              </div>
              <div>
                <dt>Expira</dt>
                <dd>{formatDateTime(expiresAt)}</dd>
              </div>
              <div>
                <dt>Cliente</dt>
                <dd>{client?.fullName ?? 'N/D'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{client?.email ?? 'N/D'}</dd>
              </div>
              <div>
                <dt>ID sesión</dt>
                <dd>{sessionId}</dd>
              </div>
              <div>
                <dt>Correo enviado</dt>
                <dd>{formatBoolean(emailDelivery?.delivered)}</dd>
              </div>
              {emailDelivery?.reason ? (
                <div className="details-grid__full">
                  <dt>Detalle</dt>
                  <dd>{emailDelivery.reason}</dd>
                </div>
              ) : null}
            </dl>
          )
        }
        case 'confirm': {
          const { sessionId, balance, confirmedAt } = result.data ?? {}
          return (
            <dl className="details-grid">
              <div>
                <dt>ID sesión</dt>
                <dd>{sessionId}</dd>
              </div>
              <div>
                <dt>Saldo restante</dt>
                <dd>{formatCurrency(balance)}</dd>
              </div>
              <div>
                <dt>Confirmado el</dt>
                <dd>{formatDateTime(confirmedAt)}</dd>
              </div>
            </dl>
          )
        }
        default:
          return (
            <pre className="details-json">{JSON.stringify(result.data, null, 2)}</pre>
          )
      }
    }

    return (
      <div className="result-wrapper">
        <div className="result-card">
          <div className="result-card__header">
            <span className="result-card__icon">{icon}</span>
            <div>
              <p className="result-card__title">{result.action}</p>
              {result.message ? (
                <p className="result-card__subtitle">{result.message}</p>
              ) : null}
            </div>
          </div>
          <div className="result-card__body">{renderDetails()}</div>
        </div>
      </div>
    )
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <span className="hero__kicker">💳 Billetera digital</span>
        <h1 className="hero__title">Administra tu wallet ePayco en segundos</h1>
        <p className="hero__subtitle">
          Registra clientes, recarga saldos y confirma compras de forma segura con tokens de
          seis dígitos. Todo en una sola experiencia moderna.
        </p>
        <div className="hero__features">
          <span className="feature-chip">🧾 Reportes claros</span>
          <span className="feature-chip">⚡ Recargas instantáneas</span>
          <span className="feature-chip">🔐 Token 6 dígitos</span>
          <span className="feature-chip">📊 Saldo en tiempo real</span>
        </div>
      </section>

      <section className="workspace">
        <nav className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="tab-button__icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {currentTab ? (
          <div className="panel panel--form">
            <div className="panel-header">
              <h2>{currentTab.label}</h2>
              <p>{currentTab.description}</p>
            </div>

            {feedback ? (
              <Notification
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => setFeedback(null)}
              />
            ) : null}

            {renderActiveForm()}
          </div>
        ) : null}

        {renderResultCard()}
      </section>
    </main>
  )
}

export default App
