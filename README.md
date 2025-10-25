# ePayco Wallet Demo

Solución full stack que simula una billetera virtual con separación de responsabilidades en dos servicios REST (uno con acceso directo a la base de datos y otro expuesto al cliente) y una interfaz web en React.

## Arquitectura

- **services/db-service**: API privada conectada a MySQL mediante Prisma. Expone endpoints internos para gestionar clientes, billeteras, recargas y pagos.
- **services/api-service**: API pública consumida por el frontend. Valida datos de entrada, invoca el servicio de base de datos y envía correos con tokens de confirmación.
- **web**: Frontend en React (Vite) que permite interactuar con todos los flujos: registro, recarga, generación de compra, confirmación y consulta de saldo.

```
Cliente Web ─┬─> API Service (http://localhost:4000/api/v1)
             └─> DB Service  (http://localhost:4001/internal/v1) ──> MySQL
```

## Requisitos

- Node.js 20+
- npm 10+
- MySQL 8 (o compatible con las características usadas)

## Configuración de la base de datos

1. Crear una base de datos vacía, por ejemplo `epayco_wallet`:
   ```sql
   CREATE DATABASE epayco_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Ajustar las credenciales en `services/db-service/.env`.

## Puesta en marcha

### 1. Servicio de base de datos (`db-service`)

```bash
cd services/db-service
npm install
npm run prisma:generate   # Genera el cliente de Prisma
npm run prisma:migrate:deploy  # Aplica las migraciones al esquema MySQL
npm run dev              # Arranca en modo desarrollo (puerto 4001)
```

Variables principales (`services/db-service/.env`):

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión MySQL (`mysql://user:pass@host:3306/epayco_wallet`). |
| `DB_SERVICE_PORT` | Puerto de escucha del servicio (4001 por defecto). |
| `PAYMENT_TOKEN_EXPIRY_MINUTES` | Minutos de vigencia del token de confirmación. |

### 2. Servicio de API pública (`api-service`)

```bash
cd services/api-service
npm install
npm run dev   # Puerto 4000 por defecto
```

Variables principales (`services/api-service/.env`):

| Variable | Descripción |
| --- | --- |
| `DB_SERVICE_BASE_URL` | URL del servicio privado (por defecto `http://localhost:4001/internal/v1`). |
| `EMAIL_*` | Configuración SMTP para el envío de tokens. Si no se proveen credenciales se omite el envío físico de correos y se registra el motivo en la respuesta. |

### 3. Frontend (`web`)

```bash
cd web
npm install
npm run dev   # Servidor Vite en http://localhost:5173
```

Configurar `web/.env` si es necesario (por defecto `VITE_API_BASE_URL=http://localhost:4000/api/v1`).

## Endpoints clave

### Servicio privado (`/internal/v1`)
- `POST /clients` – Registrar cliente y billetera.
- `POST /wallets/recharge` – Recargar saldo.
- `POST /payments/initiate` – Generar token de pago.
- `POST /payments/confirm` – Confirmar token y descontar saldo.
- `GET /wallets/balance` – Consultar saldo por documento y celular.

### Servicio público (`/api/v1`)
- `POST /clients`
- `POST /wallets/recharge`
- `POST /payments/initiate`
- `POST /payments/confirm`
- `GET /wallets/balance`

Todas las respuestas siguen la estructura:

```json
{
  "success": true,
  "code": "CLIENT_REGISTERED",
  "message": "Cliente registrado correctamente.",
  "data": {
    "id": 1,
    "document": "123456"
  }
}
```

En caso de error `success` es `false`, `data` se establece en `null` y se incluyen detalles opcionales en `errors`.

## Funcionalidades cubiertas

### 1. Registro de clientes
- **Endpoint**: `POST /api/v1/clients`
- **Parámetros**: `document`, `fullName`, `email`, `phone` (todos obligatorios).
- **Validaciones**: formato de correo, longitud mínima para documento y celular.
- **Resultado**: si el usuario se crea correctamente, se retorna `success: true`, código `CLIENT_REGISTERED` y datos básicos del cliente; si ya existe documento o email, se entrega `success: false` con código `CLIENT_EXISTS` desde el servicio interno.
- **Implementación**: validación con Zod en ambos servicios, y registro atómico con Prisma creando también la billetera asociada.

### 2. Recarga de billetera
- **Endpoint**: `POST /api/v1/wallets/recharge`
- **Parámetros**: `document`, `phone`, `amount`, opcionalmente metadatos `reference` y `notes`.
- **Validaciones**: montos positivos, coincidencia de documento y teléfono con un cliente registrado.
- **Resultado**: se incrementa el saldo del wallet y se registra una transacción tipo `CREDIT`. La respuesta incluye nuevo balance y mensaje de éxito o detalle del fallo (por ejemplo cliente inexistente).
- **Implementación**: transacción Prisma que actualiza saldo y crea el registro en `Transaction`.

### 3. Generar pago (token de confirmación)
- **Endpoint**: `POST /api/v1/payments/initiate`
- **Parámetros**: `document`, `phone`, `amount`, `description` opcional.
- **Flujo**:
  1. Se valida que la billetera tenga saldo suficiente.
  2. Se genera un token de 6 dígitos y una sesión (`PaymentSession`) con fecha de expiración configurable.
  3. Se envía el token por correo usando Nodemailer + SMTP, informando en la respuesta si el email fue entregado.
- **Resultado**: payload con `sessionId`, `token` (visible en la UI para pruebas), monto, expiración, datos del cliente y estado del correo. Respuesta estandarizada con código `PAYMENT_SESSION_CREATED`.
- **Notas**: el token se asocia internamente a la sesión; el ID se expone en la vista como referencia y también llega en la respuesta del servicio.

### 4. Confirmar pago
- **Endpoint**: `POST /api/v1/payments/confirm`
- **Parámetros**: `token` (6 dígitos). El ID de sesión se usa internamente y se muestra en la UI como campo solo lectura.
- **Flujo**:
  1. Se recupera la sesión `PENDING` más reciente para ese token.
  2. Se valida expiración y saldo disponible.
  3. Se descuenta la billetera, se marca la sesión como `CONFIRMED` y se registra transacción `DEBIT`.
- **Resultado**: balance actualizado, fecha de confirmación y código `PAYMENT_CONFIRMED`. Si el token expiró o no existe, se retorna `TOKEN_EXPIRED` o `SESSION_NOT_FOUND`.

### 5. Consultar saldo
- **Endpoint**: `GET /api/v1/wallets/balance?document=...&phone=...`
- **Parámetros**: `document`, `phone` (ambos obligatorios y deben coincidir).
- **Resultado**: saldo actual de la billetera, nombre del cliente y fecha de última actualización. Respuesta con código `WALLET_BALANCE`. Si no se encuentra el cliente, se responde `CLIENT_NOT_FOUND`.

Todas las operaciones exponen mensajes claros y códigos de negocio (`CLIENT_REGISTERED`, `WALLET_RECHARGED`, `PAYMENT_SESSION_CREATED`, `PAYMENT_CONFIRMED`, `WALLET_BALANCE`) o de error (`CLIENT_EXISTS`, `INSUFFICIENT_FUNDS`, etc.), cumpliendo con el estándar de respuestas solicitado.

## Colección Postman

Puedes documentar y compartir los endpoints creando una colección en Postman o tu herramienta favorita. Los puntos mencionados arriba son los que deben cubrirse (registro, recarga, generación/confirmación de pago y consulta de saldo).

## Scripts útiles

- `npm run prisma:generate` (db-service) – Regenera el cliente Prisma tras cambios en el schema.
- `npm run prisma:migrate` (db-service) – Crea nueva migración (requiere conexión activa a MySQL).
- `npm run prisma:migrate:deploy` (db-service) – Aplica migraciones existentes a la BD indicada.
- `npm run dev` – Disponible en los tres proyectos para modo desarrollo con recarga automática.


