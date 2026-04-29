import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "../utils/errors.js";

/** @param {string[]} requiredPermissions */
export function roleMiddleware(requiredPermissions) {
  return (req, res, next) => {
    const permissions = req.user?.permissions || [];
    const hasWildcard = permissions.includes("*");
    const allowed =
      hasWildcard ||
      requiredPermissions.some((permission) => permissions.includes(permission));
    if (!allowed) {
      return next(new AppError(ErrorCodes.FORBIDDEN, "Insufficient permissions", 403));
    }
    next();
  };
}
