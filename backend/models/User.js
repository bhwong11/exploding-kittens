import mongoose from 'mongoose'

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

const User = mongoose.model('User', userSchema);

export default User