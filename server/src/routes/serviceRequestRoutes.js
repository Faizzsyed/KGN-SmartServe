import { Router } from "express";
import { completeServiceRequest, createServiceRequest, getServiceRequests } from "../controllers/serviceRequestController.js";

const router = Router();
router.get("/", getServiceRequests);
router.post("/", createServiceRequest);
router.patch("/:id/complete", completeServiceRequest);

export default router;
