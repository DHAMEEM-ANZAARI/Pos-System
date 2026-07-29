import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  lowStockProducts,
} from "../controllers/productController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.use(requireAuth);

router.get("/", listProducts);
router.get("/low-stock", requireRole("manager", "admin"), lowStockProducts);
router.get("/:id", getProduct);
router.post("/", requireRole("manager", "admin"), createProduct);
router.put("/:id", requireRole("manager", "admin"), updateProduct);
router.delete("/:id", requireRole("manager", "admin"), deleteProduct);

export default router;
