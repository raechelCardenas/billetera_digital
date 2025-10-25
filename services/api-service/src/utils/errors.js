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

export const fromAxiosError = (error) => {
  if (!error || typeof error !== "object" || !error.isAxiosError) {
    return error;
  }

  const status = error.response?.status ?? 500;
  const payload = error.response?.data;

  if (payload && typeof payload === "object" && payload.code && payload.message) {
    return new AppError(status, payload.code, payload.message, payload.errors);
  }

  return new AppError(status, "DB_SERVICE_ERROR", error.message);
};
