"use client"
import {
  useActivateResponseHandlers,
} from "@/lib/hooks"
import { useGameActions } from "@/lib/actions"
import { actionTypes } from "@/data"
import { useGameStateContext } from "@/context/gameState"

const ResponseAction = ()=>{
  const {validResponseCards} =  useGameActions()
  const {currentActions} =  useGameStateContext() || {}

  const {
    attemptActivate,
    showResponsePrompt,
    sendNoResponse,
  } = useActivateResponseHandlers({initListeners:true})

  const responseCardClickHandler = (card:Card)=>{
    const cardAction = Object.values(actionTypes).find(aType=>aType === card.type)
    if(!cardAction) return
    attemptActivate(cardAction,[card])
  }
  const lastAction = currentActions?.[(currentActions?.length ?? 0)-1]


  return (
      <div className="w-full">
        {showResponsePrompt && (
          <div className="bg-pink-300">
          {validResponseCards.length?(
          <>
            would you like to activate any of the following cards in response to "{lastAction}" action?
          </>):
          (<>
            You have no cards to respond, click no response when ready
          </>)
          }

            <div className="flex">
              {validResponseCards.map(card=>(
                <div key={`response-action-${card.id}`} className="border border-black flex flex-col">
                  {card.type} - {card.id}
                  <button className="btn btn-blue" onClick={()=>responseCardClickHandler(card)}>
                    activate
                  </button>
                </div>)
              )}
            </div>
            <div>
              <button className="btn btn-blue" onClick={()=>sendNoResponse()}>
                no response
              </button>
            </div>
          </div>
        )}
      </div>
  )
}

export default ResponseAction