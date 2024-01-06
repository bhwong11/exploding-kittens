import express from "express";
import userControllers from "../controllers/users.js";

const router = express.Router()

router.get('/', userControllers.all)
router.get('/:username', userControllers.userByUsername)
router.post('/', userControllers.create)

export default router