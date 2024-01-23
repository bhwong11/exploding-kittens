import { emitToPlayerRoom } from "../helpers/index.js"

export const gameActions = (io, socket, rooms)=>{
  socket.on('deck',(data)=>{
    console.log('deck',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.deck = data
    }
    emitToPlayerRoom(io,socket,'deck',rooms[playerRoom]?.gameState.deck ?? [])
  })

  socket.on('discard-pile',(data)=>{
    console.log('discard-pile',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.discardPile = data
    }
    emitToPlayerRoom(io,socket,'discard-pile',rooms[playerRoom]?.gameState.discardPile ?? [])
  })

  socket.on('all-players',(data)=>{
    console.log('all-players',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].players = data
    }
    emitToPlayerRoom(io,socket,'all-players', data)
  })

  socket.on('action-complete',(data)=>{
    console.log('action-complete')
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      emitToPlayerRoom(io,socket,'action-complete',data)
    }
  })

  socket.on('turn-count',(data)=>{
    console.log('turn-count',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.turnCount = data
    }
    emitToPlayerRoom(io,socket,'turn-count', data)
  })

  socket.on('attack-turns',(data)=>{
    console.log('attack-turns',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.attackTurns = data
    }
    emitToPlayerRoom(io,socket,'attack-turns', data)
  })

  socket.on('activate-attempt',(data)=>{
    console.log('activate-attempt',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.allowedUsers = data.newAllowedUsers
      rooms[playerRoom].gameState.currentActions = data.actions
    }
    emitToPlayerRoom(io,socket,'activate-attempt', data)
  })

  socket.on('current-actions',(data)=>{
    console.log('current-actions',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.currentActions = data
    }
    emitToPlayerRoom(io,socket,'current-actions', data)
  })

  socket.on('action-prompt',(data)=>{
    console.log('action-prompt',data)
    emitToPlayerRoom(io,socket,'action-prompt', data)
  })

  socket.on('allowed-users',(data)=>{
    console.log('allowed-users',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.allowedUsers = data
    }
    emitToPlayerRoom(io,socket,'allowed-users', data)
  })

  socket.on('no-response',(data)=>{
    console.log('no-response')
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.noResponses = data
    }
    
    emitToPlayerRoom(io,socket,'no-response',data)
  })

  socket.on('next-action-response',(data)=>{
    console.log('next-action-response',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.actionPromptIndex = data.complete?0:(
        rooms[playerRoom].gameState.actionPromptIndex+1
      )
      rooms[playerRoom].gameState.actionPromptFormObject = data.formObject
      emitToPlayerRoom(io,socket,'next-action-response', {
        ...data,
        actionPromptIndex:rooms[playerRoom].gameState.actionPromptIndex
      })
    }
  })
}