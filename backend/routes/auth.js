import express from 'express'
import authControllers from '../controllers/auth.js'
import { authenticateToken } from '../helpers/index.js'

const router = express.Router()


router.post('/', authControllers.login)
router.post('/refresh', authenticateToken, authControllers.refresh)

export default router