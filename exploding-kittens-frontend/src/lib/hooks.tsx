import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useActions } from "@/lib/actions"
import { actionTypes } from "@/data"

export const useInitializePlayerSocket=(username:string, room?:string):void=>{
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
  const [allowedResponse, setAllowedResponse] = useState<ResponseActions>(actionTypes.nope)
  const [allowedUsers, setAllowedUsers] = useState<string[]>(players?.map(p=>p.username) || [])
  const actionsImpl = useActions()


  useEffect(()=>{
    if(!socket) return
    socket?.on('activate-attempt',(data)=>{
      console.log('SHOW')
      if(
        !setCurrentActions
        || ((allowedResponse!==data.action) && (currentActions?.length || 0)>0)
        // || !allowedUsers.includes(currentPlayerUsername || '')
      ) return
      setCurrentActions(prev=>[...prev,data.action])
      setAllowedResponse(data.allowedResponse)
      setAllowedUsers(data.allowedUsers)
      setShowResponsePrompt(true)
      setNoResponses(0)
    })
    //if no nope, user should send this event on prompt
    socket?.on('no-response',()=>{
      setNoResponses(prev=>prev+1)
    })
    return ()=>{
      socket?.disconnect();
    }
  },[socket])


  useEffect(()=>{
    //hard coded for 2 players for now
    if(noResponses>=(players?.length || 2)){
      console.log('action stack',currentActions)
      //set end turn if kittens explode
      if(currentActions?.[0]===actionTypes.exploding){
        if(setTurnCount)setTurnCount(prev=>prev+1)
      }
      for(let i=currentActions?.length ?? 0; i>0; i--){
        console.log('currentActions?.[i]',currentActions)
        if(currentActions?.[i]){
          actionsImpl?.[currentActions?.[i]]()
        }
      }
      if(setCurrentActions) setCurrentActions([])
    }
  },[noResponses])

  const attemptActivate = (action:Actions | null=null)=>{
    let allowedResponse: ResponseActions | null = actionTypes.nope
    let allowedUsers: string[] = players?.map(p=>p.username) || []
    
    //maybe a cleaner way to write this
    if(action === actionTypes.exploding){
      allowedResponse = [actionTypes.diffuse]
      allowedUsers = currentPlayerUsername?[currentPlayerUsername]:[]
    }
    if(action === actionTypes.diffuse){
      allowedResponse = null
      allowedUsers = []
    }
    console.log('ACTION',action,allowedResponse,allowedUsers)

    socket?.emit('activate-attempt',{
      action,
      allowedResponse,
      allowedUsers
    })
    setShowResponsePrompt(false)
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
    allowedResponse,
    sendNoResponse,
    noResponses
  }

}