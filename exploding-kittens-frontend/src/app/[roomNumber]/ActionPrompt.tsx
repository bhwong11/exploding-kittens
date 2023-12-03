import { useEffect, useState } from "react"
import { useTurns } from "@/lib/hooks"
import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext} from "@/context/players"


export const ActionPrompt = ()=>{
  const {actionPrompt,socket,setActionPrompt} = useGameStateContext() || {}
  const {turnPlayer} = useTurns()
  const {currentPlayerUsername} = usePlayerContext() || {}
  const [responseCount,setResponseCount] = useState<number>(0)
  const [customOptions,setCustomOptions] = useState<ActionPromptData["options"]>({})
  const [showToUser, setShowToUser] = useState<string>('')

  const currentActionPrompt = actionPrompt?.[responseCount]

  useEffect(()=>{
    setShowToUser(turnPlayer?.username ?? '')
  },[!!actionPrompt])
 
  useEffect(()=>{
    if(!socket) return
    socket?.on('next-action-response',(data)=>{
      if(data.customOptions)setCustomOptions(data.customOptions)
      setShowToUser(data.showToUser)
      setResponseCount(prev=>prev+1)
      if(data.complete){
        setShowToUser('')
        setCustomOptions({})
        setResponseCount(0)
        if(setActionPrompt)setActionPrompt(null)
      }
    })
  },[socket])

  return currentActionPrompt && showToUser===currentPlayerUsername && (
    <form onSubmit={(e)=>{
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      currentActionPrompt?.submitCallBack(formData)
    }}>
      {Object.entries(currentActionPrompt?.options ?? {}).map(([name,options])=>(
        <select key={`select-${name}`} name={name}>
          {options?.map(option=>(
            <option key={`option-${option}`} value={option}>{option}</option>
          ))}
        </select>
      ))}

      {Object.entries(customOptions ?? {}).map(([name,options])=>(
        <select key={`select-${name}`} name={name}>
          {options?.map(option=>(
            <option key={`option-${option}`} value={option}>{option}</option>
          ))}
        </select>
      ))}

      <button type="submit" className="btn btn-blue">Submit Action Response</button>
    </form>
  )

}