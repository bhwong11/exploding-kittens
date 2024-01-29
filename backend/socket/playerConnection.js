import { emitToPlayerRoom } from "../helpers/index.js"

const roomMax = 4
//set for 10 min
const disconnectTimeout = 1000 * 60 * 10
const timeoutIds = {}

export const playerConnectionEventActions = (io,socket,rooms)=>{
  socket.on('disconnecting', () => {
    const playerRoomNumber = Array.from(socket.rooms)[1]

    if(rooms[playerRoomNumber]){
      rooms[playerRoomNumber].players = rooms[playerRoomNumber]?.players?.map(
        player=>player.socketId===socket.id?{
          ...player,
          active:false
        }:player
      )

      const playerDisconncted = rooms[playerRoomNumber]?.players?.find(
        player=>player.socketId===socket.id
      )
      if(playerDisconncted){
        timeoutIds[playerDisconncted.username] = setTimeout((allRooms)=>{
          console.log('timeout hit')
          allRooms[playerRoomNumber].players = allRooms[playerRoomNumber]?.players?.filter(
            player=>player.socketId!==socket.id
          )
          io.sockets.emit('all-players',allRooms[playerRoomNumber].players ?? [])
        },disconnectTimeout,rooms)
      }
      console.log('a player disconnected',socket.id,rooms[playerRoomNumber]);
      io.sockets.emit('all-players',rooms[playerRoomNumber].players ?? [])
    }
  })

  socket.on('leave-room', () => {
    const playerRoomNumber = Array.from(socket.rooms)[1]
    socket.leave(playerRoomNumber)

    if(rooms[playerRoomNumber]?.players){
      const playerLeaving = rooms[playerRoomNumber]?.players?.find(
        player=>player.socketId===socket.id
      )
      if(playerLeaving){
        clearTimeout(timeoutIds[playerLeaving.username])
      }

      rooms[playerRoomNumber].players = rooms[playerRoomNumber].players.filter(player=>player.socketId!==socket.id)

      io.sockets.emit('all-players',rooms[playerRoomNumber].players ?? [])
    }
  })

  socket.on('new-player',(data)=>{
    console.log('new-player',data,JSON.stringify(rooms))
    if(!data.room || !data.username){
      socket.emit('error',{
        message:'username or room was not included'
      })
      console.log('username or room was not included')
      return
    }

    //if user is already in a room, they leave that room and join a new one
    //only one room per user at a time
    const playerRoomNumber = Array.from(socket.rooms)[1]
    if(playerRoomNumber || playerRoomNumber===0){
      socket.leave(playerRoomNumber)
      if(rooms[playerRoomNumber]?.players){
        rooms[playerRoomNumber].players = rooms[playerRoomNumber].players.filter(player=>player.socketId!==socket.id)
      }
    }

    socket.join(data.room)
    if(!rooms[data.room]){
      rooms[data.room] = {
        players:[],
        gameState:{
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
    }

    const existingPlayerIndex = rooms[data.room]?.players?.findIndex(player=>player.username===data?.username)

    if(
      existingPlayerIndex!==-1 
      && typeof existingPlayerIndex === 'number'
    ){
      if(!!rooms[data.room]?.players[existingPlayerIndex]?.active){
        socket.emit('error',{
          message:'player already exist and is active'
        })
        console.log('player already exist in room and is active')
        return
      }
      //if rejoining a room
      rooms[data.room].players[existingPlayerIndex].active = true
      rooms[data.room].players[existingPlayerIndex].socketId = socket.id
      clearTimeout(timeoutIds[rooms[data.room].players[existingPlayerIndex].username])
      emitToPlayerRoom(io,socket,'all-players',rooms[data.room]?.players ?? [])
      emitToPlayerRoom(io,socket,'deck',rooms[data.room]?.gameState?.deck ?? [])
      emitToPlayerRoom(io,socket,'discard-pile',rooms[data.room]?.gameState?.discardPile ?? [])
      return
    }

    if((rooms[data.room]?.players?.length>=roomMax)){
      socket.emit('error',{
        message:'room is already full'
      })
      console.log('room is already full')
      return
    }

    rooms[data.room]?.players.push({
      ...data,
      active:true,
      socketId: socket.id,
      lose:false,
      cards:[]
    })
    emitToPlayerRoom(io,socket,'all-players',rooms[data.room]?.players ?? [])
  })
}