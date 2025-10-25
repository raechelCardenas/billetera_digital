import { Router } from "express";
import {
  registerClientHandler,
  rechargeWalletHandler,
  initiatePaymentHandler,
  confirmPaymentHandler,
  walletBalanceHandler,
} from "../controllers/internalController.js";

export const internalRouter = Router();

internalRouter.post("/clients", registerClientHandler);
internalRouter.post("/wallets/recharge", rechargeWalletHandler);
internalRouter.post("/payments/initiate", initiatePaymentHandler);
internalRouter.post("/payments/confirm", confirmPaymentHandler);
internalRouter.get("/wallets/balance", walletBalanceHandler);
