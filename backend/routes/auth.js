import express from 'express'
import authControllers from '../controllers/auth.js'

const router = express.Router()


router.post('/', authControllers.login)

export default router