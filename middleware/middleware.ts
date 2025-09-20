// Bridge module: re-export from new modular middlewares to avoid breaking imports
export {
  securityChecker,
  isAuth,
  isAdmin,
  isVendor,
  verifyOwnership,
} from "../middlewares/auth";

export { securityHeaders, requestSizeLimit } from "../middlewares/security";

export { authRateLimit, generalRateLimit } from "../middlewares/rateLimit";

export { requestLogger } from "../middlewares/logging";

export {
  handleValidationErrors,
  validateUserId,
  validateProductId,
  validateOrderId,
  validatePagination,
  validateEmail,
  validatePassword,
} from "../middlewares/validation";

export { asyncHandler, formatErrorResponse } from "../middlewares/errorHandler";

import { securityChecker as defaultSecurityChecker } from "../middlewares/auth";
export default defaultSecurityChecker;
