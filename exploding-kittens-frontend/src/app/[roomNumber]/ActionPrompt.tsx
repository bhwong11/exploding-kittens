import React,{ useEffect, useState } from "react"
import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext} from "@/context/players"
import { usePlayerSocket } from "@/lib/hooks"


const ActionPrompt = ()=>{
  const {actionPrompt,socket,setActionPrompt} = useGameStateContext() || {}
  const {currentPlayer} = usePlayerContext() || {}
  const [responseCount,setResponseCount] = useState<number>(0)
  const [previousSubmitData,setPreviousSubmitData] = useState<{[key:string]:any}>({})
  const {isAllPlayersActive} = usePlayerSocket()

  const currentActionPrompt = actionPrompt?.[responseCount]?.(previousSubmitData)


  useEffect(()=>{
    if(!socket) return
    socket?.on('next-action-response',(data)=>{
      if(data.formObject)setPreviousSubmitData(data.formObject)
      setResponseCount(data.actionPromptIndex)
      if(data.complete){
        setResponseCount(0)
        setPreviousSubmitData({})
        if(setActionPrompt)setActionPrompt(null)
      }
    })
    socket.on('refresh-game-state',data=>{
      setResponseCount(data.actionPromptIndex)
      if(data.actionPromptFormObject)setPreviousSubmitData(data.actionPromptFormObject)
    })
  },[socket])

  return currentActionPrompt && currentActionPrompt?.showToUser===currentPlayer?.username && (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
  
    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="flex flex-col items-center rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg py-5">
        
        {!isAllPlayersActive && (
          <div className="bg-red-300">
            Not all players active game paused
          </div>
        )}

        <form className="flex flex-col w-fit" onSubmit={(e)=>{
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          currentActionPrompt?.submitCallBack(formData)
        }}>
          <p className="action-prompt-text">{currentActionPrompt?.text}</p>
          {Object.entries(currentActionPrompt?.options ?? {}).map(([name,options],idx)=>(
            <React.Fragment key={`options-${name}-${idx}`}>
              <label htmlFor={name} className="font-semibold mb-1">
                {name}:
              </label>
              <select id={name} name={name} className="mb-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                {options?.map(option=>(
                  <option key={`option-${option.value}`} value={option.value}>{option.display}</option>
                ))}
              </select>
            </React.Fragment>
          ))}

          <button type="submit" className="btn btn-blue" disabled={!isAllPlayersActive}>Submit/Confirm</button>
        </form>
        </div>
      </div>
    </div>
  </div>
  
  )

}

export default ActionPrompt