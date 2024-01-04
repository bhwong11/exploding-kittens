import Room from "../models/Room.js";
import { rooms } from "../index.js";
import { io } from "../index.js"

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
    const rooms = await Room.find()
    console.log('new room made')
    io.emit('new-room', rooms)
    res.json(newRoom).status(200)
  }catch(e){
    res.json({error:`error processing on /rooms post route ${e}`}).status(500)
  }
}

const repopulateSavedRoom = async (req,res)=>{
  try{
    if(!rooms[req.params.id]?.gameState || !rooms[req.params.id]?.players){
      return res.json({error:'error, rooms not yet populated'}).status(400)
    }
    console.log('ROOM!',rooms[req.params.id])

    const existingRoom = await Room.findOne({roomNumber:req.params.id})

    const existingRoomObj = existingRoom._doc

    rooms[req.params.id].gameState = {
      deck:existingRoomObj.deck,
      discardPile:existingRoomObj.discardPile,
      turnCount:existingRoomObj.turnCount,
      attackTurns: existingRoomObj.attackTurns,
      //current action data
      currentActions:existingRoomObj.currentActions,
      noResponses:existingRoomObj.noResponses,
      allowedUsers:existingRoomObj.allowedUsers,
      //action prompt Data
      actionPromptFormObject:existingRoomObj.actionPromptFormObject,
      actionPromptIndex:existingRoomObj.actionPromptIndex,
    }

    const players = existingRoomObj.players.map(player=>({
      ...player.toObject(),
      active:rooms[req.params.id].players.find(p=>p.username===player.username)?.active ?? false
      })
    )

    rooms[req.params.id].players = players

    if(!existingRoom){
      return res.json({error:'error, room not found'}).status(400)
    }
    res.json(existingRoom).status(200)
  }catch(e){
    res.json({error:`error processing on /rooms get route ${e}`}).status(500)
  }
}

const saveGame = async (req,res)=>{
  try{
    if(!rooms[req.params.id]?.gameState || !rooms[req.params.id]?.players){
      return res.json({error:'error, rooms not yet populated'}).status(400)
    }

    const updatedRoom = await Room.findOneAndUpdate(
      {roomNumber:req.params.id},
      {
        ...rooms[req.params.id].gameState,
        players: rooms[req.params.id].players
      },
      {new:true}
    )

    if(!updatedRoom){
      return res.json({error:'error, room not found'}).status(400)
    }

    res.json({
      success:true,
      ...updatedRoom.toObject()
    }).status(200)

  }catch(e){
    res.json({error:`error processing on save game on route /:id/save-game ${e}`}).status(500)
  }
}

export default {
  all,
  create,
  repopulateSavedRoom,
  saveGame
}