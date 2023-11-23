import mongoose from 'mongoose'

const { Schema } = mongoose

const roomSchema = new Schema({
  roomNumber: { type: String, required: true },
  users:[
    {type: Schema.Types.ObjectId, ref: 'User'}
  ]
  //need to add game state data to save
},{ timestamps: true });

const Room = mongoose.model('Room', roomSchema);

export default Room