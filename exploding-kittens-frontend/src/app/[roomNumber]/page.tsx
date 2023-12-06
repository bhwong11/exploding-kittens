"use client"
import {useEffect, useState } from "react"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import {
  useActivateResponseHandlers,
  useInitGame,
  useTurns,
  usePlayerSocket 
} from "@/lib/hooks"
import { actionTypes } from "@/data"
import { Hand } from "@/app/[roomNumber]/Hand"
import { ActionPrompt } from "@/app/[roomNumber]/ActionPrompt"
import { ErrorMessage } from "@/app/(components)/ErrorMessage"


type RoomParams = {
  params:{
    roomNumber:string
  }
}

const Room = ({params}:RoomParams)=>{
  const playerContext = usePlayerContext()
  const {deck, turnCount, attackTurns,discardPile} = useGameStateContext() || {}

  const [users,setUsers] = useState<User | null>(null)
  const [username,setUsername] = useState<string>("")


  const {
    attemptActivate,
    allowedResponse,
    showResponsePrompt,
    sendNoResponse,
    currentActions,
    noResponses
  } = useActivateResponseHandlers({initListeners:true})
  const {createGameAssets} = useInitGame()

  const {joinRoom, clearPlayers}= usePlayerSocket()
  const {endTurn} = useTurns()

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
      <ErrorMessage/>
      <div className="border border-black">
        <h1>
          TEST Hook(To get this to work, you need to have 2 joined users with different usernames)
          {JSON.stringify(currentActions)} no response:{noResponses}
        </h1>
        <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.favor)}>
          favor
        </button>
        <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.seeTheFuture)}>
          send see the future
        </button>
        <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.attack)}>
          attack
        </button>
        {showResponsePrompt && (
          <div>
          <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.nope)}>
            send nope {JSON.stringify(allowedResponse)}
          </button>
          <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.diffuse)}>
            send diffuse {JSON.stringify(allowedResponse)}
          </button>
          <button className="btn btn-blue" onClick={()=>sendNoResponse()}>
            no response
          </button>
          </div>
        )}
        <ActionPrompt/>
      </div>

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
      <div className="border border-black">
        <h1>turn count: {turnCount}, attack turns: {attackTurns}</h1>
        <button className="btn btn-blue" onClick={()=>endTurn()}>
          end turn
        </button>
      </div>
    </div>
  )
}

export default Room