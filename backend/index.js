import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import db from './db/db.connection.js';
//seperate exports into routes/controller dir
import routes from './routes/index.js';
import { generateRoutes, emitToPlayerRoom } from './helpers/index.js';
import cors from 'cors'

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = 3000;
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
  let collection = db.collection("posts");
  let results = await collection.find({})
    .limit(50)
    // not sure .limit() works on .find() 
    // I was getting an error so it'll be commented out for now
    .toArray();
  res.send(results).status(200);
  // res.sendFile(__dirname + '/index.html');
});

generateRoutes(routes,app)

db.once('connected', () => {
  console.log('DB connected')
})

let rooms = {}
const roomMax = 4

io.on('connection', (socket) => {
  console.log('a player connected',socket.id);
  socket.on('disconnecting', () => {
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].players = rooms[playerRoom]?.players?.filter(player=>player.socketId!==socket.id)
    }
    console.log('a player disconnected',socket.id,rooms[playerRoom]);
    if(rooms[playerRoom]){
      io.sockets.emit('all-players',rooms[playerRoom].players ?? [])
    }
  });

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
        deck:[],
        discardPile:[]
      }
    }

    const existingPlayerIndex = rooms[data.room]?.players?.findIndex(player=>player.username===data?.username)

    if(existingPlayerIndex!==-1 && typeof existingPlayerIndex === 'number'){
      socket.emit('error',{
        message:'player already exist'
      })
      console.log('player already exist in room')
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
      rooms[playerRoom].deck = data
    }
    emitToPlayerRoom(io,socket,'deck',rooms[playerRoom]?.deck ?? [])
  })

  socket.on('discard-pile',(data)=>{
    console.log('discard-pile',data)
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].discardPile = data
    }
    emitToPlayerRoom(io,socket,'discard-pile',rooms[playerRoom]?.discardPile ?? [])
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
    console.log('clear-players')
    const playerRoom = Array.from(socket.rooms)[1]
    if(rooms[playerRoom]){
      rooms[playerRoom].players = []
    }
    emitToPlayerRoom(io,socket,'all-players', rooms[playerRoom].players)
  })

  socket.on('activate-attempt',(data)=>{
    console.log('activate-attempt',data)
    emitToPlayerRoom(io,socket,'activate-attempt', data)
  })

  socket.on('error',(data)=>{
    console.log('error',data)
    socket.emit('error',{
      message:data
    })
  })

  socket.on('no-response',()=>{
    console.log('no-response')
    emitToPlayerRoom(io,socket,'no-response')
  })

  socket.on('next-action-response',(data)=>{
    console.log('next-action-response',data)
    emitToPlayerRoom(io,socket,'next-action-response', data)
  })
});

server.listen(port, () => {
  console.log(`listening on port ${port}`)
});
