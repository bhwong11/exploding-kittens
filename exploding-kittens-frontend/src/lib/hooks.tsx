import { useEffect, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useActions } from "@/lib/actions"
import { actionTypes } from "@/data"

export const usePlayerSocket=()=>{
  const {setSocket,socket:currentSocket} = useGameStateContext() || {}
  const {setPlayers,players,setCurrentPlayerUsername} = usePlayerContext() || {}

  let socket:Socket<ServerToClientEvents, ClientToServerEvents> | null  = null

  useEffect(()=>{
    if(currentSocket) return

    //add to .env
    socket = io('http://localhost:3000/')
    if(setSocket){
      setSocket(socket)
    }

    socket.on('all-players',(data)=>{
      console.log('ALL',data)
      if(setPlayers)setPlayers(data)
    })

    return () => {
      socket?.disconnect();
    }
  },[])

  const isPlayerInRoom = (username:string):boolean=>{
    return players?.map(player=>player.username).includes(username) ?? false
  }

  const joinRoom = (username:string, room?:string):void =>{
    if(isPlayerInRoom(username)) return
    if(currentSocket){
      currentSocket.emit('new-player',{
        username,
        ...(room?{room}:{})
      })
      if(setCurrentPlayerUsername) setCurrentPlayerUsername(username)
    }else{
      console.error('socket not initialized yet')
    }
  }

  return {
    joinRoom,
    isPlayerInRoom
  }
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

  //when all users respond with "no responses", perform all actions in currentActions stack
  //this will mostly be a bunch of nopes cancelling each other out and on other action at the bottom
  useEffect(()=>{
    //hard coded for 2 players for now
    console.log('currentActions?.length',currentActions?.length,noResponses)

    //if all players that can respond respond with no response, implement all actions in "chain"
    if(
      noResponses>=(allowedUsers?.length || 2) 
      && currentActions?.length
    ){
      //remove the top action on stack, triggering useEffect again unitl all actions gone
      if(setCurrentActions)setCurrentActions(prev=>prev.slice(0,prev.length-1))

      //implement action
      actionsImpl[currentActions[currentActions.length-1]]()

      //reset allowed users, responses, and hide response prompt
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
    //if action is allow, add action to current action "chain"
    socket?.on('activate-attempt',(data)=>{
      if(
        !setCurrentActions
        || ((data.newAllowedResponse!==data.action) && data.allowedResponse!=="all")
        || !data.allowedUsers.includes(currentPlayerUsername || '')
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


  //sends emit for action to be added to current stack and allowed responses
  const attemptActivate = (action:Actions | null=null)=>{
    let newAllowedResponse: ResponseActions | null | "all" = actionTypes.nope
    let newAllowedUsers: string[] = players?.map(p=>p.username) || []
    
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

  //send no response if no card to respond to current action
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