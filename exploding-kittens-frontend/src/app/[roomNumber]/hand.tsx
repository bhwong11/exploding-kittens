import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import { useActivateResponseHandlers } from "@/lib/hooks"
import { useEffect, useState } from "react"
import classNames from 'classnames'
import { actionTypes } from "@/data"

const multiCardActions = [null,null,actionTypes.multiple2,actionTypes.multiple3]

export const Hand = ()=>{
  const {players,currentPlayer} =  usePlayerContext() || {}
  const {discardPile,socket} =  useGameStateContext() || {}
  const [selectedCards,setSelectedCards]=useState<Card[]>([])
  const {attemptActivate} = useActivateResponseHandlers({initListeners:false})

  const disableActions = (
    !selectedCards.length || 
    !multiCardActions[selectedCards.length] 
    || (new Set(selectedCards.map(c=>c.type)).size === 1)
  )

  const cardActivateHandler = ()=>{
    if(!socket) return
    const multiCardAction = multiCardActions[selectedCards.length]
    if(multiCardAction){
      if((new Set(selectedCards.map(c=>c.type)).size === 1)){
        attemptActivate(multiCardAction)
      }else{
        socket?.emit('error','cards are not consistent')
      }
      return
    }
    const cardActionType = Object.values(actionTypes).find(aType=>aType===selectedCards[0]?.type)

    if(selectedCards.length<=1 && cardActionType){
      attemptActivate(cardActionType)
    }
    socket.emit('discard-pile',[...selectedCards,...(discardPile ?? [])])
  }

  const toggleSelected = (card:Card)=>{
    if(selectedCards.find(c=>card.id===c.id)){
      setSelectedCards(prev=>prev.filter(c=>card.id!==c.id))
    }else{
      setSelectedCards(prev=>[...prev,card])
    }
  }

  const currentCards = players?.find(p=>p.username===currentPlayer?.username)?.cards
  return (
  <div>
    <div className="flex flex-wrap">
      hand:
      {currentCards?.map(card=>(
        <div
          className={classNames(
            "hand-card border border-black w-[10rem] break-words",
            {"border-2 border-blue-500":selectedCards.find(c=>card.id===c.id)}
          )}
          key={card?.id}
          onClick={()=>toggleSelected(card)}
        >
          {JSON.stringify(card)}
        </div>
      ))}
    </div>
    <button className="btn btn-blue" onClick={cardActivateHandler} disabled={disableActions}>
      activate cards
    </button>
  </div>
  )
}