import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useActions } from "@/lib/actions"
import { actionTypes } from "@/data"

export const usePlayerSocketInitAndListen=(username:string, room?:string):void=>{
  const {setSocket} = useGameStateContext() || {}
  const {setPlayers,setCurrentPlayerUsername} = usePlayerContext() || {}

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

    if(setCurrentPlayerUsername) setCurrentPlayerUsername(username)

    return () => {
      socket.disconnect();
    }
  },[])
}


export const useActivateResponseHandlers=()=>{

  const {socket,setCurrentActions,currentActions, turnCount, setTurnCount} = useGameStateContext() || {}
  const {players, currentPlayerUsername} = usePlayerContext() || {}
  const [showResponsePrompt, setShowResponsePrompt] = useState<boolean>(false)
  const [noResponses, setNoResponses] = useState<number>(0)
  const [allowedResponse, setAllowedResponse] = useState<ResponseActions | null | "all">("all")
  const [allowedUsers, setAllowedUsers] = useState<string[]>(
    players?.map(p=>p.username)
    .filter(username=>username===currentPlayerUsername) || []
  )

  const actionsImpl = useActions()

  //when all users respond, perform all actions in currentActions stack
  useEffect(()=>{
    //hard coded for 2 players for now
    console.log('currentActions?.length',currentActions?.length,noResponses)
    if(
      noResponses>=(allowedUsers?.length || 2) 
      && currentActions?.length
    ){
      if(setCurrentActions)setCurrentActions(prev=>prev.slice(0,prev.length-1))
      actionsImpl[currentActions[currentActions.length-1]]()
      setShowResponsePrompt(false)
      setAllowedResponse("all")
      setAllowedUsers(
        players?.map(p=>p.username)
        .filter(username=>username===currentPlayerUsername) || []
      )
    }
    
    if(!currentActions?.length){
      setNoResponses(0)
    }
  },[noResponses,currentActions?.length])


  useEffect(()=>{
    if(!socket) return
    socket?.on('activate-attempt',(data)=>{
      if(
        !setCurrentActions
        || ((data.newAllowedResponse!==data.action) && data.allowedResponse!=="all")
        // || !data.allowedRespondUsers.includes(currentPlayerUsername || '')
      ) return
      setCurrentActions(prev=>[...prev,data.action])
      setShowResponsePrompt(true)
      setNoResponses(0)

      //set response restrictions
      setAllowedResponse(data.newAllowedResponse)
      setAllowedUsers(data.newAllowedUsers)
    })

    socket?.on('no-response',()=>{
      setNoResponses(prev=>prev+1)
    })

    return ()=>{
      socket?.disconnect();
    }
  },[socket])

  const attemptActivate = (action:Actions | null=null)=>{
    let newAllowedResponse: ResponseActions | null | "all" = actionTypes.nope
    let newAllowedUsers: string[] = players?.map(p=>p.username) || []
    
    //maybe a cleaner way to write this
    if(action === actionTypes.exploding){
      newAllowedResponse = [actionTypes.diffuse]
      newAllowedUsers = currentPlayerUsername?[currentPlayerUsername]:[]
    }
    if(action === actionTypes.diffuse){
      newAllowedResponse = null
      newAllowedUsers = []
    }

    socket?.emit('activate-attempt',{
      action,
      newAllowedResponse,
      newAllowedUsers,
      allowedResponse,
      allowedUsers
    })
  }

  const sendNoResponse = ()=>{
    socket?.emit('no-response')
  }

  return {
    attemptActivate,
    currentActions,
    //if this is set to true, display option for players to attemptActivate Nope
    showResponsePrompt,
    setShowResponsePrompt,
    allowedResponse:allowedResponse,
    sendNoResponse,
    noResponses
  }

}