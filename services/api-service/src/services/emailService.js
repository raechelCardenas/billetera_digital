import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

const getTransporter = () => {
  if (!env.email.enabled) {
    return { ok: false, reason: "Email delivery is disabled by configuration." };
  }

  if (!env.email.host || !env.email.user || !env.email.pass) {
    return { ok: false, reason: "Email credentials are not fully configured." };
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.secure,
      auth: {
        user: env.email.user,
        pass: env.email.pass,
      },
    });
  }

  return { ok: true, transporter };
};

const buildEmailContent = ({ fullName, token, amount, expiresAt }) => {
  const value = Number(amount) || 0;
  const subject = "Confirmación de pago ePayco Wallet";
  const text = `Hola ${fullName},\n\n` +
    `Hemos recibido una solicitud de pago por un valor de $${value.toFixed(2)}.\n` +
    `Utiliza el siguiente código de verificación para confirmar la compra:\n\n` +
    `${token}\n\n` +
    `Tu código expira el ${new Date(expiresAt).toLocaleString()}.\n\n` +
    `Si no reconoces esta solicitud ignora este mensaje.`;

  const html = `
    <p>Hola <strong>${fullName}</strong>,</p>
    <p>Hemos recibido una solicitud de pago por un valor de <strong>$${value.toFixed(2)}</strong>.</p>
    <p>Utiliza el siguiente código para confirmar la compra:</p>
    <p style="font-size:20px;font-weight:bold;letter-spacing:3px;">${token}</p>
    <p>El código expira el <strong>${new Date(expiresAt).toLocaleString()}</strong>.</p>
    <p>Si no reconoces esta solicitud, ignora este mensaje.</p>
  `;

  return { subject, text, html };
};

export const sendPaymentTokenEmail = async ({ to, fullName, token, amount, expiresAt }) => {
  const { ok, transporter: activeTransporter, reason } = getTransporter();

  if (!ok || !activeTransporter) {
    return { delivered: false, reason };
  }

  try {
    const { subject, text, html } = buildEmailContent({
      fullName,
      token,
      amount,
      expiresAt,
    });

    const info = await activeTransporter.sendMail({
      from: env.email.from,
      to,
      subject,
      text,
      html,
    });

    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error("[API-SERVICE] Email delivery failed:", error);
    return { delivered: false, reason: error.message };
  }
};
