"use client"
import { useContext, useEffect, useState, useRef } from "react"
import { PlayerContext } from "@/context/players"
import { io, Socket } from "socket.io-client"
import { useInitializePlayerSocket } from "@/lib/hooks"
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
  const {
    attemptActivate,
    allowedResponse,
    showResponsePrompt,
    sendNoResponse,
    currentActions,
    noResponses
  } = useActivateResponseHandlers()

  useInitializePlayerSocket('test-user-1')
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
      <button onClick={()=>{
        playerContext?.setPlayers(prev=>[
          ...prev,
          {username:`user ${prev.length}`}
        ])
      }}>
        add player
      </button>
      <div>
        <h1>TEST {JSON.stringify(currentActions)} no response:{noResponses}</h1>
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
    </div>
  )
}

export default Room