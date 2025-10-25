import { prisma } from "../prisma.js";
import { AppError } from "../utils/errors.js";

export const registerClient = async ({ document, fullName, email, phone }) => {
  const existing = await prisma.client.findFirst({
    where: {
      OR: [{ document }, { email }],
    },
    select: {
      id: true,
      document: true,
      email: true,
    },
  });

  if (existing) {
    const conflictedField = existing.document === document ? "document" : "email";
    throw new AppError(
      409,
      "CLIENT_EXISTS",
      `Ya existe un cliente con ese ${conflictedField}.`,
    );
  }

  const client = await prisma.client.create({
    data: {
      document,
      fullName,
      email,
      phone,
      wallet: {
        create: {},
      },
    },
    include: {
      wallet: true,
    },
  });

  return client;
};

export const findClientByIdentity = async (document, phone) => {
  const client = await prisma.client.findFirst({
    where: {
      document,
      phone,
    },
    include: {
      wallet: true,
    },
  });

  if (!client) {
    throw new AppError(
      404,
      "CLIENT_NOT_FOUND",
      "Cliente no encontrado para el documento y celular proporcionados.",
    );
  }

  if (!client.wallet) {
    throw new AppError(
      500,
      "WALLET_NOT_FOUND",
      "No se encontró una billetera asociada a este cliente. Contacta a soporte.",
    );
  }

  return client;
};
