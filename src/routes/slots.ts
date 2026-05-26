import { Router } from "express";
import { getSlots } from "../controllers/slotsController";

const router = Router();

router.get("/", getSlots);

export default router;
