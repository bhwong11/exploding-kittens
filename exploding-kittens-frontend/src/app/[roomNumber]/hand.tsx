import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useActivateResponseHandlers, useTurns } from "@/lib/hooks"
import { useState } from "react"
import classNames from 'classnames'
import { actionTypes } from "@/data"
import ResponsePrompt from "@/app/[roomNumber]/ResponsePrompt"

type MultiCardActionsType = {
  [key: number]: Actions
}

const multiCardActions:MultiCardActionsType = {
  2:actionTypes.multiple2,
  3:actionTypes.multiple3
}

export const Hand = ()=>{
  const {players,currentPlayer} =  usePlayerContext() || {}
  const {socket,turnCount} =  useGameStateContext() || {}
  const [selectedCards,setSelectedCards]=useState<Card[]>([])
  const {endTurn, turnPlayer, isTurnEnd} = useTurns({initListeners:true})
  const {attemptActivate} = useActivateResponseHandlers({initListeners:false})


  const isPlayerTurn = turnPlayer?.username ===currentPlayer?.username && !!turnPlayer
  const singleCardActionType = Object.values(actionTypes).find(aType=>aType===selectedCards[0]?.type)
  const isSelectedCardsSameType = new Set(selectedCards.map(c=>c.type)).size === 1

  const disableActions = (
    !selectedCards.length
    || (!multiCardActions[selectedCards.length] && selectedCards.length>1)
    || !isSelectedCardsSameType
    || (!singleCardActionType && selectedCards.length===1)
    || !isPlayerTurn
  )

  const cardActivateHandler = ()=>{
    if(!socket) return
    const multiCardAction = multiCardActions[selectedCards.length]
    if(multiCardAction){
      attemptActivate(multiCardAction,selectedCards)
      return
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

  const currentCards = players?.find(p=>p.username===currentPlayer?.username)?.cards
  return (
  <div>
    hand:
    <div className="flex flex-wrap">
      {currentCards?.map(card=>(
        <div
          className={classNames(
            "hand-card border border-black w-[10rem] break-words",
            {"border-2 border-blue-500":selectedCards.find(c=>card.id===c.id)}
          )}
          key={card?.id}
          onClick={()=>cardOnClickHandler(card)}
        >
          {JSON.stringify(card)}
        </div>
      ))}
    </div>
    <div className="border border-black">
      <p>turn count: {turnCount}</p>
      <p>turn player: {turnPlayer?.username}</p>
      <button className="btn btn-blue" onClick={cardActivateHandler} disabled={disableActions}>
        activate card(s)
      </button>
      <button className="btn btn-blue" onClick={()=>endTurn()} disabled={isTurnEnd || !isPlayerTurn}>
        end turn
      </button>
      <ResponsePrompt/>
    </div>
  </div>
  )
}