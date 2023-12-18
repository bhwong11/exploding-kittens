import React,{ useEffect, useState } from "react"
import { useTurns } from "@/lib/hooks"
import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext} from "@/context/players"


const ActionPrompt = ()=>{
  const {actionPrompt,socket,setActionPrompt} = useGameStateContext() || {}
  const {turnPlayer} = useTurns()
  const {currentPlayer} = usePlayerContext() || {}
  const [responseCount,setResponseCount] = useState<number>(0)
  const [customOptions,setCustomOptions] = useState<ActionPromptData["options"]>({})
  const [customText,setCustomText] = useState<string>('')
  const [showToUser, setShowToUser] = useState<string>('')

  const currentActionPrompt = actionPrompt?.[responseCount]

  useEffect(()=>{
    setShowToUser(turnPlayer?.username ?? '')
  },[!!actionPrompt])


  useEffect(()=>{
    if(!socket) return
    socket?.on('next-action-response',(data)=>{
      if(data.customOptions)setCustomOptions(data.customOptions)
      if(data.customText)setCustomText(data.customText)
      setShowToUser(data.showToUser)
      setResponseCount(prev=>prev+1)
      if(data.complete){
        setShowToUser('')
        setCustomOptions({})
        setCustomText('')
        setResponseCount(0)
        if(setActionPrompt)setActionPrompt(null)
      }
    })
  },[socket])

  return currentActionPrompt && showToUser===currentPlayer?.username && (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
  
    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="flex flex-col items-center rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <form  className="flex flex-col w-fit" onSubmit={(e)=>{
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          currentActionPrompt?.submitCallBack(formData)
        }}>
          <p className="action-prompt-text">{currentActionPrompt?.text}</p>
          <p className="action-prompt-text">{customText}</p>
          {Object.entries(currentActionPrompt?.options ?? {}).map(([name,options])=>(
            <React.Fragment key={`options-${name}`}>
              <label htmlFor={name}>{name}:</label>
              <select id={name} name={name}>
                {options?.map(option=>(
                  <option key={`option-${option.value}`} value={option.value}>{option.display}</option>
                ))}
              </select>
            </React.Fragment>
          ))}

          {Object.entries(customOptions ?? {}).map(([name,options])=>(
            <React.Fragment key={`options-${name}`}>
              <label htmlFor={name}>{name}:</label>
              <select id={name} name={name}>
                {options?.map(option=>(
                  <option key={`option-${option.value}`} value={option.value}>{option.display}</option>
                ))}
              </select>
            </React.Fragment>
          ))}

          <button type="submit" className="btn btn-blue">Submit/Confirm</button>
        </form>
        </div>
      </div>
    </div>
  </div>
  
  )

}

export default ActionPrompt