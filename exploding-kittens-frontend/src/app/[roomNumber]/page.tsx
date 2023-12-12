"use client"
import {useEffect, useState } from "react"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import {
  useInitGame,
  usePlayerSocket 
} from "@/lib/hooks"
import Hand from "@/app/[roomNumber]/hand"
import OtherPlayers from "@/app/[roomNumber]/OtherPlayers"


type RoomParams = {
  params:{
    roomNumber:string
  }
}

const Room = ({params}:RoomParams)=>{
  const playerContext = usePlayerContext()
  const {deck,discardPile} = useGameStateContext() || {}

  const [users,setUsers] = useState<User | null>(null)
  const [username,setUsername] = useState<string>("")

  const {createGameAssets} = useInitGame()

  const {joinRoom, clearPlayers}= usePlayerSocket()

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
        <h1>join room</h1>
        <form onSubmit={(e:React.FormEvent)=>{
          e.preventDefault()
          joinRoom(username,params.roomNumber)
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
        <button onClick={clearPlayers} className="btn btn-blue">
            clear players
        </button>
      </div>
      <OtherPlayers/>
      <div className="border border-black">
        <Hand/>
        <div className="h-[15rem] overflow-y-scroll">
          Deck:
          {JSON.stringify(deck)}
          Discard:
          {JSON.stringify(discardPile)}
        </div>
        <button onClick={createGameAssets} className="btn btn-blue">
            create game assets(need at least one joined user for this to work)
        </button>
      </div>
    </div>
  )
}

export default Room