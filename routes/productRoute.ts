import * as Route from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productController";
import { getProductSummaries } from "../controllers/productController";
import upload from "../middleware/multerUpload";
import { securityChecker, isAdmin } from "../middleware/middleware";

const router = Route.Router();

router.post("/", securityChecker, isAdmin, upload.single("image"), createProduct);
router.get("/", getProducts);
router.get("/summaries", getProductSummaries);
router.get("/:id", getProductById);
router.put("/:id", securityChecker, isAdmin, upload.single("image"), updateProduct);
router.delete("/:id", securityChecker, isAdmin, deleteProduct);

export default router;
