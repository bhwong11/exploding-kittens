import bcrypt from 'bcrypt'
import User from "../models/User.js";

const all = async (req,res)=>{
  try{
    const users = await User.find().populate('rooms');
    res.json(users).status(200)
  }catch(e){
    res.json({error:`error processing on /users get route ${e}`}).status(500)
  }
}

const userByUsername = async (req,res)=>{
  try{
    const user = User.find({username:req.params.username})
    if(!user){
      res.json(`error: no user with username: ${req.params.username} found`).status(400)
    }
    res.json(user).status(200)
  }catch(err){
    res.json({error:`error processing on /users/:id get route ${e}`}).status(500)
  }
}

const create = async (req,res)=>{
  try{
    const { username, password, email } = req.body

    const existingUser = await User.findOne({username})

    if(existingUser) {
      return res.json({error:`user with ${username} already exist`}).status(400)
    }

    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(password, salt)

    const newUser = new User({ username, email, password: hash })
    await newUser.save()
    res.json(newUser).status(200)
  }catch(e){
    res.json({error:`error processing on /user post route ${e}`}).status(500)
  }
}

export default {
  all,
  create,
  userByUsername
}