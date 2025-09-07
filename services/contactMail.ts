import axios from "axios";

const RESEND_API = process.env.RESEND_API_KEY;

export const contactMail = async (to: string, subject: string, text: string) => {
  if (!RESEND_API) throw new Error("RESEND_API_KEY not configured");
  const url = "https://api.resend.com/emails";
  const body = {
    from: process.env.CONTACT_EMAIL || "codingwithjiwan@gmail.com",
    to,
    subject,
    text,
  };
  const resp = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${RESEND_API}`, "Content-Type": "application/json" },
  });
  return resp.data;
};

export default contactMail;
