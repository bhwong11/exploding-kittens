import mongoose from 'mongoose'

const { Schema } = mongoose

const roomSchema = new Schema({
  // _id: { type: String, required: true },
  roomNumber: { type: String, required: true },
  users:[
    {type: Schema.Types.ObjectId, ref: 'User'}
  ]
},{ timestamps: true });

const Room = mongoose.model('Room', roomSchema);

export default Room