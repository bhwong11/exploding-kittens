import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useActivateResponseHandlers, useTurns } from "@/lib/hooks"
import { useGameActions } from "@/lib/actions"
import { useState, useEffect,lazy, Suspense,memo, useTransition } from "react"
import classNames from 'classnames'
import { actionTypes } from "@/data"

const ResponseAction = lazy(()=>import("@/app/[roomNumber]/ResponseAction"))
const ActionPrompt = lazy(()=>import("@/app/[roomNumber]/ActionPrompt"))


type MultiCardActionsType = {
  [key: number]: Actions
}

const multiCardActions:MultiCardActionsType = {
  2:actionTypes.multiple2,
  3:actionTypes.multiple3
}

const Hand = ()=>{
  const {players,currentPlayer} =  usePlayerContext() || {}
  const {socket,turnCount,attackTurns} =  useGameStateContext() || {}
  const [selectedCards,setSelectedCards]=useState<Card[]>([])
  const [allowedResponseUsers,setAllowedResponseUsers] = useState<string[]>([])
  const {endTurn, turnPlayer, isTurnEnd} = useTurns({initListeners:true})
  const {attemptActivate} = useActivateResponseHandlers()
  const {isActionValidFromCards,validResponseCards} = useGameActions()

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
    <div className="flex flex-wrap">
      {currentCards?.map(card=>(
        <div
          key={`card-${card.id}`}
          className={classNames(
            "hand-card border border-black w-[10rem] break-words",
            {"border-2 border-blue-500":selectedCards.find(c=>card.id===c.id)}
          )}
          onClick={()=>cardOnClickHandler(card)}
        >
          {JSON.stringify(card)}
        </div>
      ))}
    </div>
    <div className="border border-black">
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