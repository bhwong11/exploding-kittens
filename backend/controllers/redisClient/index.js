import { createClient } from 'redis';

//redis for caching
const redisClient = createClient()
await redisClient.connect()

export default redisClient