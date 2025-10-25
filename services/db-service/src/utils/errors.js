export class AppError extends Error {
  constructor(status, code, message, errors) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export const isAppError = (error) => error instanceof AppError;

export const wrapPrismaError = (error) => {
  if (
    error &&
    typeof error === "object" &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target)
  ) {
    const target = error.meta.target.join(", ");
    return new AppError(
      409,
      "RESOURCE_CONFLICT",
      `A record with the same ${target} already exists.`,
    );
  }

  return error;
};
