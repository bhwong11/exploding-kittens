import bcrypt from 'bcrypt'
import User from "../models/User.js";
import { createClient } from 'redis';

//redis for caching
const client = createClient()
await client.connect()

client.on('error', err => console.log('Redis Client Error', err))

const all = async (req,res)=>{
  try{
    const users = await User.find().populate('rooms')
    res.status(200).json(users)
  }catch(e){
    res.status(500).json({error:`error processing on /users get route ${e}`})
  }
}

const allWithRankings = async (req,res)=>{
  try{
    const existingCache = await client.get('user:rankings')

    console.log('exisit cahce',existingCache)
    const users = await User.find().sort({'wins': -1})
    const usersWithRank = users.map((user,idx)=>({
      ...user.toObject(),
      ranking:idx+1
    }))
    //client.set('user:rankings',users)
    console.log('users',usersWithRank)
    res.status(200).json(usersWithRank)
  }catch(e){
    res.status(500).json({error:`error processing on /users get route ${e}`})
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

const updateByUsername = async (req,res)=>{
  try{
    const updatedUser = await User.findOneAndUpdate(
      {username:req.params.username},
      {...req.body},
      {new:true}
    )

    if(!updatedUser){
      return res.json({error:'error, user not found'}).status(400)
    }
    res.json(updatedUser).status(200)
  }catch(e){
    res.json({error:`error processing on /user patch route ${e}`}).status(500)
  }
}

export default {
  all,
  create,
  userByUsername,
  updateByUsername,
  allWithRankings
}