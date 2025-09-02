import { genToken } from "../utils/genToken";
import contactMail from "./contactMail";

export const sendForgotPassword = async (email: string, userId: string) => {
  const token = genToken({ userId, email }, "1h");
  const link = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  const text = `Click the link to reset your password: ${link}`;
  await contactMail(email, "Reset your password", text);
  return { sent: true };
};

export default { sendForgotPassword };
