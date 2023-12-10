"use client"
import {
  useActivateResponseHandlers,
} from "@/lib/hooks"
import { useGameActions } from "@/lib/actions"
import { usePlayerContext } from "@/context/players"
import { actionTypes,responseActionsTypes } from "@/data"

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


  return (
      <div className="w-full">
        <h1>
          TEST Hook(To get this to work, you need to have 2 joined users with different usernames)
          {JSON.stringify(currentActions)} no response:{noResponses}
        </h1>
        {JSON.stringify(validResponseCards)}
        <button className="btn btn-blue" onClick={()=>attemptActivate(actionTypes.favor)}>
          Test action: favor
        </button>
        {showResponsePrompt && (
          <div>
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