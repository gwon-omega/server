import { Request, Response } from "express";
import User from "../database/models/userModel";
import Product from "../database/models/productModel";
import Order from "../database/models/orderModel";
import sequelize from "../database/connection";
import { Op } from "sequelize";

// Contract:
// - GET /admin returns an object with totals and arrays for analytics
// - Inputs: none (authenticated admin via middleware)
// - Outputs: { totalUsers, totalProducts, totalOrders, totalRevenue, topProducts, recentOrders, productSoldAnalytics }

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "admin") return res.status(403).json({ message: "forbidden" });

    // Total counts
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();

    // Total revenue: sum totalAmount of completed orders
    const revenueRow: any = await Order.findOne({
      attributes: [[sequelize.fn("SUM", sequelize.col("totalAmount")), "totalRevenue"]],
      where: { status: "completed" },
      raw: true,
    });
    const totalRevenue = parseFloat((revenueRow && revenueRow.totalRevenue) || 0);

    // Top 5 selling products by quantity sold (uses Product.soldQuantity when available)
    const topProducts = await Product.findAll({
      attributes: ["productId", "productName", "soldQuantity", "productPrice", "imageUrl"],
      order: [["soldQuantity", "DESC"]],
      limit: 5,
      raw: true,
    });

    // Recent 5 orders (raw) then batch enrich to avoid N+1 queries
    const recentOrdersRaw: any[] = await Order.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      raw: true,
    });

    // Collect all userIds & productIds from recent orders
    const recentUserIds = Array.from(new Set(recentOrdersRaw.map(o => o.userId).filter(Boolean)));
    const userLookup = recentUserIds.length
      ? (await User.findAll({ where: { userId: { [Op.in]: recentUserIds } }, attributes: ["userId", "email", "phoneNumber"], raw: true }))
          .reduce<Record<string, any>>((acc, u: any) => { acc[u.userId] = u; return acc; }, {})
      : {};

    // Parse & collect productIds from order items
    const collectProductIds: string[] = [];
    const normalizedRecentOrders = recentOrdersRaw.map(o => {
      let items: any[] = [];
      if (Array.isArray(o.items)) items = o.items;
      else if (typeof o.items === "string") {
        try { const parsed = JSON.parse(o.items); if (Array.isArray(parsed)) items = parsed; } catch { /* ignore */ }
      }
      for (const it of items) if (it && it.productId) collectProductIds.push(it.productId);
      return { ...o, items };
    });
    const uniqueProdIds = Array.from(new Set(collectProductIds));
    const productLookup = uniqueProdIds.length
      ? (await Product.findAll({ where: { productId: { [Op.in]: uniqueProdIds } }, attributes: ["productId", "productName", "productPrice", "imageUrl"], raw: true }))
          .reduce<Record<string, any>>((acc, p: any) => { acc[p.productId] = p; return acc; }, {})
      : {};

    const recentOrders = normalizedRecentOrders.map(o => ({
      orderId: o.orderId,
      user: userLookup[o.userId] || null,
      items: o.items.map((it: any) => ({ ...(productLookup[it.productId] || { productId: it.productId }), quantity: it.quantity, price: it.price })),
      totalAmount: o.totalAmount ?? o.total,
      status: o.status,
      createdAt: o.createdAt,
    }));

    // Product sold analytics: breakdown from Orders (aggregate items)
    // We'll aggregate by iterating completed orders items and summarizing.
  const completedOrders: any[] = await Order.findAll({ where: { status: "completed" }, attributes: ["items"], raw: true });
    const productMap: Record<string, { productId: string; productName?: string; quantity: number; revenue: number }> = {};

    for (const ord of completedOrders) {
  let items: any[] = [];
  if (Array.isArray(ord.items)) items = ord.items; else if (typeof ord.items === "string") { try { const parsed = JSON.parse(ord.items); if (Array.isArray(parsed)) items = parsed; } catch {/* ignore */} }
      for (const it of items) {
        const pid = it.productId;
        const qty = Number(it.quantity || 0);
        const price = Number(it.price || 0);
        if (!productMap[pid]) productMap[pid] = { productId: pid, productName: undefined, quantity: 0, revenue: 0 };
        productMap[pid].quantity += qty;
        productMap[pid].revenue += qty * price;
      }
    }

    // attach product names from DB
    const productIds = Object.keys(productMap);
    if (productIds.length > 0) {
      const prods = await Product.findAll({ where: { productId: { [Op.in]: productIds } }, attributes: ["productId", "productName"], raw: true });
      for (const p of prods) {
        if (productMap[p.productId]) productMap[p.productId].productName = p.productName;
      }
    }

    const productSoldAnalytics = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);

    return res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      topProducts,
      recentOrders,
      productSoldAnalytics,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
};

export const getDashboard = getAdminDashboard;

export default { getAdminDashboard, getDashboard };
