"use client"
import {useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import {
  useInitGame,
  usePlayerSocket,
  useTurns
} from "@/lib/hooks"
import { authenticate,isDevMode } from "@/lib/helpers"
import Hand from "@/app/[roomNumber]/hand"
import OtherPlayers from "@/app/[roomNumber]/OtherPlayers"


type RoomParams = {
  params:{
    roomNumber:string
  }
}

const Room = ({params}:RoomParams)=>{
  const router = useRouter()
  const {players,currentPlayer,setCurrentPlayer} = usePlayerContext() || {}

  const {deck,discardPile, socket} = useGameStateContext() || {}
  const {winner} = useTurns() || {}

  const [users,setUsers] = useState<User | null>(null)
  const [username,setUsername] = useState<string>("")

  const {createGameAssets} = useInitGame()

  const {joinRoom, clearPlayers,clearGameState}= usePlayerSocket()

  useEffect(()=>{
    //add to .env
    fetch('http://localhost:3000/users')
      .then((res)=>res.json())
      .then((data:User)=>{
        setUsers(data)
      })
  },[])

  useEffect(() => {
    if(isDevMode) return
    const setData = async () => {
      const playerData = await authenticate()
      if (playerData && setCurrentPlayer) setCurrentPlayer(playerData)
      else router.push('/auth/login')
    }
    if (!currentPlayer) {
      console.log('no current player')
      setData()
    }
  }, [])

  return (
    <div className="w-full">
      {winner && <div>Game Over! winner is: {winner.username}</div>}
      Room Number: {params.roomNumber} <br/>
      {JSON.stringify(players)} <br/>
      {JSON.stringify(users)}
      <div className="border border-black">
        <h1>join room</h1>
        <form onSubmit={(e:React.FormEvent)=>{
          e.preventDefault()
          joinRoom({username,room:params.roomNumber })
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
        <button onClick={clearGameState} className="btn btn-blue">
            clear gameState
        </button>
        <button onClick={()=>{socket?.emit('save-room')}} className="btn btn-blue">
            save room
        </button>
        <button onClick={()=>{socket?.emit('get-saved-room')}} className="btn btn-blue">
            get saved room
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
        <button 
          onClick={createGameAssets} 
          className="btn btn-blue" 
          disabled={players && players.length < 3 && !isDevMode}
        >
          create game assets(need at least one joined user for this to work)
        </button>
      </div>
    </div>
  )
}

export default Room