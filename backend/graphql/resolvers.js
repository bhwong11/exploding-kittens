import User from "../models/User.js"
import { GraphQLError } from 'graphql';
import redisClient from "../redisClient/index.js";
import data from "../data/index.js";

export default {
  Query:{
    getUser: async (_,{username})=>{
      try{

        const user = await User.findOne({username})
        if(!user){
          throw new GraphQLError(`username not found ${username}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              argumentName: 'username',
            },
          })
        }
        return user

      }catch(err){

        throw new GraphQLError('Internal server error', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            argumentName: 'username',
          },
        })

      }
    },
    getUsersWithRanking: async ()=>{
      let results;
      let fromCache = false;
      let existingCache;
    
      try{
        if(redisClient.isReady){
          console.log('IS READY')
          existingCache = await redisClient.get(data.allUsersCacheKey)
        }

        console.log('EXISTING CACHE',existingCache)
        
        //return cached value if existing
        if(existingCache){
          results = JSON.parse(existingCache)
          fromCache = true
        }else{
          console.log('else!!')
          results = await User.find().populate('rooms')
          redisClient.set(data.allUsersCacheKey,JSON.stringify(results),{
            //expire cache in one week
            EX: data.oneWeekInMilliSec
          })
        }
    
        return {
          fromCache,
          results:[...results]
        }
    
      }catch(err){

        throw new GraphQLError(`something went wrong ${err}`, {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        })

      }
    }
  },
  Mutation: {
    updateUser: async (_,{
        username,
        updateUserInput
    }
  )=>{
      try{
        const updatedUser = await User.findOneAndUpdate(
          {username},
          {...updateUserInput},
          {new:true}
        )
    
        if(!updatedUser){
          throw new GraphQLError(`username not found ${username}`, {
            extensions: {
              code: 'BAD_USER_INPUT',
              argumentName: 'username',
            },
          })
        }
        return updatedUser

      }catch(e){

        throw new GraphQLError(`something went wrong ${err}`, {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        })

      }

    }
  }
}