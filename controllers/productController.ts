import { Request, Response } from "express";
import Product from "../database/models/productModel";

const getFileUrl = (file: Express.Multer.File | undefined) => {
  if (!file) return undefined;
  const f: any = file as any;
  return f.path || f.secure_url || f.url || f.location || f.filename || undefined;
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const payload: any = { ...(req.body || {}) };
    const fileUrl = getFileUrl(req.file);
    if (fileUrl) payload.productImage = fileUrl;
    const product = await Product.create(payload);
    return res.status(201).json({ message: "created", product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll();
    return res.json({ products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "not found" });
    return res.json({ product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const data: any = { ...(req.body || {}) };
    const fileUrl = getFileUrl(req.file);
    if (fileUrl) data.productImage = fileUrl;
    const [, [updated]] = await Product.update(data, { where: { id: req.params.id }, returning: true });
    if (!updated) return res.status(404).json({ message: "not found" });
    return res.json({ message: "updated", product: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const count = await Product.destroy({ where: { id: req.params.id } });
    if (!count) return res.status(404).json({ message: "not found" });
    return res.json({ message: "deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
