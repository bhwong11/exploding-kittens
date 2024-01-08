import { createClient } from 'redis';

//redis for caching
const redisClient = createClient()
try{
  await redisClient.connect()
}catch(err){
  console.log('Redis Connection Error',err)
}

redisClient.on('error', err => {
  console.log('Redis Client Error', err)
})

export default redisClient