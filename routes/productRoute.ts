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

const router = Route.Router();

router.post("/", upload.single("image"), createProduct);
router.get("/", getProducts);
router.get("/summaries", getProductSummaries);
router.get("/:id", getProductById);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
