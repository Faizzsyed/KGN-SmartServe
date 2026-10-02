import { Router } from "express";
import { getTables } from "../controllers/tableController.js";

const router = Router();
router.get("/", getTables);

export default router;
