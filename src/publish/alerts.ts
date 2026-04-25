import nodemailer from "nodemailer";
import { appEnv, hasEmailAlerts } from "../config/brand.js";
import { logWarn } from "../util/log.js";

export const sendFailureAlert = async (subject: string, body: string) => {
  if (!hasEmailAlerts()) {
    logWarn("SMTP settings are not configured. Skipping email alert.");
    return false;
  }

  const transport = nodemailer.createTransport({
    host: appEnv.SMTP_HOST,
    port: appEnv.SMTP_PORT,
    secure: appEnv.SMTP_SECURE,
    auth: {
      user: appEnv.SMTP_USER,
      pass: appEnv.SMTP_PASS
    }
  });

  await transport.sendMail({
    from: appEnv.ALERT_FROM,
    to: appEnv.ALERT_TO,
    subject,
    text: body
  });

  return true;
};
