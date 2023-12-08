import bcrypt from 'bcrypt'
import User from '../models/User.js'
import { generateAccessToken } from '../helpers/index.js'

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

    const token = generateAccessToken(existingUser)

    return res
      .cookie('accessToken', token, { httpOnly: true })
      .json({username, rooms, wins, id, _id})
      .status(200)

  } catch (e) {
    res.json({ error: `error logging in ${e}`})
  }
}

export default {
  login
}