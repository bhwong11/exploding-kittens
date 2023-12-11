"use client"
import {
  useActivateResponseHandlers,
} from "@/lib/hooks"
import { useGameActions } from "@/lib/actions"
import { usePlayerContext } from "@/context/players"
import { actionTypes } from "@/data"
import { useEffect } from "react"

const ResponseAction = ()=>{
  const {
    currentPlayer,
    players
  } = usePlayerContext() || {}
  const {validResponseCards} =  useGameActions() || {}

  const {
    attemptActivate,
    showResponsePrompt,
    sendNoResponse,
    currentActions,
    noResponses
  } = useActivateResponseHandlers({initListeners:true})

  const responseCardClickHandler = (card:Card)=>{
    const cardAction = Object.values(actionTypes).find(aType=>aType === card.type)
    if(!cardAction) return
    attemptActivate(cardAction,[card])
  }


  return (
      <div className="w-full">
        <h1>
          TEST Hook(To get this to work, you need to have 2 joined users with different usernames)
          {JSON.stringify(currentActions)} no response:{noResponses} valid response cards:{JSON.stringify(validResponseCards)}
        </h1>
        <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.favor)}>
          Test action: favor
        </button>
        {showResponsePrompt && (
          <div className="bg-pink-300">
          {validResponseCards.length?(
          <>
            would you like to activate any of the following cards in response?:
          </>):
          (<>
            You have no cards to respond, click no response when ready
          </>)
          }

          {validResponseCards.map(card=>(
            <div key={`response-action-${card.id}`}>
              <button className="btn btn-blue" onClick={()=>responseCardClickHandler(card)}>
                {card.type} 
              </button>
            </div>)
          )}
            
          {/* <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.nope)}>
            send nope
          </button>
          <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.diffuse)}>
            send diffuse
          </button> */}
          <button className="btn btn-blue" onClick={()=>sendNoResponse()}>
            no response
          </button>
          </div>
        )}
      </div>
  )
}

export default ResponseAction