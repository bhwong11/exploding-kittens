import express from 'express'
import authControllers from '../controllers/auth.js'
import { authenticate } from '../helpers/index.js'

const router = express.Router()


router.post('/', authControllers.login)
router.post('/refresh', authenticate, authControllers.refresh)

export default router