import { Router } from "express";
import { completePayment, createOrder, getOrderById, getOrders, updateOrderStatus } from "../controllers/orderController.js";

const router = Router();
router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment", completePayment);

export default router;
