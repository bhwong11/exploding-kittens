import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useActivateResponseHandlers, useTurns, usePlayerSocket } from "@/lib/hooks"
import { useGameActions } from "@/lib/actions"
import { useState, useEffect,lazy, Suspense,memo, useRef} from "react"
import classNames from 'classnames'
import { actionTypes } from "@/data"
import { isDevMode } from "@/lib/helpers"
import { zoomTime } from "../../../tailwind.config"
import CardInfo from "@/app/[roomNumber]/CardInfo"

const ResponseAction = lazy(()=>import("@/app/[roomNumber]/ResponseAction"))
const ActionPrompt = lazy(()=>import("@/app/[roomNumber]/ActionPrompt"))


type MultiCardActionsType = {
  [key: number]: Actions
}

interface DisplayCard extends Card {
  className: string
}

const multiCardActions:MultiCardActionsType = {
  2:actionTypes.multiple2,
  3:actionTypes.multiple3
}

const Hand = ()=>{
  const {players,currentPlayer} =  usePlayerContext() || {}
  const {socket,turnCount,attackTurns} =  useGameStateContext() || {}

  const [selectedCards,setSelectedCards]=useState<Card[]>([])
  const [cardsDisplay,setCardsDisplay]=useState<DisplayCard[]>([])
  const [allowedResponseUsers,setAllowedResponseUsers] = useState<string[]>([])

  const {endTurn, turnPlayer, isTurnEnd} = useTurns({initListeners:true})
  const {attemptActivate} = useActivateResponseHandlers()
  const {isActionValidFromCards,validResponseCards} = useGameActions()
  const {isAllPlayersActive} = usePlayerSocket()

  const isPlayerTurn = turnPlayer?.username ===currentPlayer?.username && !!turnPlayer
  const singleCardActionType = Object.values(actionTypes).find(aType=>aType===selectedCards[0]?.type)
  const currentCards = players?.find(p=>p.username===currentPlayer?.username)?.cards

  useEffect(()=>{
    setSelectedCards([])
  },[turnCount])

  //used to highlight cards on response action
  useEffect(()=>{
    if(!allowedResponseUsers.includes(currentPlayer?.username || '')) return
    setSelectedCards(validResponseCards)
  },[allowedResponseUsers])

  //if card is discarded, unselect it
  useEffect(()=>{
    setSelectedCards(selectedCards.filter(card=>((currentCards?.map(c=>c.id) ?? []).includes(card.id))))
  },[currentCards?.length])

  const displayAnimationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(()=>{
    const removedCardsIdMap: {[key: number]: DisplayCard} = cardsDisplay
      ?.filter(dCard=>!currentCards?.find(cCard=>dCard.id===cCard.id))
      ?.reduce((all,next)=>({...all,[next.id]:next}),{})

    const newCardsDisplay = cardsDisplay?.map(card=>removedCardsIdMap?.[card.id] ? {...card,className:"animate-zoomOut"} : card) || []
    setCardsDisplay(newCardsDisplay)
    if(!cardsDisplay?.length) setCardsDisplay(currentCards?.map(card=>({...card,className:''})) ?? [])
    //case when 2 changes before happen
    if(displayAnimationTimeout.current) clearTimeout(displayAnimationTimeout.current)
    displayAnimationTimeout.current = setTimeout(()=>{ 
      setCardsDisplay(currentCards?.map(card=>({...card,className:''})) ?? []) 
    },zoomTime*1000)

  },[currentCards?.map(card=>card.id).join('')])

  useEffect(()=>{
    if(!socket) return
    socket?.on('activate-attempt',(data)=>{
      setSelectedCards([])
      setAllowedResponseUsers(data.newAllowedUsers)
    })
    socket?.on('no-response',()=>{
      setSelectedCards([])
    })
    return ()=>{
      socket?.disconnect();
    }
  },[socket])

  const disableActions = (
    !isActionValidFromCards(selectedCards)
    || !isPlayerTurn
    || !isAllPlayersActive
    //disable if not at least 2 players
    || (players?.length || 0)<=1
  )

  const cardActivateHandler = ()=>{
    if(!socket) return
    const multiCardAction = multiCardActions[selectedCards.length]
    if(multiCardAction){
      attemptActivate(multiCardAction,selectedCards)
    }

    if(selectedCards.length===1 && singleCardActionType){
      attemptActivate(singleCardActionType,selectedCards)
    }
    setSelectedCards([])
  }

  const toggleSelected = (card:Card)=>{
    if(selectedCards.find(c=>card.id===c.id)){
      setSelectedCards(prev=>prev.filter(c=>card.id!==c.id))
    }else{
      setSelectedCards(prev=>[...prev,card])
    }
  }

  const cardOnClickHandler = (card:Card)=>{
    if(!isPlayerTurn) return
    toggleSelected(card)
  }

  return (
  <div>
    hand:
    <div className="flex flex-wrap gap-1">
      {cardsDisplay?.map(card=>(
        <div
          key={`card-${card.id}`}
          className={classNames(
            `hand-card border border-black w-[10rem] break-words animate-zoomIn`,
            {"border-2 border-blue-500":selectedCards.find(c=>card.id===c.id)},
            {[card.className]:true}
          )}
          onClick={()=>cardOnClickHandler(card)}
        >
          {/* {JSON.stringify(card)} */}
          <CardInfo card={card}/>
        </div>
      ))}
    </div>
    <div className="border border-black">

      {!isAllPlayersActive && (
        <div className="bg-red-300">
          Not all players active game paused
        </div>
      )}

      {isDevMode && (
        <div>
          all players active: {JSON.stringify(isAllPlayersActive)}
        </div>
        )
      }

      <p>turn count: {turnCount}</p>
      <p>attack: {attackTurns}</p>
      <p>turn player: {turnPlayer?.username}</p>
      <button className="btn btn-blue" onClick={cardActivateHandler} disabled={disableActions}>
        activate card(s)
      </button>
      <button className="btn btn-blue" onClick={()=>endTurn()} disabled={isTurnEnd || !isPlayerTurn}>
        end turn
      </button>
      {!!currentCards?.length && 
        <Suspense fallback={null}>
          <ResponseAction/>
          <ActionPrompt/>
        </Suspense>
      }
    </div>
  </div>
  )
}

export default memo(Hand)