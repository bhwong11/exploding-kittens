"use client"
import {useEffect, useState } from "react"
import { usePlayerContext } from "@/context/players"
import { useGameStateContext } from "@/context/gameState"
import {
  useActivateResponseHandlers,
  useInitGame,
  useTurns,
  usePlayerSocket 
} from "@/lib/hooks"
import { actionTypes } from "@/data"

const ResponseAction = ()=>{

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