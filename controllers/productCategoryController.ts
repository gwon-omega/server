import { Request, Response } from "express";
import ProductCategory from "../database/models/productCategoryModel"; // your category model
import Product from "../database/models/productModel";


// Create a new category
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

    const category = await ProductCategory.create({ categoryName });
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

export default { createCategory, getCategories, getProductsByCategory };
