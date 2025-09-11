import { Request, Response } from "express";
import Contact from "../database/models/contactModel";
import axios from "axios";
import { Resend } from "resend";

const resendClient = new Resend(process.env.RESEND_API_KEY || "");

// HTML template provided (green glass design) for admin notification
const CONTACT_HTML_TEMPLATE = `
<span style="display:none;max-height:0;overflow:hidden;visibility:hidden;mso-hide:all;">
	New contact message from your website.
</span>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#d1fae5;padding:24px 0;font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
	<tr>
		<td align="center">
			<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;box-shadow:0 6px 18px rgba(16,24,40,0.12);">
				<tr>
					<td style="padding:24px 28px;background:rgba(6,78,59,0.9);color:#ffffff;text-align:left;">
						<h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.2px;">New Contact Message</h1>
						<div style="margin-top:6px;font-size:13px;opacity:0.9;">From your website</div>
					</td>
				</tr>
				<tr>
					<td style="padding:24px 28px;background:rgba(209,250,229,0.9);color:#111827;">
						<p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;">You received a new message through the contact form. Details are below:</p>
						<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(16,185,129,0.2);border-radius:12px;background:rgba(236,253,245,0.8);padding:16px;">
							<tr>
								<td>
									<p style="margin:0;color:#064e3b;font-weight:600;font-size:14px;">Sender</p>
									<p style="margin:4px 0 10px 0;color:#111827;font-size:13px;">
										<strong>Name:</strong> {{name}}<br>
										<strong>Email:</strong> <a href="mailto:{{email}}" style="color:#047857;text-decoration:none;">{{email}}</a><br>
										<strong>Subject:</strong> {{subject}}
									</p>
									<p style="margin:0;color:#064e3b;font-weight:600;font-size:14px;">Message</p>
									<div style="margin-top:8px;color:#111827;font-size:13px;line-height:1.6;white-space:pre-wrap;">{{message}}</div>
								</td>
							</tr>
						</table>
						<div style="margin-top:16px;">
							<a href="mailto:{{email}}" style="display:inline-block;padding:10px 16px;background:#059669;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">Reply to Sender</a>
							<div style="margin-top:8px;font-size:12px;color:#065f46;">Received: {{created_at}}</div>
						</div>
					</td>
				</tr>
				<tr>
					<td style="padding:16px 28px;background:rgba(6,78,59,0.9);color:#ffffff;text-align:center;font-size:12px;">
						<div>Received by <strong>My E-Commerce</strong> • <a href="mailto:${process.env.CONTACT_FROM_EMAIL || "no-reply@example.com"}" style="color:#bbf7d0;text-decoration:none;">${process.env.CONTACT_FROM_EMAIL || "no-reply@example.com"}</a></div>
						<div style="margin-top:4px;">© {{year}}</div>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>`;

const escapeHtml = (str: string) => String(str || "")
	.replace(/&/g, "&amp;")
	.replace(/</g, "&lt;")
	.replace(/>/g, "&gt;")
	.replace(/"/g, "&quot;")
	.replace(/'/g, "&#039;");

// Basic validation helper
const validate = (body: any) => {
	const errors: string[] = [];
	if (!body.name || body.name.trim().length < 2) errors.push("name required");
	if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) errors.push("valid email required");
	if (!body.subject || body.subject.trim().length < 3) errors.push("subject required");
	if (!body.message || body.message.trim().length < 5) errors.push("message required");
	return errors;
};

// POST /api/contact
export const submitContact = async (req: Request, res: Response) => {
	const errors = validate(req.body);
	if (errors.length) return res.status(400).json({ message: "validation failed", errors });
	try {
			const { name, email, subject, message } = req.body;
			const contact = await Contact.create({ name, email, subject, message });

			// Send notification to admin(s) via Resend using template
			try {
				const adminTo = process.env.CONTACT_NOTIFICATION_TO || process.env.CONTACT_FROM_EMAIL;
				if (adminTo && process.env.RESEND_API_KEY) {
					const createdAt = new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });
					const year = new Date().getFullYear();
					const html = CONTACT_HTML_TEMPLATE
						.replace(/{{name}}/g, escapeHtml(name))
						.replace(/{{email}}/g, escapeHtml(email))
						.replace(/{{subject}}/g, escapeHtml(subject))
						.replace(/{{message}}/g, escapeHtml(message))
						.replace(/{{created_at}}/g, escapeHtml(createdAt))
						.replace(/{{year}}/g, String(year));
					await resendClient.emails.send({
						from: `Contact Form <${process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev"}>`,
						to: adminTo.split(",").map(s => s.trim()).filter(Boolean),
							subject: `[Contact] ${subject}`,
							html,
							text: `New message from ${name} (${email})\nSubject: ${subject}\n\n${message}`,
					});
				}
			} catch (e) {
				console.error("contact admin email failed", (e as any).message);
			}

			return res.status(201).json({ message: "submitted", contact });
	} catch (err: any) {
		return res.status(500).json({ message: "failed", error: err.message });
	}
};

// GET /api/contact (admin)
export const listContacts = async (req: Request, res: Response) => {
	const { page = 1, limit = 20, status, q } = req.query as any;
	const where: any = {};
	if (status) where.status = status;
	if (q) where.subject = { $like: `%${q}%` };
	try {
		const offset = (Number(page) - 1) * Number(limit);
		const { rows, count } = await Contact.findAndCountAll({ where, limit: Number(limit), offset, order: [["createdAt", "DESC"]] });
		return res.json({ data: rows, meta: { total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) } });
	} catch (err: any) {
		return res.status(500).json({ message: "failed", error: err.message });
	}
};

// GET /api/contact/:id (admin)
export const getContact = async (req: Request, res: Response) => {
	try {
		const contact = await Contact.findByPk(req.params.id);
		if (!contact) return res.status(404).json({ message: "not found" });
		if (contact.status === "new") {
			contact.status = "read";
			await contact.save();
		}
		return res.json({ contact });
	} catch (err: any) {
		return res.status(500).json({ message: "failed", error: err.message });
	}
};

// PATCH /api/contact/:id/status (admin)
export const updateStatus = async (req: Request, res: Response) => {
	const { status } = req.body;
	if (!status || !["new", "read", "archived"].includes(status)) {
		return res.status(400).json({ message: "invalid status" });
	}
	try {
		const contact = await Contact.findByPk(req.params.id);
		if (!contact) return res.status(404).json({ message: "not found" });
		contact.status = status;
		await contact.save();
		return res.json({ message: "updated", contact });
	} catch (err: any) {
		return res.status(500).json({ message: "failed", error: err.message });
	}
};

// POST /api/contact/:id/reply (admin) - send email via Resend
export const replyContact = async (req: Request, res: Response) => {
	const { replyMessage } = req.body;
	if (!replyMessage || replyMessage.trim().length < 2) return res.status(400).json({ message: "replyMessage required" });
	try {
		const contact = await Contact.findByPk(req.params.id);
		if (!contact) return res.status(404).json({ message: "not found" });

		const apiKey = process.env.RESEND_API_KEY;
		const fromEmail = process.env.CONTACT_FROM_EMAIL || "no-reply@example.com";
		if (!apiKey) return res.status(500).json({ message: "missing RESEND_API_KEY" });

		// Resend API call
			if (apiKey) {
				// Use resend SDK (preferred)
				try {
					await resendClient.emails.send({
						from: `Support <${fromEmail}>`,
						to: contact.email,
						subject: `Re: ${contact.subject}`,
						html: `<p style=\"font-family:Arial,sans-serif;font-size:14px;line-height:1.5;\">${replyMessage.replace(/\n/g, "<br/>")}</p>`
					});
				} catch (sdkErr) {
					// fallback to raw axios if SDK fails
					await axios.post(
						"https://api.resend.com/emails",
						{ from: fromEmail, to: contact.email, subject: `Re: ${contact.subject}` , html: `<p>${replyMessage.replace(/\n/g, "<br/>")}</p>` },
						{ headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
					);
				}
			}

		contact.status = "read";
		contact.respondedAt = new Date();
		await contact.save();

		return res.json({ message: "reply sent" });
	} catch (err: any) {
		return res.status(500).json({ message: "failed", error: err.message });
	}
};

export default { submitContact, listContacts, getContact, updateStatus, replyContact };

