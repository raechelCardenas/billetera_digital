import { errorResponse } from "../utils/responses.js";
import { AppError, fromAxiosError, isAppError } from "../utils/errors.js";

export const notFoundHandler = (req, res) => {
  res
    .status(404)
    .json(errorResponse("NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found.`));
};

export const errorHandler = (error, req, res, _next) => {
  let normalizedError = error;

  if (error?.isAxiosError) {
    normalizedError = fromAxiosError(error);
  }

  if (isAppError(normalizedError)) {
    const status = normalizedError.status ?? 500;
    res
      .status(status)
      .json(
        errorResponse(
          normalizedError.code ?? "APPLICATION_ERROR",
          normalizedError.message,
          normalizedError.errors,
        ),
      );
    return;
  }

  console.error("[API-SERVICE]", normalizedError);
  res
    .status(500)
    .json(errorResponse("INTERNAL_ERROR", "Error inesperado. Inténtalo nuevamente más tarde."));
};
