import bcrypt from 'bcrypt'
import User from '../models/User.js'

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
    return res.json({username, rooms, wins, id, _id}).status(200)
    // need to set up error handling from back -> frontend
  } catch (e) {
    res.json({ error: `error logging in ${e}`})
  }
}

export default {
  login
}