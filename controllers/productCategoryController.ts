import { Request, Response } from "express";
import ProductCategory from "../database/models/productCategoryModel"; // your category model
import Product from "../database/models/productModel";


// Create a new category
const getFileUrl = (file: Express.Multer.File | undefined) => {
  if (!file) return undefined;
  const f: any = file as any;
  return f.secure_url || f.path || f.location || f.url || f.filename || undefined;
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await ProductCategory.findOne({ where: { categoryName } });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const imageUrl = getFileUrl((req as any).file);
    const category = await ProductCategory.create({ categoryName, imageUrl });
    return res.status(201).json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await ProductCategory.findAll();
    return res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Optional: Get products by category
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const products = await Product.findAll({
      where: { categoryId },
    });

    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any;
    const { categoryName } = req.body || {};
    const category = await ProductCategory.findByPk(id);
    if (!category) return res.status(404).json({ message: "not found" });
    const patch: any = {};
    if (categoryName) patch.categoryName = categoryName;
    const imageUrl = getFileUrl((req as any).file);
    if (imageUrl) patch.imageUrl = imageUrl;
    await category.update(patch);
    return res.json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any;
    const count = await ProductCategory.destroy({ where: { categoryId: id } });
    if (!count) return res.status(404).json({ message: "not found" });
    return res.json({ message: "deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default { createCategory, getCategories, getProductsByCategory, updateCategory, deleteCategory };
