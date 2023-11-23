import mongoose from 'mongoose'

const { Schema } = mongoose

const userSchema = new Schema({
  // _id: { type: String, required: true },
  username: { type: String, required: true },
  wins: { type: Number, required: true, default:0 },
  rooms:[
    {type: Schema.Types.ObjectId, ref: 'Room'}
  ]
},{ timestamps: true });

const User = mongoose.model('User', userSchema);

export default User