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
    allowedResponse,
    showResponsePrompt,
    sendNoResponse,
    currentActions,
    noResponses
  } = useActivateResponseHandlers({initListeners:true})

  //automatically
  useEffect(()=>{
    if(showResponsePrompt && !validResponseCards.length){
      sendNoResponse()
    }
  },[showResponsePrompt])


  return (
      <div className="w-full">
        <h1>
          TEST Hook(To get this to work, you need to have 2 joined users with different usernames)
          {JSON.stringify(currentActions)} no response:{noResponses} valid response cards:{JSON.stringify(validResponseCards)}
        </h1>
        <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.favor)}>
          Test action: favor
        </button>
        {showResponsePrompt && validResponseCards.length && (
          <div className="bg-pink-300">
            would you like to activate any of the following cards in response?: 
          {validResponseCards.map(card=>(
            <div>
              {card.type}
            </div>)
          )}
            
          <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.nope)}>
            send nope {JSON.stringify(allowedResponse)}
          </button>
          <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.diffuse)}>
            send diffuse {JSON.stringify(allowedResponse)}
          </button>
          <button className="btn btn-blue" onClick={()=>sendNoResponse()}>
            no response
          </button>
          </div>
        )}
      </div>
  )
}

export default ResponseAction