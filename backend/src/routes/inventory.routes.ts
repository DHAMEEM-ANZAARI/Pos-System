import { Router } from "express";
import { restock, adjustStock, getLedger } from "../controllers/inventoryController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.use(requireAuth, requireRole("manager", "admin"));

router.post("/restock", restock);
router.post("/adjust", adjustStock);
router.get("/ledger/:productId", getLedger);

export default router;
