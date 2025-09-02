import { Request, Response } from "express";
import Cart from "../database/models/cartModel";
import Product from "../database/models/productModel";

const calculateTotal = (items: any[]) => items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);

export const getCart = async (req: Request, res: Response) => {
	try {
		const userId = req.params.userId || req.query.userId || req.body.userId;
		if (!userId) return res.status(400).json({ message: "userId required" });
		const cart = await Cart.findOne({ where: { userId } });
		if (!cart) return res.json({ items: [], total: 0 });
		return res.json(cart);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export const addItem = async (req: Request, res: Response) => {
	try {
		const { userId, productId, quantity = 1 } = req.body;
		if (!userId || !productId) return res.status(400).json({ message: "userId and productId required" });

		const product = await Product.findByPk(productId);
		if (!product) return res.status(404).json({ message: "product not found" });

		const price = (product as any).productPrice ?? (product as any).price ?? 0;

		let cart = await Cart.findOne({ where: { userId } });
		if (!cart) {
			cart = await Cart.create({ userId, items: [{ productId, quantity, price }], total: price * quantity });
			return res.status(201).json(cart);
		}

		const items = Array.isArray(cart.items) ? cart.items : [];
		const idx = items.findIndex((i: any) => String(i.productId) === String(productId));
		if (idx >= 0) {
			items[idx].quantity += quantity;
		} else {
			items.push({ productId, quantity, price });
		}

		cart.items = items;
		cart.total = calculateTotal(items);
		await cart.save();
		return res.json(cart);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export const updateItem = async (req: Request, res: Response) => {
	try {
		const { userId, productId, quantity } = req.body;
		if (!userId || !productId) return res.status(400).json({ message: "userId and productId required" });
		const cart = await Cart.findOne({ where: { userId } });
		if (!cart) return res.status(404).json({ message: "cart not found" });
		const items = Array.isArray(cart.items) ? cart.items : [];
		const idx = items.findIndex((i: any) => String(i.productId) === String(productId));
		if (idx === -1) return res.status(404).json({ message: "item not found" });
		if (quantity <= 0) {
			items.splice(idx, 1);
		} else {
			items[idx].quantity = quantity;
		}
		cart.items = items;
		cart.total = calculateTotal(items);
		await cart.save();
		return res.json(cart);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export const clearCart = async (req: Request, res: Response) => {
	try {
		const userId = req.params.userId || req.body.userId;
		if (!userId) return res.status(400).json({ message: "userId required" });
		const cart = await Cart.findOne({ where: { userId } });
		if (!cart) return res.status(404).json({ message: "not found" });
		cart.items = [];
		cart.total = 0;
		await cart.save();
		return res.json({ message: "cleared" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "server error" });
	}
};

export default { getCart, addItem, updateItem, clearCart };

