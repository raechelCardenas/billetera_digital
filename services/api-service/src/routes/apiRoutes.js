import { Router } from "express";
import {
  registerClientHandler,
  rechargeWalletHandler,
  initiatePaymentHandler,
  confirmPaymentHandler,
  walletBalanceHandler,
} from "../controllers/apiController.js";

export const apiRouter = Router();

apiRouter.post("/clients", registerClientHandler);
apiRouter.post("/wallets/recharge", rechargeWalletHandler);
apiRouter.post("/payments/initiate", initiatePaymentHandler);
apiRouter.post("/payments/confirm", confirmPaymentHandler);
apiRouter.get("/wallets/balance", walletBalanceHandler);
