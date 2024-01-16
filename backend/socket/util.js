import { emitToPlayerRoom } from "../helpers/index.js"

export const utilEventActions = (io,socket,rooms)=>{
  socket.on('clear-players',()=>{
    console.log('clear-players',Array.from(socket.rooms))
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].players = []
      emitToPlayerRoom(io,socket,'all-players', rooms[playerRoom].players)
    }
  })

  socket.on('clear-game-state',()=>{
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState={
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
      emitToPlayerRoom(io,socket,'refresh-game-state', rooms[playerRoom]?.gameState)
    }
  })

  socket.on('error',(data)=>{
    console.log('error',data)
    socket.emit('error',{
      message:data
    })
  })
}