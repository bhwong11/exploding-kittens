import { io } from "../index.js"
import { utilEventActions } from './util.js'
import { playerConnectionEventActions } from './playerConnection.js'
import { gameActions } from './game.js'
import { gameSaveActions } from './gameSave.js'

export let rooms = {}

export const initalizeSocketEvents = ()=>{
  io.on('connection', (socket) => {
    console.log('a player connected',socket.id);
    playerConnectionEventActions(io,socket,rooms)
    utilEventActions(io,socket,rooms)
    gameActions(io,socket,rooms)
    gameSaveActions(io,socket,rooms)
  })
}