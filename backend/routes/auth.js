import express from 'express'
import authControllers from '../controllers/auth.js'
import authenticateToken from '../helpers/index.js'

const router = express.Router()


router.post('/', authenticateToken, authControllers.login)

export default router