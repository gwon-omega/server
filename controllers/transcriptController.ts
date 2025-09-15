import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Transcript from "../database/models/transcriptModel";
import Order from "../database/models/orderModel";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatCurrency(n: number) {
  return `Rs ${Number(n || 0).toLocaleString("en-NP")}`;
}

async function buildPdf(order: any, outPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 48 });
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(18).text("Order Transcript", { align: "left" });
      if (order?.orderId) doc.fontSize(12).text(`Order #${order.orderId}`);
      if (order?.userId) doc.fontSize(10).fillColor("#555").text(`User: ${order.userId}`);
      doc.moveDown();

      // Items table header
      doc.fillColor("#000").fontSize(12).text("Items:");
      doc.moveDown(0.5);
      const startX = doc.x;
      const colWidths = [220, 70, 100, 100];
      const headers = ["Product", "Qty", "Unit", "Total"];
      headers.forEach((h, idx) => {
        doc.font("Helvetica-Bold").text(h, startX + colWidths.slice(0, idx).reduce((a, b) => a + b, 0), doc.y, {
          width: colWidths[idx],
          continued: idx < headers.length - 1,
        });
      });
      doc.moveDown(0.2).font("Helvetica");
      doc.moveTo(48, doc.y).lineTo(548, doc.y).strokeColor("#e5e7eb").stroke();

      // Items rows
      const items = Array.isArray(order?.items) ? order.items : [];
      items.forEach((it: any) => {
        const name = it.productName || it.productId || "Product";
        const qty = Number(it.quantity || 0);
        const unit = Number(it.unitPrice ?? it.price ?? 0);
        const total = Number(it.lineTotal ?? unit * qty);
        const cols = [name, String(qty), formatCurrency(unit), formatCurrency(total)];
        cols.forEach((val, idx) => {
          doc.text(val, startX + colWidths.slice(0, idx).reduce((a, b) => a + b, 0), doc.y, {
            width: colWidths[idx],
            continued: idx < cols.length - 1,
          });
        });
      });

      doc.moveDown();
      doc.moveTo(48, doc.y).lineTo(548, doc.y).strokeColor("#e5e7eb").stroke();
      doc.moveDown(0.5);

      // Summary
      const subtotal = Number(order?.subtotal ?? 0);
      const discountAmount = Number(order?.discountAmount ?? 0);
      const shipping = Number(order?.shipping ?? 0);
      const tax = Number(order?.tax ?? 0);
      const total = Number(order?.total ?? order?.totalAmount ?? 0);

      const summary = [
        ["Subtotal", formatCurrency(subtotal)],
        ["Discount", formatCurrency(discountAmount)],
        ["Shipping", formatCurrency(shipping)],
        ["Tax", formatCurrency(tax)],
        ["Total", formatCurrency(total)],
      ];
      summary.forEach(([k, v]) => {
        doc.text(k, 300, doc.y, { width: 120, continued: true });
        doc.text(v, 420, doc.y, { width: 120, align: "right" });
      });

      doc.end();

      stream.on("finish", () => {
        try {
          const stat = fs.statSync(outPath);
          resolve(stat.size || 0);
        } catch {
          resolve(0);
        }
      });
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

export const generateForOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.userId || user?.id;
    if (!userId) return res.status(401).json({ message: "unauthorized" });
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ message: "orderId required" });

    const order = await Order.findByPk(orderId as any);
    if (!order) return res.status(404).json({ message: "order not found" });

    const orderUserId = (order as any).userId;
    const isAdmin = user?.role === "admin";
    if (!isAdmin && String(orderUserId) !== String(userId)) {
      return res.status(403).json({ message: "forbidden" });
    }

    // Build snapshot
    const snapshot: any = {
      orderId: (order as any).orderId,
      userId: (order as any).userId,
      items: (order as any).items || [],
      total: (order as any).total,
      totalAmount: (order as any).totalAmount,
      status: (order as any).status,
      createdAt: (order as any).createdAt,
    };

    const baseDir = path.resolve(process.cwd(), "uploads", "transcripts");
    ensureDir(baseDir);
    const fileName = `${(order as any).orderId}-${Date.now()}.pdf`;
    const filePath = path.join(baseDir, fileName);

    const size = await buildPdf(snapshot, filePath);

    const relPath = `/uploads/transcripts/${fileName}`;
    const record = await Transcript.create({
      orderId: (order as any).orderId,
      userId: String(orderUserId),
      data: snapshot,
      filePath: relPath,
      fileSize: size,
      mimeType: "application/pdf",
    } as any);

    return res.status(201).json({
      transcript: record,
      url: relPath,
    });
  } catch (err: any) {
    console.error("generateForOrder error", err);
    return res.status(500).json({ message: "failed", error: err?.message });
  }
};

export const getTranscript = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.userId || user?.id;
    if (!userId) return res.status(401).json({ message: "unauthorized" });
    const { id } = req.params as any;
    const t = await Transcript.findByPk(id);
    if (!t) return res.status(404).json({ message: "not found" });
    const isAdmin = user?.role === "admin";
    if (!isAdmin && String((t as any).userId) !== String(userId)) {
      return res.status(403).json({ message: "forbidden" });
    }
    return res.json({ transcript: t });
  } catch (err: any) {
    console.error("getTranscript error", err);
    return res.status(500).json({ message: "failed" });
  }
};

export const downloadTranscript = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?.userId || user?.id;
    if (!userId) return res.status(401).json({ message: "unauthorized" });
    const { id } = req.params as any;
    const t = await Transcript.findByPk(id);
    if (!t) return res.status(404).json({ message: "not found" });
    const isAdmin = user?.role === "admin";
    if (!isAdmin && String((t as any).userId) !== String(userId)) {
      return res.status(403).json({ message: "forbidden" });
    }
    // Serve file if exists
    const rel = (t as any).filePath as string;
    const full = path.resolve(process.cwd(), rel.startsWith("/") ? rel.slice(1) : rel);
    if (!fs.existsSync(full)) return res.status(404).json({ message: "file missing" });
    res.setHeader("Content-Type", (t as any).mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${path.basename(full)}"`);
    fs.createReadStream(full).pipe(res);
  } catch (err: any) {
    console.error("downloadTranscript error", err);
    return res.status(500).json({ message: "failed" });
  }
};

export default { generateForOrder, getTranscript, downloadTranscript };
