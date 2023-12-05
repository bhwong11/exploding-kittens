import bcrypt from 'bcrypt'
import User from '../models/User.js'

const login = async (req, res) => {
  try {
    const { username, password } = req.body

    const existingUser = await User.findOne({username})

    if (!existingUser) {
      return res.json({error: `no user with name ${username} exists in our system`})
    } 

    if (bcrypt.compare(existingUser.password, password)) {
      console.log(username, password)
      res.json({existingUser}).status(200)
    }

  } catch (e) {
    res.json({ error: `error logging in ${e}`})
  }
}

export default {
  login
}