import { Router } from "express";
import { checkout, listOrders, getOrder, refundOrder } from "../controllers/orderController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();

router.use(requireAuth);

router.post("/checkout", checkout);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/:id/refund", requireRole("manager", "admin"), refundOrder);

export default router;
