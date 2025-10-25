import { config } from "dotenv";

config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ["true", "1", "yes"].includes(String(value).toLowerCase());
};

export const env = {
  port: toNumber(process.env.API_SERVICE_PORT, 4000),
  appName: process.env.APP_NAME ?? "ePayco Wallet API",
  dbServiceBaseUrl: process.env.DB_SERVICE_BASE_URL ?? "http://localhost:4001/internal/v1",
  dbServiceTimeout: toNumber(process.env.DB_SERVICE_TIMEOUT, 8000),
  email: {
    enabled: toBoolean(process.env.EMAIL_ENABLED, true),
    host: process.env.EMAIL_HOST,
    port: toNumber(process.env.EMAIL_PORT, 587),
    secure: toBoolean(process.env.EMAIL_SECURE, false),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM ?? "no-reply@wallet.local",
  },
};
