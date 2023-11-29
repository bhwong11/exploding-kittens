"use client"
import { useContext, useEffect, useState, useRef } from "react"
import { PlayerContext } from "@/context/players"
import { io, Socket } from "socket.io-client"
import { usePlayerSocket } from "@/lib/hooks"
import { useGameStateContext } from "@/context/gameState"
import { useActivateResponseHandlers } from "@/lib/hooks"
import { actionTypes } from "@/data"


type RoomParams = {
  params:{
    roomNumber:string
  }
}

const Room = ({params}:RoomParams)=>{
  const playerContext = useContext(PlayerContext)
  const [users,setUsers] = useState<User | null>(null)
  const [username,setUsername] = useState<string>("")


  const {
    attemptActivate,
    allowedResponse,
    showResponsePrompt,
    sendNoResponse,
    currentActions,
    noResponses
  } = useActivateResponseHandlers()

  const {joinRoom}= usePlayerSocket()
  const {socket} = useGameStateContext() || {}

  useEffect(()=>{
    //preSocketRef.current makes sure we don't double add listeners
    //can make this a helper hook to reduce boilerplate
    socket?.emit('new-page',{
      message:'new page!!'
    })

    socket?.on('new-page-backend',(data:{
      message:string
    })=>{
      console.log('new-page-backend!!',data)
    })
    return () => {
      socket?.disconnect();
    }
  },[socket])

  useEffect(()=>{
    //add to .env
    fetch('http://localhost:3000/users')
      .then((res)=>res.json())
      .then((data:User)=>{
        setUsers(data)
      })
  },[])

  return (
    <div className="w-full">
      Room Number: {params.roomNumber}
      {JSON.stringify(playerContext)}
      {JSON.stringify(users)}
      <div className="border border-black">
        <h1>TEST Hook {JSON.stringify(currentActions)} no response:{noResponses}</h1>
        <button onClick={()=>attemptActivate(actionTypes.shuffle)}>
          shuffle
        </button>
        {showResponsePrompt && (
          <div>
          <button onClick={()=>attemptActivate(actionTypes.nope)}>
            send nope {JSON.stringify(allowedResponse)}
          </button>
          <button onClick={()=>sendNoResponse()}>
            no response
          </button>
          </div>
        )}
      </div>
      <div className="border border-black">
        <h1>join room</h1>
        <form onSubmit={(e:React.FormEvent)=>{
          e.preventDefault()
          joinRoom(username)
          setUsername("")
        }}>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="Username"
            onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setUsername(e.target.value)}
            value={username}
          />
          <button type="submit" className="btn btn-blue">
            join room
          </button>
        </form>
      </div>
    </div>
  )
}

export default Room