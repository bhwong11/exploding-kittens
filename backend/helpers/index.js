import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export const generateRoutes = (routesPathMap,app)=>{
  Object.entries(routesPathMap).forEach(([routePath,routeView])=>{
    app.use(routePath,routeView)
  })
}

export const emitToPlayerRoom = (io,socket,event,emitData,customErrorMessage)=>{
  if(!io || !socket || !event || !emitData){
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

export const authenticate = (req, res, next) => {
  const accessToken = req.cookies?.['accessToken']
  const accessResult = verifyToken(accessToken)
  try {
    if (!accessToken || !accessResult.success) {
      console.log('no valid access token')
      const refreshToken = req.cookies?.['refreshToken']
      const refreshResult = verifyToken(refreshToken)
      if (!refreshToken || !refreshResult.success) {
        console.log('no valid refresh token')
        return res.send({ error: 'invalid Refresh Token. Return to Login'})
      } 
      const { username, id } = req.body
      console.log('assigning new access token')
      req.cookies['accessToken'] = generateToken({ username, id }, 'access')
      console.log('assigning new refresh token')
      req.cookies['refreshToken'] = generateToken({ username, id }, 'refresh')
      return next()
    }
    console.log('success, valid access token')
    next()
  } catch (e) {
    return console.error(e)
  }
}