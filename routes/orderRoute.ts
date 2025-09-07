import * as express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  downloadTranscript,
} from "../controllers/orderController";
import { securityChecker, isAdmin, isAuth } from "../middleware/middleware";

const router = express.Router();

// Place order (user)
router.post("/", securityChecker, isAuth, createOrder);

// View all orders (admin)
router.get("/", securityChecker, isAdmin, getOrders);

// View order by id (user or admin)
router.get("/:id", securityChecker, isAuth, getOrderById);

// Update order (admin)
router.put("/:id", securityChecker, isAdmin, updateOrder);

// Delete order (admin)
router.delete("/:id", securityChecker, isAdmin, deleteOrder);

// Download transcript (admin)
router.get("/:id/transcript", securityChecker, isAdmin, downloadTranscript);

export default router;
