import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import Product from "../database/models/productModel";
import Review from "../database/models/reviewModel";

const getFileUrl = (file: Express.Multer.File | undefined) => {
  if (!file) return undefined;
  const f: any = file as any;
  return (
    f.path ||
    f.secure_url ||
    f.url ||
    f.location ||
    f.filename ||
    undefined
  );
};

export const createProduct = async (req: Request, res: Response) => {
  try {
  const payload: any = { ...(req.body || {}) };
  const fileUrl = getFileUrl(req.file);
  if (fileUrl) payload.imageUrl = fileUrl; // align with model column
  const product = await Product.create(payload);
    return res.status(201).json({ message: "created", product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { q, categoryId, minPrice, maxPrice } = req.query as Record<string, string>;
    const where: any = {};
    if (q) {
      where.productName = { [Op.iLike]: `%${q}%` };
    }
    if (categoryId) where.categoryId = categoryId;
    if (minPrice) where.productPrice = { ...(where.productPrice || {}), [Op.gte]: Number(minPrice) };
    if (maxPrice) where.productPrice = { ...(where.productPrice || {}), [Op.lte]: Number(maxPrice) };

    const products = await Product.findAll({ where, order: [["createdAt", "DESC"]] });
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
  if (fileUrl) data.imageUrl = fileUrl; // align with model column
  const [, [updated]] = await Product.update(data, { where: { productId: req.params.id }, returning: true });
    if (!updated) return res.status(404).json({ message: "not found" });
    return res.json({ message: "updated", product: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
  const count = await Product.destroy({ where: { productId: req.params.id } });
    if (!count) return res.status(404).json({ message: "not found" });
    return res.json({ message: "deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Aggregated product summary (avg rating, review count) for enabled products only
export const getProductSummaries = async (req: Request, res: Response) => {
  try {
    // Use scalar subqueries to avoid complex GROUP BY issues across dialects
    const products = await Product.findAll({
      where: { status: 'enabled' },
      attributes: [
        'productId',
        'productName',
        'productPrice',
        'productDiscount',
        'description',
        'imageUrl',
        'createdAt',
        'updatedAt',
        'categoryId',
        [
          literal(`(
            SELECT COALESCE(AVG(r."rating"),0)
            FROM reviews r
            WHERE r."productId" = "Product"."productId" AND r."status" = 'published'
          )`),
          'avgRating'
        ],
        [
          literal(`(
            SELECT COUNT(*)
            FROM reviews r
            WHERE r."productId" = "Product"."productId" AND r."status" = 'published'
          )`),
          'reviewCount'
        ]
      ],
      order: [
        [literal(`(
          SELECT COALESCE(AVG(r."rating"),0)
          FROM reviews r
          WHERE r."productId" = "Product"."productId" AND r."status" = 'published'
        )`), 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
    return res.json({ products });
  } catch (error) {
    console.error('getProductSummaries error:', error);
    return res.status(500).json({ message: 'server error' });
  }
};

export default { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
