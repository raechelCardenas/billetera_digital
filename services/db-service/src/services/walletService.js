import { PaymentSessionStatus, TransactionType } from "@prisma/client";
import { prisma } from "../prisma.js";
import { AppError } from "../utils/errors.js";
import { decimalToNumber } from "../utils/money.js";
import { generateNumericToken } from "../utils/token.js";
import { env } from "../config/env.js";
import { findClientByIdentity } from "./clientService.js";

const buildTransactionDescription = (fallback, metadata) => {
  if (!metadata) {
    return fallback;
  }

  const parts = [];
  if (metadata.reference) parts.push(`Ref: ${metadata.reference}`);
  if (metadata.notes) parts.push(metadata.notes);

  if (!parts.length) {
    return fallback;
  }

  return `${fallback} | ${parts.join(" - ")}`;
};

export const rechargeWallet = async ({ document, phone, amount, metadata }) => {
  const client = await findClientByIdentity(document, phone);

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: {
        clientId: client.id,
      },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    await tx.transaction.create({
      data: {
        type: TransactionType.CREDIT,
        amount,
        description: buildTransactionDescription("Wallet recharge", metadata),
        clientId: client.id,
      },
    });

    return wallet;
  });

  return {
    clientId: client.id,
    clientName: client.fullName,
    balance: decimalToNumber(result.balance),
  };
};

export const getWalletBalance = async ({ document, phone }) => {
  const client = await findClientByIdentity(document, phone);

  return {
    clientId: client.id,
    fullName: client.fullName,
    balance: decimalToNumber(client.wallet.balance),
    updatedAt: client.wallet.updatedAt,
  };
};

export const initiatePayment = async ({ document, phone, amount, description }) => {
  const client = await findClientByIdentity(document, phone);
  const balance = decimalToNumber(client.wallet.balance);

  if (balance < amount) {
    throw new AppError(400, "INSUFFICIENT_FUNDS", "Wallet does not have enough balance.");
  }

  const token = generateNumericToken(6);
  const expiresAt = new Date(Date.now() + env.tokenExpiryMinutes * 60 * 1000);

  const session = await prisma.paymentSession.create({
    data: {
      token,
      amount,
      description,
      status: PaymentSessionStatus.PENDING,
      expiresAt,
      clientId: client.id,
    },
  });

  return {
    sessionId: session.id,
    token,
    expiresAt: session.expiresAt,
    amount: decimalToNumber(session.amount),
    client,
  };
};

export const confirmPayment = async ({ token }) => {
  const session = await prisma.paymentSession.findFirst({
    where: {
      token,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: {
        include: {
          wallet: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(404, "SESSION_NOT_FOUND", "No se encontró una sesión de pago para ese token.");
  }

  if (session.status !== PaymentSessionStatus.PENDING) {
    throw new AppError(400, "SESSION_NOT_PENDING", "Payment session is not pending.");
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.paymentSession.update({
      where: { id: session.id },
      data: { status: PaymentSessionStatus.EXPIRED },
    });
    throw new AppError(400, "TOKEN_EXPIRED", "The confirmation token has expired.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { clientId: session.clientId },
      select: { id: true, balance: true },
    });

    if (!wallet) {
      throw new AppError(500, "WALLET_NOT_FOUND", "Wallet associated with this client was not found.");
    }

    const currentBalance = decimalToNumber(wallet.balance);
    const amount = decimalToNumber(session.amount);

    if (currentBalance < amount) {
      throw new AppError(400, "INSUFFICIENT_FUNDS", "Wallet does not have enough balance.");
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: session.amount,
        },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        type: TransactionType.DEBIT,
        amount: session.amount,
        description:
          session.description ?? `Wallet payment confirmed for session ${session.id}.`,
        clientId: session.clientId,
        paymentId: session.id,
      },
    });

    const updatedSession = await tx.paymentSession.update({
      where: { id: session.id },
      data: {
        status: PaymentSessionStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
      session: updatedSession,
    };
  });

  return {
    sessionId: result.session.id,
    clientId: session.clientId,
    balance: decimalToNumber(result.wallet.balance),
    confirmedAt: result.session.confirmedAt,
  };
};
