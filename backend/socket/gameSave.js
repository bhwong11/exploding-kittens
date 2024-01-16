import { emitToPlayerRoom } from "../helpers/index.js"
import Room from "../models/Room.js"

export const gameSaveActions = (io,socket,rooms)=>{
  socket.on('refresh-game-state',()=>{
    const playerRoom = Array.from(socket.rooms)[1]
    console.log('refresh-game-state',rooms[playerRoom]?.gameState)

    if(rooms[playerRoom]){
      if(!rooms[playerRoom]?.gameState ){
        rooms[playerRoom].gameState = {
          deck:[],
          discardPile:[],
          turnCount:0,
          attackTurns:0,
          //current action data
          currentActions:[],
          noResponses:[],
          allowedUsers:[],
          //action prompt Data
          actionPromptFormObject:null,
          actionPromptIndex:0,
        }
      }
      emitToPlayerRoom(io,socket,'refresh-game-state', rooms[playerRoom]?.gameState)
    }
  })

  socket.on('save-room',async ()=>{
    console.log('save-room')
    const playerRoom = Array.from(socket.rooms)[1]
    if(!rooms[playerRoom]?.gameState || !rooms[playerRoom]?.players){
      emitToPlayerRoom(io,socket,'get-saved-room', {
        success: false,
        message:`room not populated yet`
      })
      return
    }

    try{
      const updatedRoom = await Room.findOneAndUpdate(
        {roomNumber:playerRoom},
        {
          ...rooms[playerRoom].gameState,
          players: rooms[playerRoom].players
        },
        {new:true}
      )
      
      if(!updatedRoom){
        emitToPlayerRoom(io,socket,'save-room', {
          success: false,
          message:`room for socket not found ${playerRoom}`
        })
        return
      }

      emitToPlayerRoom(io,socket,'save-room', {
        success: true,
        ...updatedRoom.toObject()
      })

    }catch(err){
      emitToPlayerRoom(io,socket,'save-room', {
        success: false,
        message:err
      })
    }
  })

  socket.on('get-saved-room',async ()=>{
    console.log('get-saved-room')
    const playerRoom = Array.from(socket.rooms)[1]
    if(!rooms[playerRoom]?.gameState || !rooms[playerRoom]?.players){
      emitToPlayerRoom(io,socket,'get-saved-room', {
        success: false,
        message:`room not populated yet`
      })
      return
    }

    try{
      const existingRoom = await Room.findOne(
        {roomNumber:playerRoom}
      )

      if(!existingRoom){
        emitToPlayerRoom(io,socket,'get-saved-room', {
          success: false,
          message:`room for socket not found ${playerRoom}`
        })
        return
      }

      const existingRoomObj = existingRoom._doc

      rooms[playerRoom].gameState = {
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
        active:rooms[playerRoom].players.find(p=>p.username===player.username)?.active ?? false
        })
      )

      rooms[playerRoom].players = players

      emitToPlayerRoom(io,socket,'refresh-game-state', rooms[playerRoom].gameState)
      emitToPlayerRoom(io,socket,'all-players', players)

    }catch(err){
      emitToPlayerRoom(io,socket,'get-saved-room', {
        success: false,
        message:`an error occured on get-saved-room action${err}`
      })
    }
  })
}