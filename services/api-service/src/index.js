import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/apiRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : undefined;

app.use(helmet());
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
    dbService: env.dbServiceBaseUrl,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[API-SERVICE] ${env.appName} listening on port ${env.port}`);
});
