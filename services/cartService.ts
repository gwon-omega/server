/**
 * CART SERVICE - Hybrid Optimistic/Background Processing
 *
 * This service provides optimistic cart operations with background database updates.
 * It handles both immediate responses for small carts and async processing for high-load scenarios.
 */

import { Op } from "sequelize";
import Cart from "../database/models/cartModel";
import CartItem from "../database/models/cartItemModel";
import Product from "../database/models/productModel";
import { jobQueue } from "../events/jobQueue";
import { eventBus } from "../events/eventBus";

// ------------------------------
// INTERFACES & TYPES
// ------------------------------

export interface CartResponse {
  cartId: string | null;
  userId: string;
  items: CartItemResponse[];
  subtotal: number;
  taxRate: number;
  tax: number;
  shipping: number;
  discount: DiscountResponse | null;
  discountAmount: number;
  total: number;
  optimistic?: boolean;
  mutationId?: string;
}

export interface CartItemResponse {
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
}

export interface DiscountResponse {
  type: 'percent' | 'fixed';
  value: number;
  code: string;
}

export interface CartOperation {
  type: 'add' | 'update' | 'remove' | 'clear' | 'sync';
  userId: string;
  productId?: string;
  quantity?: number;
  items?: Array<{ productId: string; quantity: number }>;
  mutationId?: string;
}

// ------------------------------
// HELPER FUNCTIONS
// ------------------------------

/**
 * Safely extract values from Sequelize models or plain objects
 */
export const getVal = (obj: any, key: string) =>
  (obj && typeof obj.get === "function") ? obj.get(key) : obj?.[key];

/**
 * Compute discounted price for a product
 */
export const computeItemPrice = (product: any): number => {
  const base = Number(getVal(product, "productPrice")) || 0;
  let discount = Number(getVal(product, "productDiscount")) || 0;
  discount = Math.min(Math.max(discount, 0), 100);
  const price = base - (base * discount) / 100;
  return isNaN(price) ? 0 : parseFloat(price.toFixed(2));
};

/**
 * Calculate comprehensive cart totals
 */
export const calculateCartTotals = (items: any[], cart: any = {}) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = typeof cart.taxRate === "number" ? cart.taxRate : 0.13;
  const shipping = typeof cart.shipping === "number" ? cart.shipping : 0;

  let discountAmount = 0;
  const applied = cart.appliedDiscount;
  if (applied) {
    if (applied.type === "percent") {
      discountAmount = (subtotal * applied.value) / 100;
    } else {
      discountAmount = applied.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = parseFloat((taxableAmount * taxRate).toFixed(2));
  const total = parseFloat((taxableAmount + tax + shipping).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxRate,
    tax,
    shipping,
    discount: applied ? {
      type: applied.type,
      value: applied.value,
      code: applied.code
    } : null,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    total,
  };
};

/**
 * Format cart data for API response
 */
export const formatCartResponse = (
  cart: any,
  items: any[],
  optimistic = false,
  mutationId?: string
): CartResponse => {
  const cartItems = items.map((item: any) => ({
    productId: String(item.productId),
    quantity: Number(item.quantity),
    price: Number(item.price),
    productName: item.product ? getVal(item.product, 'productName') : undefined
  }));

  const totals = calculateCartTotals(cartItems, cart);

  return {
    cartId: cart?.cartId || null,
    userId: cart?.userId || '',
    items: cartItems,
    ...totals,
    optimistic,
    mutationId
  };
};

// ------------------------------
// CART SERVICE CLASS
// ------------------------------

export class CartService {
  private static readonly SYNC_THRESHOLD = 5; // Process synchronously if cart has <= 5 items
  private static readonly OPTIMISTIC_DELAY = 100; // ms to delay before background job

  /**
   * Get cart with full item details
   */
  static async getCart(userId: string): Promise<CartResponse> {
    try {
      const cart = await Cart.findOne({
        where: { userId },
        include: [{
          model: CartItem,
          as: "items",
          include: [{
            model: Product,
            as: "product",
            attributes: ["productId", "productName", "productPrice", "productDiscount"]
          }]
        }]
      });

      if (!cart) {
        return {
          cartId: null,
          userId,
          items: [],
          subtotal: 0,
          taxRate: 0.13,
          tax: 0,
          shipping: 0,
          discount: null,
          discountAmount: 0,
          total: 0,
        };
      }

      return formatCartResponse(cart, cart.items || []);
    } catch (error) {
      console.error("CartService.getCart error:", error);
      throw error;
    }
  }

  /**
   * Add item with hybrid processing
   */
  static async addItem(
    userId: string,
    productId: string,
    quantity: number = 1,
    optimistic: boolean = true
  ): Promise<CartResponse> {
    try {
      quantity = Math.max(1, Math.min(99, quantity));
      const mutationId = `add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (optimistic) {
        // Optimistic response - calculate approximate totals quickly
        const optimisticResponse = await this.generateOptimisticResponse(
          userId,
          'add',
          { productId, quantity },
          mutationId
        );

        // Enqueue background job for actual DB update
        setTimeout(() => {
          jobQueue.enqueue('cart:add', { userId, productId, quantity }, userId);
        }, this.OPTIMISTIC_DELAY);

        return optimisticResponse;
      } else {
        // Synchronous processing
        return await this.addItemSync(userId, productId, quantity);
      }
    } catch (error) {
      console.error("CartService.addItem error:", error);
      throw error;
    }
  }

  /**
   * Update item with hybrid processing
   */
  static async updateItem(
    userId: string,
    productId: string,
    quantity: number,
    optimistic: boolean = true
  ): Promise<CartResponse> {
    try {
      const mutationId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (optimistic) {
        const optimisticResponse = await this.generateOptimisticResponse(
          userId,
          'update',
          { productId, quantity },
          mutationId
        );

        setTimeout(() => {
          jobQueue.enqueue('cart:update', { userId, productId, quantity }, userId);
        }, this.OPTIMISTIC_DELAY);

        return optimisticResponse;
      } else {
        return await this.updateItemSync(userId, productId, quantity);
      }
    } catch (error) {
      console.error("CartService.updateItem error:", error);
      throw error;
    }
  }

  /**
   * Remove item with hybrid processing
   */
  static async removeItem(
    userId: string,
    productId: string,
    optimistic: boolean = true
  ): Promise<CartResponse> {
    try {
      const mutationId = `remove_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (optimistic) {
        const optimisticResponse = await this.generateOptimisticResponse(
          userId,
          'remove',
          { productId },
          mutationId
        );

        setTimeout(() => {
          jobQueue.enqueue('cart:remove', { userId, productId }, userId);
        }, this.OPTIMISTIC_DELAY);

        return optimisticResponse;
      } else {
        return await this.removeItemSync(userId, productId);
      }
    } catch (error) {
      console.error("CartService.removeItem error:", error);
      throw error;
    }
  }

  /**
   * Sync cart with hybrid processing
   */
  static async syncCart(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    optimistic: boolean = true
  ): Promise<CartResponse> {
    try {
      const mutationId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (optimistic) {
        // For sync, we'll still do optimistic but with immediate DB update due to complexity
        // The optimistic part is just returning the calculated state quickly
        return await this.syncCartSync(userId, items);
      } else {
        return await this.syncCartSync(userId, items);
      }
    } catch (error) {
      console.error("CartService.syncCart error:", error);
      throw error;
    }
  }

  /**
   * Clear cart with hybrid processing
   */
  static async clearCart(userId: string, optimistic: boolean = true): Promise<CartResponse> {
    try {
      const mutationId = `clear_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (optimistic) {
        const cart = await Cart.findOne({ where: { userId } });
        const response: CartResponse = {
          cartId: cart?.cartId || null,
          userId,
          items: [],
          subtotal: 0,
          taxRate: cart?.taxRate ?? 0.13,
          tax: 0,
          shipping: cart?.shipping ?? 0,
          discount: null,
          discountAmount: 0,
          total: 0,
          optimistic: true,
          mutationId
        };

        setTimeout(() => {
          jobQueue.enqueue('cart:clear', { userId }, userId);
        }, this.OPTIMISTIC_DELAY);

        return response;
      } else {
        return await this.clearCartSync(userId);
      }
    } catch (error) {
      console.error("CartService.clearCart error:", error);
      throw error;
    }
  }

  /**
   * Generate optimistic response based on current cart state + operation
   */
  private static async generateOptimisticResponse(
    userId: string,
    operation: string,
    params: any,
    mutationId: string
  ): Promise<CartResponse> {
    try {
      // Get current cart state quickly (minimal includes)
      const cart = await Cart.findOne({
        where: { userId },
        include: [{
          model: CartItem,
          as: "items",
          attributes: ['productId', 'quantity', 'price']
        }]
      });

      let items = cart?.items ? [...cart.items] : [];

      // Apply optimistic changes
      switch (operation) {
        case 'add':
          await this.applyOptimisticAdd(items, params);
          break;
        case 'update':
          this.applyOptimisticUpdate(items, params);
          break;
        case 'remove':
          this.applyOptimisticRemove(items, params);
          break;
      }

      return formatCartResponse(cart || { userId }, items, true, mutationId);
    } catch (error) {
      console.error("generateOptimisticResponse error:", error);
      // Fallback to current state
      return await this.getCart(userId);
    }
  }

  /**
   * Apply optimistic add operation
   */
  private static async applyOptimisticAdd(items: any[], params: any) {
    const { productId, quantity } = params;

    // Quick product price lookup
    const product = await Product.findByPk(productId, {
      attributes: ['productPrice', 'productDiscount']
    });

    if (!product) return;

    const price = computeItemPrice(product);
    const existingIndex = items.findIndex(item => String(item.productId) === String(productId));

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
      items[existingIndex].price = price;
    } else {
      items.push({ productId, quantity, price });
    }
  }

  /**
   * Apply optimistic update operation
   */
  private static applyOptimisticUpdate(items: any[], params: any) {
    const { productId, quantity } = params;
    const index = items.findIndex(item => String(item.productId) === String(productId));

    if (index >= 0) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }
    }
  }

  /**
   * Apply optimistic remove operation
   */
  private static applyOptimisticRemove(items: any[], params: any) {
    const { productId } = params;
    const index = items.findIndex(item => String(item.productId) === String(productId));
    if (index >= 0) {
      items.splice(index, 1);
    }
  }

  // ------------------------------
  // SYNCHRONOUS OPERATIONS
  // ------------------------------

  private static async addItemSync(userId: string, productId: string, quantity: number): Promise<CartResponse> {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error("Product not found");

    const price = computeItemPrice(product);

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    let cartItem = await CartItem.findOne({
      where: { cartId: cart.cartId, productId }
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.price = price;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart.cartId,
        productId,
        quantity,
        price,
      });
    }

    return await this.getCart(userId);
  }

  private static async updateItemSync(userId: string, productId: string, quantity: number): Promise<CartResponse> {
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) throw new Error("Cart not found");

    const cartItem = await CartItem.findOne({
      where: { cartId: cart.cartId, productId }
    });

    if (!cartItem) throw new Error("Item not found in cart");

    if (quantity <= 0) {
      await cartItem.destroy();
    } else {
      const product = await Product.findByPk(productId);
      if (!product) throw new Error("Product not found");

      cartItem.quantity = Math.min(quantity, 99);
      cartItem.price = computeItemPrice(product);
      await cartItem.save();
    }

    return await this.getCart(userId);
  }

  private static async removeItemSync(userId: string, productId: string): Promise<CartResponse> {
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) throw new Error("Cart not found");

    await CartItem.destroy({
      where: { cartId: cart.cartId, productId }
    });

    return await this.getCart(userId);
  }

  private static async clearCartSync(userId: string): Promise<CartResponse> {
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) throw new Error("Cart not found");

    await CartItem.destroy({ where: { cartId: cart.cartId } });
    cart.appliedDiscount = null;
    await cart.save();

    return await this.getCart(userId);
  }

  private static async syncCartSync(userId: string, items: Array<{ productId: string; quantity: number }>): Promise<CartResponse> {
    // Filter and normalize incoming items
    const normalized = items
      .filter((it: any) => it && it.productId && Number(it.quantity) > 0)
      .map((it: any) => ({
        productId: String(it.productId),
        quantity: Math.min(99, Math.max(1, parseInt(String(it.quantity), 10) || 1))
      }));

    // Dedupe by productId keeping last occurrence
    const map = new Map<string, { productId: string; quantity: number }>();
    for (const it of normalized) map.set(it.productId, it);
    const unique = Array.from(map.values());

    // Find or create cart
    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Clear existing items
    await CartItem.destroy({ where: { cartId: cart.cartId } });

    if (unique.length === 0) {
      return await this.getCart(userId);
    }

    // Load products to compute prices
    const productIds = unique.map(u => u.productId);
    const products = await Product.findAll({
      where: { productId: { [Op.in]: productIds } }
    });

    const productMap = new Map(products.map((p: any) => [String(getVal(p, 'productId')), p]));

    // Create new cart items
    const cartItemsData = unique
      .map(u => {
        const product = productMap.get(u.productId);
        if (!product) {
          console.warn('Product not found during sync, skipping:', u.productId);
          return null;
        }
        return {
          cartId: cart.cartId,
          productId: u.productId,
          quantity: u.quantity,
          price: computeItemPrice(product)
        };
      })
      .filter(Boolean) as any[];

    if (cartItemsData.length > 0) {
      await CartItem.bulkCreate(cartItemsData);
    }

    return await this.getCart(userId);
  }
}

export default CartService;
