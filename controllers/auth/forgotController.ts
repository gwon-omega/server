import { Request, Response } from "express";
import User from "../../database/models/userModel";
import ForgotPassword from "../../database/models/forgotPassModel";
import { generatePassword } from "../../utils/genPass";
import contactMail from "../../services/contactMail";

const PIN_TTL_MINUTES = parseInt(process.env.FORGOT_PIN_TTL_MINUTES || "15", 10);

const genPin = () => Math.floor(100000 + Math.random() * 900000).toString();

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const pin = genPin();
    const expiresAt = new Date(Date.now() + PIN_TTL_MINUTES * 60 * 1000);

  await ForgotPassword.create({ userId: (user as any).userId, pin, expiresAt, used: false });

    // send email with PIN
    try {
      await contactMail(email, "Your password reset PIN", `Your PIN is: ${pin}`);
    } catch (err) {
      console.error("Failed to send PIN email", err);
    }

    return res.json({ message: "PIN sent to your email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

const findValidPinRecord = async (email: string, pin: string) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;
  const record = await ForgotPassword.findOne({ where: { userId: (user as any).userId, pin }, order: [["createdAt", "DESC"]] });
  if (!record) return null;
  const r: any = record; // relaxed typing due to dynamic model fields
  if (r.used) return null;
  if (r.expiresAt && new Date(r.expiresAt).getTime() < Date.now()) return null;
  return { user, record: r };
};

export const verifyPin = async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) return res.status(400).json({ message: "email and pin required" });

    const found = await findValidPinRecord(email, pin);
    if (!found) return res.status(400).json({ message: "Invalid or expired PIN" });

    return res.json({ message: "PIN verified, proceed to reset password" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, pin, newPassword } = req.body;
    if (!email || !pin || !newPassword) return res.status(400).json({ message: "email, pin and newPassword required" });

    const found = await findValidPinRecord(email, pin);
    if (!found) return res.status(400).json({ message: "Invalid or expired PIN" });

    const hashed = await generatePassword(newPassword);
  await User.update({ password: hashed }, { where: { userId: (found.user as any).userId } });
	await ForgotPassword.update({ used: true }, { where: { id: (found.record as any).id } });

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export default { requestPasswordReset, verifyPin, resetPassword };
