import bcrypt from 'bcrypt'
import User from "../models/User.js";
import redisClient from '../redisClient/index.js';
import data from '../data/index.js';

const all = async (req,res)=>{
  let results;
  let fromCache = false;
  let existingCache;

  try{
    if(redisClient.isReady){
      existingCache = await redisClient.get(data.allUsersCacheKey)
    }
    
    //return cached value if existing
    if(existingCache){
      results = JSON.parse(existingCache)
      fromCache = true
    }else{
      results = await User.find().populate('rooms')
      redisClient.set(data.allUsersCacheKey,JSON.stringify(results),{
        //expire cache in one week
        EX: data.oneWeekInMilliSec
      })
    }

    res.status(200).json({
      fromCache,results:[...results]
    })

  }catch(e){
    res.status(500).json({error:`error processing on /users get route ${e}`})
  }
}

const allWithRankings = async (req,res)=>{
  console.log('redis client',redisClient.isReady)
  let results;
  let fromCache = false;
  let existingCache;

  try{
    if(redisClient.isReady){
      existingCache = await redisClient.get(data.allUsersRankingCacheKey)
    }

    if(existingCache){
      results = JSON.parse(existingCache)
      fromCache = true
    }else{
      const users = await User.find().sort({'wins': -1})

      results = users.map((user,idx)=>({
        ...user.toObject(),
        ranking:idx+1
      }))
      redisClient.set(data.allUsersRankingCacheKey,JSON.stringify(results),{
        //expire cache in one week
        EX: data.oneWeekInMilliSec
      })
    }


    res.status(200).json({
      fromCache,results:[...results],
    })

  }catch(e){
    res.status(500).json({error:`error processing on /users get route ${e}`})
  }
}

const userByUsername = async (req,res)=>{
  try{
    const user = User.findOne({username:req.params.username})
    if(!user){
      res.status(400).json(`error: no user with username: ${req.params.username} found`)
    }
    res.status(200).json(user)
  }catch(err){
    res.status(500).json({error:`error processing on /users/:id get route ${e}`})
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
      return res.status(400).json({error:'error, user not found'})
    }
    res.status(200).json(updatedUser)
  }catch(e){
    res.status(500).json({error:`error processing on /user patch route ${e}`})
  }
}

export default {
  all,
  create,
  userByUsername,
  updateByUsername,
  allWithRankings
}