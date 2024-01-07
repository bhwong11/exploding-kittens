import express from "express";
import userControllers from "../controllers/users.js";

const router = express.Router()

router.get('/', userControllers.all)
router.get('/rankings', userControllers.allWithRankings)
router.get('/:username', userControllers.userByUsername)
router.post('/', userControllers.create)
router.post('/username/:username', userControllers.updateByUsername)

export default router