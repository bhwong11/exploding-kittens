import mongoose from 'mongoose'
import redisClient from '../redisClient/index.js';
import data from '../data/index.js';

const { Schema } = mongoose

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  wins: { type: Number, required: true, default:0 },
  rooms:[
    {type: Schema.Types.ObjectId, ref: 'Room'}
  ]
  //need to add game state data to save
  // also need to add pw 
},{ timestamps: true });

//middleware for before updates/save happens to bust cache
userSchema.pre('findOneAndUpdate', function(next) {
  if (this.getUpdate().wins || this.getUpdate().wins===0) {
    // clear cache when wins is updated
    redisClient.del(data.allUsersRankingCacheKey)
    redisClient.del(data.allUsersCacheKey)
  }
  next()
})

userSchema.pre('save', function(next) {
  if (this.isNew) {
    // clear cache when new user is created
    redisClient.del(data.allUsersCacheKey)
  }
  next()
})

const User = mongoose.model('User', userSchema);

export default User