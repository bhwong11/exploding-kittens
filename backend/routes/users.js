import express from "express";
import userControllers from "../controllers/users.js";

const router = express.Router()

router.get('/', userControllers.all)
router.get('/rankings/:username', userControllers.userWithRankingByUsername)
router.post('/', userControllers.create)

export default router