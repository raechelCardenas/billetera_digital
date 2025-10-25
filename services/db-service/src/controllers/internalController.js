import { registerClient } from "../services/clientService.js";
import {
  rechargeWallet,
  getWalletBalance,
  initiatePayment,
  confirmPayment,
} from "../services/walletService.js";
import {
  registerClientSchema,
  rechargeWalletSchema,
  initiatePaymentSchema,
  confirmPaymentSchema,
  identitySchema,
} from "../validators/client.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/responses.js";
import { mapZodError } from "../utils/validation.js";

const validateBody = (schema, payload) => {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      errors: mapZodError(parsed.error),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
};

export const registerClientHandler = asyncHandler(async (req, res) => {
  const validation = validateBody(registerClientSchema, req.body);

  if (!validation.success) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_PAYLOAD",
          "Some fields are missing or invalid for client registration.",
          validation.errors,
        ),
      );
  }

  const client = await registerClient(validation.data);

  return res.status(201).json(
    successResponse("CLIENT_REGISTERED", "Client registered successfully.", {
      id: client.id,
      document: client.document,
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      walletId: client.wallet?.id,
    }),
  );
});

export const rechargeWalletHandler = asyncHandler(async (req, res) => {
  const validation = validateBody(rechargeWalletSchema, req.body);

  if (!validation.success) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_PAYLOAD",
          "Some fields are missing or invalid for wallet recharge.",
          validation.errors,
        ),
      );
  }

  const result = await rechargeWallet(validation.data);

  return res.status(200).json(
    successResponse("WALLET_RECHARGED", "Wallet recharged successfully.", {
      clientId: result.clientId,
      clientName: result.clientName,
      balance: result.balance,
    }),
  );
});

export const initiatePaymentHandler = asyncHandler(async (req, res) => {
  const validation = validateBody(initiatePaymentSchema, req.body);

  if (!validation.success) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_PAYLOAD",
          "Some fields are missing or invalid for payment initiation.",
          validation.errors,
        ),
      );
  }

  const session = await initiatePayment(validation.data);

  return res.status(201).json(
    successResponse("PAYMENT_SESSION_CREATED", "Payment session created successfully.", {
      sessionId: session.sessionId,
      token: session.token,
      expiresAt: session.expiresAt,
      amount: session.amount,
      client: {
        id: session.client.id,
        document: session.client.document,
        fullName: session.client.fullName,
        email: session.client.email,
        phone: session.client.phone,
      },
    }),
  );
});

export const confirmPaymentHandler = asyncHandler(async (req, res) => {
  const validation = validateBody(confirmPaymentSchema, req.body);

  if (!validation.success) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_PAYLOAD",
          "Some fields are missing or invalid for payment confirmation.",
          validation.errors,
        ),
      );
  }

  const result = await confirmPayment(validation.data);

  return res.status(200).json(
    successResponse("PAYMENT_CONFIRMED", "Payment confirmed successfully.", result),
  );
});

export const walletBalanceHandler = asyncHandler(async (req, res) => {
  const validation = validateBody(identitySchema, req.query);

  if (!validation.success) {
    return res
      .status(400)
      .json(
        errorResponse(
          "INVALID_QUERY",
          "Document and phone are required to query wallet balance.",
          validation.errors,
        ),
      );
  }

  const balance = await getWalletBalance(validation.data);

  return res
    .status(200)
    .json(successResponse("WALLET_BALANCE", "Wallet balance fetched successfully.", balance));
});
