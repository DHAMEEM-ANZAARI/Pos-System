import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const requireRole = (...roles: Array<"cashier" | "manager" | "admin">) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Requires one of roles: ${roles.join(", ")}` });
    }
    next();
  };
};
