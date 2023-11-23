import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import db from './db/db.connection.js';
//seperate exports into routes/controller dir
import Room from './models/Room.js';
import User from './models/User.js';

dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = 3000;
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/', async (req, res) => {
  let collection = db.collection("posts");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
  // res.sendFile(__dirname + '/index.html');
});

//seperate into routes/controller dir
app.get('/rooms', async (req,res)=>{
  try{
    const rooms = await Room.find();
    res.json(rooms).status(200)
  }catch(e){
    res.json({error:`error processing on /rooms route ${e}`}).status(500)
  }
})

app.get('/users', async (req,res)=>{
  try{
    const users = await User.find();
    res.json(users).status(200)
  }catch(e){
    res.json({error:`error processing on /users route ${e}`}).status(500)
  }
})

db.once('connected', () => {
  console.log('DB connected')
})

io.on('connection', (socket) => {
  console.log('a player connected');
  socket.on('disconnect', () => {
    console.log('a player disconnected');
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`)
});