import Room from "../models/Room.js";

const all = async (req,res)=>{
  try{
    const rooms = await Room.find();
    res.json(rooms).status(200)
  }catch(e){
    res.json({error:`error processing on /rooms get route ${e}`}).status(500)
  }
}

const create = async (req,res)=>{
  try{
    const roomsCount = await Room.countDocuments()
    const newRoom = new Room({roomNumber:roomsCount})
    await newRoom.save()
    res.json(newRoom).status(200)
  }catch(e){
    res.json({error:`error processing on /rooms post route ${e}`}).status(500)
  }
}

export default {
  all,
  create
}