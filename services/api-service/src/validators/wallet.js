import { z } from "zod";

const documentSchema = z.string().min(4, "Document must have at least 4 characters");
const phoneSchema = z.string().min(7, "Phone must have at least 7 characters");

export const registerClientSchema = z.object({
  document: documentSchema,
  fullName: z.string().min(3, "Full name must have at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: phoneSchema,
});

export const identitySchema = z.object({
  document: documentSchema,
  phone: phoneSchema,
});

export const rechargeSchema = identitySchema.extend({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  metadata: z
    .object({
      reference: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export const initiatePaymentSchema = identitySchema.extend({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().max(255).optional(),
});

export const confirmPaymentSchema = z.object({
  token: z.string().regex(/^[0-9]{6}$/, "Token must contain six digits"),
});
