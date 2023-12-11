import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export const generateRoutes = (routesPathMap,app)=>{
  Object.entries(routesPathMap).forEach(([routePath,routeView])=>{
    app.use(routePath,routeView)
  })
}

export const emitToPlayerRoom = (io,socket,event,emitData,customErrorMessage)=>{
  if(io || !socket || !event || !emitData){
    console.log('missing data io, socket, event, data',[!io, !socket, !event, !emitData])
  }
  const playerRoom = Array.from(socket.rooms)[1]
  if(!playerRoom){
    socket.emit('error',{
      message: customErrorMessage ?? 'no room found for player'
    })
  }
  io.to(playerRoom).emit(event,emitData)
}

export const generateToken = (user, type) => {
  const payload = {
    id: user.id,
    username: user.username
  }

  const secret = process.env.JWT_SECRET

  let options
  if (type === 'access') options = { expiresIn: 60 * 30 }
  if (type === 'refresh') options = { expiresIn: 60 * 60 * 24 }

  return jwt.sign(payload, secret, options)
}

export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET

  try {
    const decoded = jwt.verify(token, secret)
    return { success: true, data: decoded }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return res.sendStatus(401)

  const result = verifyToken(token)

  if (!result.success) return res.status(403).json({ error: result.error })

  req.user = result.data
  next()
}