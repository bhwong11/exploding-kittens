import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import db from './db/db.connection.js';
//seperate exports into routes/controller dir
import routes from './routes/index.js';
import { generateRoutes } from './helpers/index.js';
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

let players = []
let deck = []

io.on('connection', (socket) => {
  console.log('a player connected',socket.id);
  socket.emit('all-players',players)
  socket.on('disconnect', () => {
    players = players.filter(player=>player.socketId!==socket.id)
    console.log('a player disconnected',socket.id,players);
    io.sockets.emit('all-players',players)
  });
  socket.on('new-page',(data)=>{
    console.log('new page backend recieved',data)
    socket.emit('new-page-backend',{
      message:'sent from backend'
    })
  })

  socket.on('new-player',(data)=>{

    const existingPlayerIndex = players.findIndex(player=>player.username===data?.username)

    if(existingPlayerIndex===-1){
      players.push({
        ...data,
        socketId: socket.id,
        lose:false,
        cards:[]
      })
    }
    io.sockets.emit('all-players',players)
  })

  socket.on('deck',(data)=>{
    console.log('deck',data)
    deck = data
    io.sockets.emit('deck',deck)
  })

  socket.on('all-players',(data)=>{
    console.log('all-players',data)
    io.sockets.emit('all-players',data)
  })

  socket.on('clear-players',()=>{
    console.log('clear-players')
    players = []
    io.sockets.emit('all-players',players)
  })

  socket.on('activate-attempt',(data)=>{
    console.log('activate-attempt',data)
    io.sockets.emit('activate-attempt',data)
  })

  socket.on('no-response',()=>{
    console.log('no-response')
    io.sockets.emit('no-response')
  })

  socket.on('next-action-response',(data)=>{
    console.log('next-action-response',data)
    io.sockets.emit('next-action-response',data)
  })
});

server.listen(port, () => {
  console.log(`listening on port ${port}`)
});
