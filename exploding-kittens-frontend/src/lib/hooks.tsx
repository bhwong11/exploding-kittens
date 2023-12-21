import { useEffect, useState, useTransition} from "react"
import { io, Socket } from "socket.io-client"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useCardActions,useGameActions } from "@/lib/actions"
import { actionTypes, cardTypes } from "@/data"
import { shuffleArray, getNonLostPlayers } from "@/lib/helpers"
//show prompt hook

export const usePlayerSocket=()=>{
  const {setSocket,socket:currentSocket} = useGameStateContext() || {}
  const {setPlayers,players,setCurrentPlayer,currentPlayer} = usePlayerContext() || {}

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
      console.log('Client disconnected')
      socket?.disconnect();
    }
  },[])

  const isPlayerInRoom = (username:string):boolean=>{
    return players?.map(player=>player.username).includes(username) ?? false
  }

  const clearPlayers= ():void=>{
    currentSocket?.emit('clear-players')
  }

  type JoinRoomProps = {
    username?:string, room?:string
  }
  const joinRoom = ({username, room}:JoinRoomProps):void =>{
    if(!username && !currentPlayer?.username) {
      console.error('no username or current username found')
      return
    }
    if(currentSocket){
      currentSocket.emit('new-player',{
        username: username ?? currentPlayer?.username ?? '',
        ...(room?{room}:{})
      })
      if(setCurrentPlayer) setCurrentPlayer({
        ...currentPlayer,
        ...(username?{username}:{})
      })
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

type UseActivateResponseHandlersProps = {initListeners:boolean}
export const useActivateResponseHandlers=({initListeners}:UseActivateResponseHandlersProps={initListeners:false})=>{

  const {socket,setCurrentActions,currentActions} = useGameStateContext() || {}
  const {players: allPlayers, currentPlayer} = usePlayerContext() || {}
  const players = getNonLostPlayers(allPlayers ?? [])
  const {discardCards} = useGameActions()

  const [noResponses, setNoResponses] = useState<{username:string}[]>([])
  const [allowedUsers, setAllowedUsers] = useState<string[]>([])

  const {actions,setActionsComplete,actionsComplete} = useCardActions()

  //when all users respond with "no responses", perform all actions in currentActions stack
  //this will mostly be a bunch of nopes cancelling each other out and on other action at the bottom
  useEffect(()=>{
    //if all players that can respond respond with no response, implement all actions in "chain"
    if(!initListeners) return
    if(
      noResponses.length>=(allowedUsers?.length || 0) 
      && currentActions?.length
    ){
      if(setCurrentActions)setCurrentActions(prev=>prev.slice(0,prev.length-1))

      //implement action
      actions[currentActions[currentActions.length-1]]()

      //reset allowed users, responses, and hide response prompt
      setAllowedUsers([])
    }
    
    if(!currentActions?.length){
      setNoResponses([])
      setActionsComplete(0)
    }
  },[noResponses,actionsComplete,allowedUsers?.length])


  useEffect(()=>{
    if(!socket?.id || !currentPlayer || !initListeners) return
    //if action is allow, add action to current action "chain"
    socket?.on('activate-attempt',(data)=>{
      if(!setCurrentActions) return

      setCurrentActions(prev=>[...prev,data.action])
      setNoResponses([])
      //useEffect on action hook that sets a context var that it's complete
      //set response restrictions
      setAllowedUsers(data.newAllowedUsers)
    })

    socket?.on('no-response',(data)=>{
      setNoResponses(prev=>[...prev,{username:data.username}])
    })

    return ()=>{
      console.log('Client disconnected')
      socket?.disconnect();
    }
  },[socket?.id,currentPlayer?.username])


  //sends emit for action to be added to current stack and allowed responses
  const attemptActivate = (
    action:Actions | null=null, 
    cards?:Card[],
    cardId?:number,
    cardType?:CardType
  )=>{
    //add card discard
    let newAllowedUsers: string[] = (
      players
      ?.map(p=>p.username)
      .filter(username=>username!==currentPlayer?.username) || []
    )
    
    //add to gameActions hooks
    if(action === actionTypes.exploding){
      newAllowedUsers = currentPlayer?.username?[currentPlayer.username]:[]
    }
    if(action === actionTypes.diffuse){
      newAllowedUsers = []
    }
    discardCards(cards,cardId,cardType)

    socket?.emit('activate-attempt',{
      action,
      newAllowedUsers,
      allowedUsers
    })
  }

  //send no response if no card to respond to current action
  const sendNoResponse = (username?:string)=>{
    if(!username) {
      console.error('username not found in send response')
      return
    }
    socket?.emit('no-response',{
      username
    })
  }

  return {
    attemptActivate,
    currentActions,
    allowedUsers,
    sendNoResponse,
    noResponses
  }
}

export const useInitGame = () => {
  const {setDeck,socket,setDiscardPile,deck,discardPile} = useGameStateContext() || {}
  const {players} = usePlayerContext() || {}
  const [_,startTransition] = useTransition()

  const excludedCardTypes:CardType[] = [cardTypes.exploding.type,cardTypes.diffuse.type]
  const handSize = 5

  useEffect(()=>{
    if(!socket) return
    socket.on('deck',(data)=>{
      startTransition(()=>{
        if(setDeck)setDeck(data)
      })
    })

    socket.on('discard-pile',(data)=>{
      if(setDiscardPile)setDiscardPile(data)
    })

    return ()=>{
      console.log('Client disconnected')
      socket?.disconnect();
    }
  },[socket])

  useEffect(()=>{
    if(!deck?.length && !!discardPile?.length){
      const newDeck = shuffleArray(discardPile)
      socket?.emit('deck',newDeck)
      socket?.emit('discard-pile',[])
    }
  },[deck?.length])

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
    const newPlayers = [...(players??[])]
    for (let player of players || []){
      const hand:Card[] = []
      const diffuseCard:Card | undefined = diffuseCards.pop()

      if (diffuseCard) hand.push(diffuseCard)

      for(let i = hand.length; i<handSize; i++){
        const newCard = initialDeck.pop()
        if(newCard) hand.push(newCard)
      }

      //const newPlayers = [...(players??[])]
      const currPlayerIndx = players?.findIndex(p=>p.username === player.username)
      if((currPlayerIndx || currPlayerIndx===0) && currPlayerIndx!==-1){
        newPlayers[currPlayerIndx].cards = hand
      }
    }
    console.log('NEW PLAYER',newPlayers)
    socket?.emit('all-players',newPlayers)
  }

  const createDeck=()=>{
      const randomizedDeck = shuffleArray([
        ...initialDeck,
        ...explodingKittenCards.slice(0,(players?.length ?? 1)-1),
        ...diffuseCards
      ])
      socket?.emit('deck',[...randomizedDeck,{
        ...explodingKittenCards[0],
        id:1000
      }])
  }

  const emptyDiscard = ()=>{
    socket?.emit('discard-pile',[])
  }

  const createGameAssets = ()=>{
    if(!socket){
      console.error('socket not initialized')
      return
    }
    //hands need to be created first to remove cards before
    createHands()
    createDeck()
    emptyDiscard()
  }

  return {
    createCardsFromTypes,
    createGameAssets
  }
}

type UseTurnsProps = {initListeners:boolean}
export const useTurns = ({initListeners}:UseTurnsProps={initListeners:false})=>{
  const {
    socket,
    turnCount,
    attackTurns,
    setTurnCount,
    setAttackTurns
  } = useGameStateContext() || {}
  const {currentPlayer,players: allPlayers} = usePlayerContext() ||{}
  const {deck} = useGameStateContext() || {}
  const players = getNonLostPlayers(allPlayers ?? [])
  
  //will be false if no winner
  const winner: Player | boolean = players.length>1
    && !!deck?.length
    && players.filter(player=>!player.lose).length===1 
    && (players?.find(player=>!player.lose) ?? false)

  const {attemptActivate,currentActions} = useActivateResponseHandlers()
  const {drawCard} = useGameActions()
  const [isTurnEnd,setIsTurnEnd] = useState<boolean>(false)

  useEffect(()=>{
    if(!socket || !initListeners) return
      socket.on('turn-count',(data)=>{
        if(setTurnCount)setTurnCount(data)
      })
  },[socket])

  useEffect(()=>{
    //move up turn count at end of action chain in case of exploding cat and diffuse
    if(!currentActions?.length && isTurnEnd){
      if(attackTurns??0>0){
        if(setAttackTurns)setAttackTurns(prev=>prev-1)
      }else{
        socket?.emit('turn-count',(turnCount ?? 0)+1)
      }
    }
  },[currentActions?.length])

  useEffect(()=>{
    setIsTurnEnd(false)
  },[turnCount,attackTurns])


  const endTurn = () =>{
    setIsTurnEnd(true)
    const newCard = drawCard(currentPlayer?.username ?? '')
    if(newCard?.type === cardTypes.exploding.type){
      attemptActivate(actionTypes.exploding,[newCard])
    }else{
      if(attackTurns??0>0){
        if(setAttackTurns)setAttackTurns(prev=>prev-1)
      }else{
        socket?.emit('turn-count',(turnCount ?? 0)+1)
      }
    }
  }

  const turnPlayer = players[(turnCount??0) % (players?.length ?? 1)]

  return {
    endTurn,
    isTurnEnd,
    turnPlayer,
    winner
  }
}