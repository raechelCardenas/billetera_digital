import { ZodError } from "zod";

export const mapZodError = (error) => {
  if (!(error instanceof ZodError)) {
    return [];
  }

  return error.errors.map((issue) => ({
    field: issue.path.join(".") || undefined,
    message: issue.message,
    code: issue.code,
  }));
};
