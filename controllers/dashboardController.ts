import { Request, Response } from "express";
import User from "../database/models/userModel";
import Product from "../database/models/productModel";
import Order from "../database/models/orderModel";
import sequelize from "../database/connection";

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

    // Recent 5 orders with user info and product info
    const recentOrdersRaw = await Order.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      raw: true,
    });

    // enrich recent orders with user and product info
    const recentOrders = await Promise.all(
      recentOrdersRaw.map(async (o: any) => {
        const userObj = await User.findOne({ where: { userId: o.userId }, attributes: ["userId", "email", "phoneNumber"], raw: true });
        // items is expected to be array of { productId, quantity, price }
        const items = Array.isArray(o.items) ? o.items : [];
        const productInfos = await Promise.all(
          items.map(async (it: any) => {
            const p = await Product.findOne({ where: { productId: it.productId }, attributes: ["productId", "productName", "productPrice", "imageUrl"], raw: true });
            return { ...(p || {}), quantity: it.quantity, price: it.price };
          })
        );

        return {
          orderId: o.orderId,
          user: userObj,
          items: productInfos,
          totalAmount: o.totalAmount ?? o.total,
          status: o.status,
          createdAt: o.createdAt,
        };
      })
    );

    // Product sold analytics: breakdown from Orders (aggregate items)
    // We'll aggregate by iterating completed orders items and summarizing.
    const completedOrders = await Order.findAll({ where: { status: "completed" }, attributes: ["items"], raw: true });
    const productMap: Record<string, { productId: string; productName?: string; quantity: number; revenue: number }> = {};

    for (const ord of completedOrders) {
      const items = Array.isArray(ord.items) ? ord.items : [];
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
      const prods = await Product.findAll({ where: { productId: productIds }, attributes: ["productId", "productName"], raw: true });
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
