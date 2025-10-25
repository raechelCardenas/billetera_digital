import { config } from "dotenv";

config();

export const env = {
  port: Number(process.env.DB_SERVICE_PORT ?? 4001),
  appName: process.env.APP_NAME ?? "ePayco Wallet DB Service",
  tokenExpiryMinutes: Number(process.env.PAYMENT_TOKEN_EXPIRY_MINUTES ?? 10),
};
