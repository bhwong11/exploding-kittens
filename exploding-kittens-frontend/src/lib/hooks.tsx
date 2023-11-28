import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useActions } from "@/lib/actions"

export const useInitializePlayerSocket=(username:string, room?:string):void=>{
  const {setSocket} = useGameStateContext() || {}

  useEffect(()=>{
    //add to .env
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000/')
    if(setSocket){
      setSocket(socket)
    }
    socket.emit('new-player',{
      username,
      ...(room?{room}:{})
    })
    return () => {
      socket.disconnect();
    }
  },[])
}


export const useActivateNopeHandlers=()=>{
  const {socket,setCurrentActions,currentActions} = useGameStateContext() || {}
  const {players} = usePlayerContext() || {}
  const [showNopePrompt, setShowNopePrompt] = useState<boolean>(false)
  const [noNopes, setNoNopes] = useState<number>(0)
  const actionsImpl = useActions()


  useEffect(()=>{
    socket?.on('activate-attempt',(data)=>{
      setShowNopePrompt(true)
      if(setCurrentActions){
        setCurrentActions(prev=>[...prev,data.action])
      }
    })
    //if no nope, user should send this event on prompt
    socket?.on('no-nope',()=>{
      setNoNopes(prev=>prev+1)
    })
    return ()=>{
      socket?.disconnect();
    }
  },[])

  useEffect(()=>{
    if(noNopes>=(players?.length || 0)-1){
      for(let a of (currentActions || [])){
          actionsImpl?.[a]()
      }
    }
  },[noNopes])

  const attemptActivate = (action?:Actions, blockNope=false)=>{
    socket?.emit('activate-attempt',{
      action,
    })
    setShowNopePrompt(false)
  }

  return {
    attemptActivate,
    //if this is set to true, display option for players to attemptActivate Nope
    showNopePrompt,
    setShowNopePrompt

  }

}