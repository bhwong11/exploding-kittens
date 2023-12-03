import { useEffect, useState} from "react"
import { io, Socket } from "socket.io-client"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useCardActions,useGameActions } from "@/lib/actions"
import { actionTypes, cardTypes } from "@/data"
import { shuffleArray } from "@/lib/helpers"
//show prompt hook

export const usePlayerSocket=()=>{
  const {setSocket,socket:currentSocket} = useGameStateContext() || {}
  const {setPlayers,players,setCurrentPlayerUsername} = usePlayerContext() || {}

  let socket:Socket<ServerToClientEvents, ClientToServerEvents> | null  = null

  useEffect(()=>{
    //add to .env
    socket = io('http://localhost:3000/')
    if(setSocket){
      setSocket(socket)
    }

    socket.on('all-players',(data)=>{
      if(setPlayers)setPlayers(data)
    })

    return () => {
      socket?.disconnect();
    }
  },[])

  const isPlayerInRoom = (username:string):boolean=>{
    return players?.map(player=>player.username).includes(username) ?? false
  }

  const clearPlayers= ():void=>{
    currentSocket?.emit('clear-players')
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
    isPlayerInRoom,
    clearPlayers
  }
}

type useActivateResponseHandlersProps = {initListeners:boolean}
export const useActivateResponseHandlers=({initListeners}:useActivateResponseHandlersProps={initListeners:false})=>{

  const {socket,setCurrentActions,currentActions} = useGameStateContext() || {}
  const {players, currentPlayerUsername} = usePlayerContext() || {}
  const [showResponsePrompt, setShowResponsePrompt] = useState<boolean>(false)
  const [noResponses, setNoResponses] = useState<number>(0)
  const [allowedResponse, setAllowedResponse] = useState<ResponseActions | null | "all">("all")
  const [allowedUsers, setAllowedUsers] = useState<string[]>([])

  const {actions,setActionsComplete,actionsComplete} = useCardActions()

  //when all users respond with "no responses", perform all actions in currentActions stack
  //this will mostly be a bunch of nopes cancelling each other out and on other action at the bottom
  useEffect(()=>{
    //if all players that can respond respond with no response, implement all actions in "chain"
    if(!initListeners) return
    if(
      noResponses>=(allowedUsers?.length || 0) 
      && currentActions?.length
    ){
      //remove the top action on stack, triggering useEffect again unitl all actions gone
      if(setCurrentActions)setCurrentActions(prev=>prev.slice(0,prev.length-1))

      //implement action
      actions[currentActions[currentActions.length-1]]()

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
      setActionsComplete(0)
    }
    //shouldn't listen for global state data
  },[noResponses,actionsComplete,allowedUsers?.length])


  useEffect(()=>{
    if(!socket?.id || !currentPlayerUsername || !initListeners) return
    //if action is allow, add action to current action "chain"
    socket?.on('activate-attempt',(data)=>{
      if(
        !setCurrentActions
        || ((data.allowedResponse!==data.action) && data.allowedResponse!=="all")
      ) return

      setCurrentActions(prev=>[...prev,data.action])
      setNoResponses(0)
      //useEffect on action hook that sets a context var that it's complete

      if(data.newAllowedUsers.includes(currentPlayerUsername || '')){
        setShowResponsePrompt(true)
      }else(
        setShowResponsePrompt(false)
      )

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
  },[socket?.id,currentPlayerUsername])


  //sends emit for action to be added to current stack and allowed responses
  const attemptActivate = (action:Actions | null=null)=>{
    //add card discard
    let newAllowedResponse: ResponseActions | null | "all" = actionTypes.nope
    let newAllowedUsers: string[] = (
      players
      ?.map(p=>p.username)
      .filter(username=>username!==currentPlayerUsername) || []
    )
    
    if(action === actionTypes.exploding){
      newAllowedResponse = actionTypes.diffuse
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

export const useInitGame = () => {
  const {setDeck,socket} = useGameStateContext() || {}
  const {players} = usePlayerContext() || {}

  const excludedCardTypes:CardType[] = [cardTypes.exploding.type,cardTypes.diffuse.type]
  const handSize = 5

  useEffect(()=>{
    if(!socket) return
    socket?.on('deck',(data)=>{
      if(setDeck)setDeck(data)
    })

    return ()=>{
      socket?.disconnect();
    }
  },[socket])

  let cardsCreatedCount = 0

  const createCardsFromTypes = (cardTypesInput:typeof cardTypes[keyof typeof cardTypes][])=>{
    const deck:Card[] = []
    for(let cardType of cardTypesInput){
        for(let i=0;i<cardType.count;i++){
          deck.push({
            id:cardsCreatedCount,
            color:cardType.color,
            image:cardType.images[i],
            type:cardType.type,
          })
          cardsCreatedCount++
        }
    }
    return deck
  }

  const initialDeck = shuffleArray(createCardsFromTypes(
    Object.values(cardTypes)
      .filter(cardType=>!excludedCardTypes.includes(cardType.type))
  ))

  const explodingKittenCards = createCardsFromTypes(
    Object.values(cardTypes)
      .filter(cardType=>cardType.type === cardTypes.exploding.type)
  )
  const diffuseCards = createCardsFromTypes(
    Object.values(cardTypes)
    .filter(cardType=>cardType.type === cardTypes.diffuse.type)
  )

  const createHands = ()=>{
    for (let player of players || []){
      const hand:Card[] = []
      const diffuseCard:Card | undefined = diffuseCards.pop()

      if (diffuseCard) hand.push(diffuseCard)

      for(let i = hand.length; i<handSize; i++){
        const newCard = initialDeck.pop()
        if(newCard) hand.push(newCard)
      }

      const newPlayers = [...(players??[])]
      const currPlayerIndx = players?.findIndex(p=>p.username === player.username)
      if((currPlayerIndx || currPlayerIndx===0) && currPlayerIndx!==-1){
        newPlayers[currPlayerIndx].cards = hand
      }
      socket?.emit('all-players',newPlayers)
    }
  }

  const createDeck=()=>{
      const randomizedDeck = [
        ...initialDeck,
        ...explodingKittenCards,
        ...diffuseCards
      ].sort(() => Math.random() - 0.5)
      socket?.emit('deck',[...randomizedDeck,{
        ...explodingKittenCards[0],
        id:1000
      }])
  }

  const createGameAssets = ()=>{
    if(!socket){
      console.error('socket not initialized')
      return
    }
    //hands need to be created first to remove cards before r
    createHands()
    createDeck()
  }

  return {
    createCardsFromTypes,
    createGameAssets
  }
}

export const useTurns = ()=>{
  const {
    turnCount,
    setTurnCount,
  } = useGameStateContext() || {}
  const {currentPlayerUsername,players} = usePlayerContext() ||{}

  const {attemptActivate,currentActions} = useActivateResponseHandlers()
  const {drawCard} = useGameActions()
  const [isTurnEnd,setIsTurnEnd] = useState<boolean>(false)

  useEffect(()=>{
    //move up turn count at end of action chain in case of exploding cat and diffuse
    if(!currentActions?.length && isTurnEnd){
      if(setTurnCount)setTurnCount(prev=>prev+1)
    }
  },[currentActions?.length])

  useEffect(()=>{
    setIsTurnEnd(false)
  },[turnCount])


  const endTurn = () =>{
    setIsTurnEnd(true)
    const newCard = drawCard(currentPlayerUsername ?? '')
    if(newCard?.type === cardTypes.exploding.type){
      attemptActivate(cardTypes.exploding.type)
    }else{
      if(setTurnCount)setTurnCount(prev=>prev+1)
    }
  }

  const turnPlayer = players?.[(turnCount??0) % (players?.length ?? 1)]

  return {
    endTurn,
    turnPlayer
  }
}