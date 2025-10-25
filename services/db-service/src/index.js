import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import { internalRouter } from "./routes/internalRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : undefined;

app.use(
  cors({
    origin: allowedOrigins ?? true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: env.appName,
    timestamp: new Date().toISOString(),
  });
});

app.use("/internal/v1", internalRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[DB-SERVICE] ${env.appName} listening on port ${env.port}`);
});
