import { z } from "zod";

export const registerClientSchema = z.object({
  document: z.string().min(4),
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(7),
});

export const identitySchema = z.object({
  document: z.string().min(4),
  phone: z.string().min(7),
});

export const rechargeWalletSchema = identitySchema.extend({
  amount: z.coerce.number().positive(),
  metadata: z
    .object({
      reference: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export const initiatePaymentSchema = identitySchema.extend({
  amount: z.coerce.number().positive(),
  description: z.string().min(1).max(255).optional(),
});

export const confirmPaymentSchema = z.object({
  token: z.string().regex(/^[0-9]{6}$/),
});
