import { Request, Response } from "express";
import Contact from "../database/models/contactModel";
import axios from "axios";
import { Resend } from "resend";
import { Op } from "sequelize"; // ✅ Fix Sequelize operators

const resendClient = new Resend(process.env.RESEND_API_KEY || "");
const fromEmail = process.env.CONTACT_FROM_EMAIL || "no-reply@example.com";

// Escape HTML helper
const escapeHtml = (str: string) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// Basic validation helper
const validate = (body: any) => {
  const errors: string[] = [];
  if (!body.name || body.name.trim().length < 2) errors.push("name required");
  if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email))
    errors.push("valid email required");

  // ⚠️ Align with frontend: make subject optional (instead of required)
  if (body.subject && body.subject.trim().length < 3)
    errors.push("subject too short");

  if (!body.message || body.message.trim().length < 5)
    errors.push("message required");
  return errors;
};

// POST /api/contact
export const submitContact = async (req: Request, res: Response) => {
  const errors = validate(req.body);
  if (errors.length)
    return res.status(400).json({ error: "validation failed", details: errors });

  try {
    const { name, email, subject = "", message } = req.body;
    const contact = await Contact.create({ name, email, subject, message });

    // Send notification email to admin
    try {
      const adminTo =
        process.env.CONTACT_NOTIFICATION_TO || process.env.CONTACT_FROM_EMAIL;
      if (adminTo && process.env.RESEND_API_KEY) {
        const createdAt = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kathmandu",
        });
        const year = new Date().getFullYear();

				// Basic HTML template
        const CONTACT_HTML_TEMPLATE = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; font-size: 14px; color: #333;">
        <h2 style="color:#2563eb;">📩 New Contact Form Submission</h2>
        <p><strong>Name:</strong> {{name}}</p>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left:4px solid #ccc; margin:10px 0; padding-left:10px;">
        {{message}}
        </blockquote>
        <hr/>
        <p style="font-size:12px;color:#666;">
        Submitted at: {{created_at}} <br/>
        &copy; {{year}} Contact System
        </p>
        </div>
    `;
        // Inject values safely into template
        const html = CONTACT_HTML_TEMPLATE.replace(/{{name}}/g, escapeHtml(name))
          .replace(/{{email}}/g, escapeHtml(email))
          .replace(/{{subject}}/g, escapeHtml(subject))
          .replace(/{{message}}/g, escapeHtml(message))
          .replace(/{{created_at}}/g, escapeHtml(createdAt))
          .replace(/{{year}}/g, String(year));

        await resendClient.emails.send({
          from: `Contact Form <${fromEmail}>`, // ✅ safe fallback
          to: adminTo.split(",").map((s) => s.trim()).filter(Boolean),
          subject: `[Contact] ${subject || "(no subject)"}`,
          html,
          text: `New message from ${name} (${email})\nSubject: ${subject}\n\n${message}`,
        });
      }
    } catch (e) {
      console.error("contact admin email failed", (e as any).message);
    }

    return res.status(201).json({ message: "submitted", contact });
  } catch (err: any) {
    return res.status(500).json({ error: "failed", details: err.message });
  }
};

// GET /api/contact (admin)
export const listContacts = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, q } = req.query as any;
  const where: any = {};
  if (status) where.status = status;
  if (q) where.subject = { [Op.like]: `%${q}%` }; // ✅ fixed

  try {
    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await Contact.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });
    return res.json({
      data: rows,
      meta: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "failed", details: err.message });
  }
};

// GET /api/contact/:id (admin)
export const getContact = async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: "not found" });

    if (contact.status === "new") {
      contact.status = "read";
      await contact.save();
    }

    return res.json({ contact });
  } catch (err: any) {
    return res.status(500).json({ error: "failed", details: err.message });
  }
};

// PATCH /api/contact/:id/status (admin)
export const updateStatus = async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status || !["new", "read", "archived"].includes(status)) {
    return res.status(400).json({ error: "invalid status" });
  }
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: "not found" });

    contact.status = status;
    await contact.save();

    return res.json({ message: "updated", contact });
  } catch (err: any) {
    return res.status(500).json({ error: "failed", details: err.message });
  }
};

// POST /api/contact/:id/reply (admin)
export const replyContact = async (req: Request, res: Response) => {
  const { replyMessage } = req.body;
  if (!replyMessage || replyMessage.trim().length < 2) {
    return res.status(400).json({ error: "replyMessage required" });
  }

  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: "not found" });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "missing RESEND_API_KEY" });

    try {
      await resendClient.emails.send({
        from: `Support <${fromEmail}>`,
        to: contact.email,
        subject: `Re: ${contact.subject}`,
        html: `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">${escapeHtml(
          replyMessage
        ).replace(/\n/g, "<br/>")}</p>`,
      });
    } catch (sdkErr) {
      // fallback if SDK fails
      await axios.post(
        "https://api.resend.com/emails",
        {
          from: fromEmail,
          to: contact.email,
          subject: `Re: ${contact.subject}`,
          html: `<p>${escapeHtml(replyMessage).replace(/\n/g, "<br/>")}</p>`,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        }
      );
    }

    contact.status = "read";
    contact.respondedAt = new Date();
    await contact.save();

    return res.json({ message: "reply sent" });
  } catch (err: any) {
    return res.status(500).json({ error: "failed", details: err.message });
  }
};

export default { submitContact, listContacts, getContact, updateStatus, replyContact };
