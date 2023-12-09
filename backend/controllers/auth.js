import bcrypt from 'bcrypt'
import User from '../models/User.js'
import { generateToken, verifyToken } from '../helpers/index.js'

const login = async (req, res) => {
  try {
    const _username = req.body.username
    const password = req.body.password

    const existingUser = await User.findOne({username: _username})

    if (!existingUser) {
      return res.json({error: `no user with name ${_username} exists in our system`})
    } 

    const passMatch = await bcrypt.compare(password, existingUser.password)
    
    if (!passMatch) {
      return res.json({error: 'incorrect password'})
    }
    
    const { username, rooms, wins, id, _id } = existingUser

    return res
      .header('Authorization', generateToken(existingUser, 'access'))
      .cookie('refreshToken', generateToken(existingUser, 'refresh'), { httpOnly: false })
      .json({username, rooms, wins, id, _id})
      .status(200)

  } catch (e) {
    res.json({ error: `error logging in ${e}`})
  }
}

const refresh = async (req, res) => {
  const refreshToken = req.cookies['refreshToken']
  if (!refreshToken) return res.status(401).send('Access Denied. No refresh token provided.')

  try {
    const verifiedUser = verifyToken(refreshToken)['data']
    
    return res
      .header('Authorization', generateToken(verifiedUser, 'access'))
      .send(verifiedUser) 

  } catch (e) {
    res.json({ error: `error refreshing token: ${e}`})
  }
}

export default {
  login,
  refresh
}