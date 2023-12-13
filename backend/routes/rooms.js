import express from "express";
import roomControllers from "../controllers/rooms.js";
import { authenticate } from '../helpers/index.js'

const router = express.Router()

router.get('/', roomControllers.all)
router.post('/', authenticate, roomControllers.create)

export default router