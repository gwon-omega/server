import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      message: "Invalid input data provided",
      details: errors.array().map((error) => ({
        field: error.type === "field" ? error.path : "unknown",
        message: error.msg,
        value: error.type === "field" ? error.value : undefined,
      })),
      statusCode: 400,
    });
  }
  next();
};

export const validateUserId = [param("userId").isUUID().withMessage("User ID must be a valid UUID"), handleValidationErrors];
export const validateProductId = [param("id").isUUID().withMessage("Product ID must be a valid UUID"), handleValidationErrors];
export const validateOrderId = [param("id").isUUID().withMessage("Order ID must be a valid UUID"), handleValidationErrors];
export const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];
export const validateEmail = [body("email").isEmail().normalizeEmail().withMessage("Must be a valid email address"), handleValidationErrors];

// Fixed password regex: fully anchors pattern to entire string
export const validatePassword = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  handleValidationErrors,
];

// Selective sanitizers for text/search fields only
export const sanitizeSearch = [query("q").optional().trim().escape()];
export const sanitizeTextBody = (fields: string[]) => fields.map((f) => body(f).optional().trim().escape());

export default {
  handleValidationErrors,
  validateUserId,
  validateProductId,
  validateOrderId,
  validatePagination,
  validateEmail,
  validatePassword,
  sanitizeSearch,
  sanitizeTextBody,
};
