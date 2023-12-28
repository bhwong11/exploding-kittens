import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import db from './db/db.connection.js'
//seperate exports into routes/controller dir
import routes from './routes/index.js'
import { generateRoutes, emitToPlayerRoom } from './helpers/index.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'

dotenv.config()

const app = express()
const server = http.createServer(app)
const port = 3000
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

app.use(cors({
  credentials: true,
  origin: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/', async (req, res) => {
  let collection = db.collection("posts");
  let results = await collection.find({})
    .limit(50)
    .toArray()
  res.send(results).status(200)
})

generateRoutes(routes,app)

db.once('connected', () => {
  console.log('DB connected')
})

const roomMax = 4
//set for 10 min
const disconnectTimeout = 1000 * 60 * 10
const timeoutIds = {}

let rooms = {}

io.on('connection', (socket) => {
  console.log('a player connected',socket.id);
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

  socket.on('new-player',(data)=>{
    console.log('new-player',data,rooms)
    if(!data.room || !data.username){
      socket.emit('error',{
        message:'username or room was not included'
      })
      console.log('username or room was not included')
      return
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

  socket.on('clear-players',()=>{
    console.log('clear-players',Array.from(socket.rooms))
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].players = []
      emitToPlayerRoom(io,socket,'all-players', rooms[playerRoom].players)
    }
  })

  socket.on('action-complete',(data)=>{
    console.log('action-complete')
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      emitToPlayerRoom(io,socket,'action-complete',data)
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
    }
    emitToPlayerRoom(io,socket,'refresh-game-state', rooms[playerRoom]?.gameState ?? {
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
    })
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

  socket.on('error',(data)=>{
    console.log('error',data)
    socket.emit('error',{
      message:data
    })
  })

  socket.on('next-action-response',(data)=>{
    console.log('next-action-response',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].gameState.actionPromptIndex = data.complete?0:(
        rooms[playerRoom].gameState.actionPromptIndex+1
      )
      rooms[playerRoom].gameState.actionPromptFormObject = data.formObject
    }
    emitToPlayerRoom(io,socket,'next-action-response', {
      ...data,
      actionPromptIndex:rooms[playerRoom].gameState.actionPromptIndex
    })
  })

  socket.on('refresh-game-state',()=>{
    const playerRoom = Array.from(socket.rooms)[1]
    console.log('ROOMS',socket.id,Array.from(socket.rooms))
    console.log('refresh-game-state!!!',rooms[playerRoom]?.gameState)

    if(rooms[playerRoom]){
      emitToPlayerRoom(io,socket,'refresh-game-state', rooms[playerRoom]?.gameState ?? {
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
      })
    }
  })
})

server.listen(port, () => {
  console.log(`listening on port ${port}`)
})
