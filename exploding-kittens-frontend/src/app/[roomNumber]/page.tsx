"use client"
import { useContext, useEffect, useState } from "react"
import { PlayerContext } from "@/context/players"
import { io } from "socket.io-client"


type RoomParams = {
  params:{
    roomNumber:string
  }
}

type user = {
  wins?: number
  rooms?: []
  _id?: string
  id?: number
  username?: string
}

const Room = ({params}:RoomParams)=>{
  const playerContext = useContext(PlayerContext)
  const [users,setUsers] = useState<user | null>(null)
  useEffect(()=>{
    //add to .env
    const socket = io('http://localhost:3000/')
    socket.emit('new-page',{
      message:'new page!!'
    })

    socket.on('new-page-backend',(data:{
      message:string
    })=>{
      console.log('new-page-backend!!',data)
    })
    return () => {
      socket.disconnect();
    }
  },[])

  useEffect(()=>{
    //add to .env
    fetch('http://localhost:3000/users')
      .then((res)=>res.json())
      .then((data:user)=>{
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
    </div>
  )
}

export default Room