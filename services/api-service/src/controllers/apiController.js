import { dbService } from "../services/dbClient.js";
import { sendPaymentTokenEmail } from "../services/emailService.js";
import {
  registerClientSchema,
  rechargeSchema,
  initiatePaymentSchema,
  confirmPaymentSchema,
  identitySchema,
} from "../validators/wallet.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/responses.js";
import { mapZodError } from "../utils/validation.js";

const validate = (schema, payload) => {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      errors: mapZodError(parsed.error),
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
};

export const registerClientHandler = asyncHandler(async (req, res) => {
  const validation = validate(registerClientSchema, req.body);

  if (!validation.ok) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_PAYLOAD",
          "Información incompleta para el registro del cliente.",
          validation.errors,
        ),
      );
  }

  const response = await dbService.registerClient(validation.data);

  return res
    .status(201)
    .json(
      successResponse(
        "CLIENT_REGISTERED",
        "Cliente registrado correctamente.",
        response.data,
      ),
    );
});

export const rechargeWalletHandler = asyncHandler(async (req, res) => {
  const validation = validate(rechargeSchema, req.body);

  if (!validation.ok) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_PAYLOAD",
          "Información incompleta para recargar la billetera.",
          validation.errors,
        ),
      );
  }

  const response = await dbService.rechargeWallet(validation.data);

  return res
    .status(200)
    .json(
      successResponse(
        "WALLET_RECHARGED",
        "Recarga realizada correctamente.",
        response.data,
      ),
    );
});

export const initiatePaymentHandler = asyncHandler(async (req, res) => {
  const validation = validate(initiatePaymentSchema, req.body);

  if (!validation.ok) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_PAYLOAD",
          "Información incompleta para iniciar el pago.",
          validation.errors,
        ),
      );
  }

  const response = await dbService.initiatePayment(validation.data);

  const delivery = await sendPaymentTokenEmail({
    to: response.data.client.email,
    fullName: response.data.client.fullName,
    token: response.data.token,
    amount: response.data.amount,
    expiresAt: response.data.expiresAt,
  });

  const message = delivery.delivered
    ? "Se envió el token de confirmación al correo registrado."
    : "Token generado. No fue posible enviar el correo automáticamente.";

  return res
    .status(201)
    .json(
      successResponse("PAYMENT_SESSION_CREATED", message, {
        sessionId: response.data.sessionId,
        expiresAt: response.data.expiresAt,
        amount: response.data.amount,
        client: response.data.client,
        emailDelivery: delivery,
        sessionId: response.data.sessionId,
      }),
    );
});

export const confirmPaymentHandler = asyncHandler(async (req, res) => {
  const validation = validate(confirmPaymentSchema, req.body);

  if (!validation.ok) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_PAYLOAD",
          "Información incompleta para confirmar el pago.",
          validation.errors,
        ),
      );
  }

  const response = await dbService.confirmPayment(validation.data);

  return res
    .status(200)
    .json(
      successResponse(
        "PAYMENT_CONFIRMED",
        "Pago confirmado exitosamente.",
        response.data,
      ),
    );
});

export const walletBalanceHandler = asyncHandler(async (req, res) => {
  const validation = validate(identitySchema, req.query);

  if (!validation.ok) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_QUERY",
          "Documento y celular son requeridos.",
          validation.errors,
        ),
      );
  }

  const response = await dbService.getWalletBalance(validation.data);

  return res
    .status(200)
    .json(
      successResponse(
        "WALLET_BALANCE",
        "Consulta de saldo exitosa.",
        response.data,
      ),
    );
});
