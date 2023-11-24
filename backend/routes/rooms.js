import express from "express";
import roomControllers from "../controllers/rooms.js";

const router = express.Router()

router.get('/', roomControllers.all)
router.post('/', roomControllers.create)

export default router