import { useEffect, useState, useTransition,useRef} from "react"
import { io, Socket } from "socket.io-client"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useCardActions,useGameActions } from "@/lib/actions"
import { actionTypes, cardTypes } from "@/data"
import { shuffleArray, getNonLostPlayers,isObjKey } from "@/lib/helpers"

type UsePlayerSocketProps = {initSocket:boolean}
export const usePlayerSocket=({initSocket}:UsePlayerSocketProps={initSocket:false})=>{
  const {
    setSocket,
    socket:currentSocket,
    setCurrentActions,
    setAttackTurns,
    setDeck,
    setDiscardPile,
    setTurnCount,
  } = useGameStateContext() || {}
  const {setPlayers,players,setCurrentPlayer,currentPlayer} = usePlayerContext() || {}

  let socket:Socket<ServerToClientEvents, ClientToServerEvents> | null  = null

  useEffect(()=>{
    //add to .env
    if(!initSocket) return 
    socket = io(process.env.NEXT_PUBLIC_BACKEND_API as string)
    if(setSocket){
      setSocket(socket)
    }

    socket.on('all-players',data=>{
      if(setPlayers)setPlayers(data)
    })

    socket.on('refresh-game-state',data=>{
      console.log('refresh-game-state-data',data)
      if(setCurrentActions) setCurrentActions(data.currentActions)
      if(setAttackTurns) setAttackTurns(data.attackTurns)
      if(setDeck) setDeck(data.deck)
      if(setDiscardPile) setDiscardPile(data.discardPile)
      if(setTurnCount) setTurnCount(data.turnCount)
    })

    socket.on('current-actions',data=>{
      if(setCurrentActions) setCurrentActions(data)
    })

    return () => {
      console.log('Client disconnected')
      socket?.disconnect();
    }
  },[])

  const isPlayerInRoom = (username:string):boolean=>{
    return players?.map(player=>player.username).includes(username) ?? false
  }

  const isAllPlayersActive = players?.every(player=>player.active)

  const clearPlayers= ():void=>{
    currentSocket?.emit('clear-players')
  }

  const clearGameState= ():void=>{
    currentSocket?.emit('clear-game-state')
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
    clearPlayers,
    clearGameState,
    isAllPlayersActive
  }
}

export const useAsyncEmitSocketEvent = ()=>{
  const { 
    socket,
  } = useGameStateContext() || {}

  type AsyncEmitProps = {
    eventName:keyof ClientToServerEvents
    trackedListenEvent:keyof ServerToClientEvents
    emitData:any
    eventDataCallBack?:Function
    transitionCompletedCallback?:Function
  }

  const [isPending,startTransition] = useTransition()
  const transitionCompleteCallback = useRef<Function>(()=>null)
  const prevIsPending = useRef(false)
  const [hasTransitionCompleted,setHasTransitionCompleted] = useState(false)

  //this only listens to one asyncEmit per hook instance, if you use multiple at the same time
  //the wrong async emit could be listened
  useEffect(()=>{
    if (prevIsPending.current && !isPending){
      transitionCompleteCallback.current()
      transitionCompleteCallback.current = ()=>null
      setHasTransitionCompleted(true)
    }
    prevIsPending.current = isPending
  },[isPending])

  const asyncEmit = ({
    eventName,
    trackedListenEvent,
    emitData,
    eventDataCallBack,
    transitionCompletedCallback
  }:AsyncEmitProps)=>new Promise((resolve,reject)=>{
    socket?.emit(eventName,emitData)
    setHasTransitionCompleted(false)

    if(transitionCompletedCallback) transitionCompleteCallback.current = transitionCompletedCallback

    prevIsPending.current = false

    socket?.on(trackedListenEvent,(data:any):void=>{
      startTransition(()=>{
        eventDataCallBack?.(data)
      })
      socket?.off(trackedListenEvent)
      resolve(data)
    })
    
    setTimeout(reject, 5000);
  })

  return {
    asyncEmit,
    hasTransitionCompleted,
    transitionPending:isPending
  }
}

type UseActivateResponseHandlersProps = {implActions:boolean}
export const useActivateResponseHandlers=({implActions}:UseActivateResponseHandlersProps={implActions:false})=>{
  const {socket,setCurrentActions,currentActions,turnCount} = useGameStateContext() || {}
  const {players: allPlayers, currentPlayer} = usePlayerContext() || {}
  const {asyncEmit,hasTransitionCompleted} = useAsyncEmitSocketEvent()
  const players = getNonLostPlayers(allPlayers ?? [])
  const {discardCards,allowedUserActionsRestrictions} = useGameActions()

  const [noResponses, setNoResponses] = useState<{username:string}[]>([])
  const [allowedUsers, setAllowedUsers] = useState<string[]>([])

  const turnPlayer = players[(turnCount??0) % (players?.length ?? 1)]

  //refresh game state when hand is made
  useEffect(()=>{
    socket?.emit('refresh-game-state')
  },[])

  const {actions} = useCardActions()

  //when all users respond with "no responses", perform all actions in currentActions stack
  //this will mostly be a bunch of nopes cancelling each other out and on other action at the bottom
  useEffect(()=>{
    //if all players that can respond respond with no response, implement all actions in "chain"
    const startChain = async () =>{
      if(
        noResponses.length>=(allowedUsers?.length || 0) 
        && currentActions?.length
        && implActions
        && turnPlayer
      ){
        //implement action and start chain
        actions[currentActions[currentActions.length-1]]()
      }
    }
    startChain()
    
  },[noResponses?.length,allowedUsers?.length])

  const [actionComplete,setActionComplete] = useState(false)

  useEffect(()=>{
    if(!(socket?.id && implActions)) return

    //set actionComplete true to trigger useEffect that has access to current version of state
    socket?.on('action-complete',()=>{
      setActionComplete(true)
    })
  },[socket?.id])

  useEffect(()=>{
    const removeCompletedAction = async ()=>{
      if(!currentActions?.length) return 
  
      if(actionComplete){
        await asyncEmit({
          eventName:'current-actions',
          trackedListenEvent:'current-actions',
          emitData:currentActions?.slice(0,currentActions.length-1) ?? [],
          eventDataCallBack: (data:Actions[])=>{
            if(setCurrentActions)setCurrentActions(data)
            setActionComplete(false)
          },
        })
      }
    }
    removeCompletedAction()

  },[actionComplete])

  //wait until slicing recent action state change is complete to start next one
  useEffect(()=>{
    const implementNextAction = async ()=>{
      if(!hasTransitionCompleted) return 

      if(!currentActions?.length) {
        socket?.emit('allowed-users',[])
        socket?.emit('no-response',[])
        return
      }
      actions[currentActions[currentActions.length-1]]()
    }

    implementNextAction()

  },[hasTransitionCompleted])


  useEffect(()=>{
    if(!socket?.id || !currentPlayer) return
    //if action is allow, add action to current action "chain"
    socket?.on('activate-attempt',(data)=>{
      if(!setCurrentActions) return

      setCurrentActions(data.actions)
      setNoResponses([])
      //useEffect on action hook that sets a context var that it's complete
      //set response restrictions
      setAllowedUsers(data.newAllowedUsers)
    })

    socket?.on('no-response',(data)=>{
      setNoResponses(data)
    })

    socket?.on('allowed-users',(data)=>{
      setAllowedUsers(data)
    })

    return ()=>{
      socket?.off('activate-attempt')
      socket?.off('no-response')
      socket?.off('allowed-users')
    }
  },[socket?.id,currentPlayer?.username])

  useEffect(()=>{
    if(!socket) return
    socket?.on('refresh-game-state',(data)=>{
      setNoResponses(data.noResponses)
      setAllowedUsers(data.allowedUsers)
    })
  },[socket])


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

    if(action && isObjKey(action,allowedUserActionsRestrictions)){
      newAllowedUsers = allowedUserActionsRestrictions[action]
    }
    
    //add to gameActions hooks
    if(action === actionTypes.exploding){
      newAllowedUsers = currentPlayer?.username?[currentPlayer.username]:[]
    }
    if(action === actionTypes.diffuse){
      newAllowedUsers = []
    }
    discardCards(cards,cardId,cardType)

    socket?.emit('activate-attempt',{
      actions:[...(currentActions ?? []),...(action?[action]:[])],
      newAllowedUsers
    })
  }

  //send no response if no card to respond to current action
  const sendNoResponse = (username?:string)=>{
    if(!username) {
      console.error('username not found in send response')
      return
    }
    socket?.emit('no-response',[...noResponses,{
      username
    }])
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
    for (let player of newPlayers || []){
      const hand:Card[] = []
      const diffuseCard:Card | undefined = diffuseCards.pop()

      if (diffuseCard) hand.push(diffuseCard)

      for(let i = hand.length; i<handSize; i++){
        const newCard = initialDeck.pop()
        if(newCard) hand.push(newCard)
      }

      player.cards = hand
      
    }
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
    socket.on('attack-turns',data=>{
      if(setAttackTurns)setAttackTurns(data)
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