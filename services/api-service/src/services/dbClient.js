import axios from "axios";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const client = axios.create({
  baseURL: env.dbServiceBaseUrl,
  timeout: env.dbServiceTimeout,
});

const handleResponse = (response) => {
  if (response?.data?.success) {
    return response.data;
  }

  const payload = response?.data ?? {};
  throw new AppError(
    response?.status ?? 500,
    payload.code ?? "DB_SERVICE_ERROR",
    payload.message ?? "Error inesperado al invocar el servicio de base de datos.",
    payload.errors,
  );
};

const handleRequest = async (method, url, options = {}) => {
  const response = await client.request({
    method,
    url,
    data: options.data,
    params: options.params,
  });

  return handleResponse(response);
};

export const dbService = {
  registerClient: (data) => handleRequest("post", "/clients", { data }),
  rechargeWallet: (data) => handleRequest("post", "/wallets/recharge", { data }),
  initiatePayment: (data) => handleRequest("post", "/payments/initiate", { data }),
  confirmPayment: (data) => handleRequest("post", "/payments/confirm", { data }),
  getWalletBalance: (params) => handleRequest("get", "/wallets/balance", { params }),
};
