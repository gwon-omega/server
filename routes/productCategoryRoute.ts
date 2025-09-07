import express from "express";
import {
  createCategory,
  getCategories,
} from "../controllers/productCategoryController"; // reuse controller functions

const router = express.Router();

// Create a new category
router.post("/", createCategory);

// Get all categories
router.get("/", getCategories);

export default router;
