import bcrypt from 'bcrypt'
import User from '../models/User.js'
import { generateToken } from '../helpers/index.js'

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
      .cookie('accessToken', generateToken(existingUser, 'access'), { httpOnly: true })
      .cookie('refreshToken', generateToken(existingUser, 'refresh'), { httpOnly: true })
      .json({username, rooms, wins, id, _id})
      .status(200)

  } catch (e) {
    res.json({ error: `error logging in ${e}`})
  }
}

const refresh = async (req, res) => {
  console.log('succesful refresh')
  console.log('access token:', req.accessToken ?? req.cookies['accessToken'])
  console.log('refresh token:', req.refreshToken ?? req.cookies['refreshToken'])
  console.log('user: ', req.user)
  const existingUser = await User.findOne({username: req.user.username})
  const { username, rooms, wins, id, _id } = existingUser
  return res
    .cookie('accessToken', req.accessToken ?? req.cookies['accessToken'], { httpOnly: true })
    .cookie('refreshToken', req.refreshToken ?? req.cookies['refreshToken'], { httpOnly: true })
    .json({username, rooms, wins, id, _id})
    .status(200)
}

export default {
  login,
  refresh
}