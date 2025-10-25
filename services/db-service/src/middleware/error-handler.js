import { errorResponse } from "../utils/responses.js";
import { isAppError, wrapPrismaError } from "../utils/errors.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json(
    errorResponse("NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found.`),
  );
};

export const errorHandler = (
  err,
  req,
  res,
  _next,
) => {
  const normalizedError = wrapPrismaError(err);

  if (isAppError(normalizedError)) {
    const status = normalizedError.status ?? 400;
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

  console.error(`[DB-SERVICE]`, normalizedError);
  res
    .status(500)
    .json(
      errorResponse(
        "INTERNAL_ERROR",
        normalizedError?.message ?? "Error inesperado. Inténtalo nuevamente más tarde.",
      ),
    );
};
