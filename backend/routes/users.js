import express from "express";
import userControllers from "../controllers/users.js";

const router = express.Router()

router.get('/', userControllers.all)
router.get('/rankings', userControllers.allWithRankings)
//need to authenicate these routes
router.get('/username/:username', userControllers.userByUsername)
router.post('/', userControllers.create)
router.patch('/username/:username', userControllers.updateByUsername)

export default router