import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/productCategoryController"; // reuse controller functions
import upload from "../middleware/multerUpload";
import { securityChecker, isAdmin } from "../middleware/middleware";

const router = express.Router();

// Create a new category
router.post("/", securityChecker, isAdmin, upload.single("image"), createCategory);

// Get all categories
router.get("/", getCategories);

// Update category
router.put("/:id", securityChecker, isAdmin, upload.single("image"), updateCategory);

// Delete category
router.delete("/:id", securityChecker, isAdmin, deleteCategory);

export default router;
