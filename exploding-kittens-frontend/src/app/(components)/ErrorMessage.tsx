import { useGameStateContext } from "@/context/gameState"
import { useEffect, useState } from "react"

type ErrorMessageProps = {
  message?:string
}
export const ErrorMessage = ({
  message=""
}:ErrorMessageProps)=>{
  const {socket} = useGameStateContext() || {}
  const [errorMessage,setErrorMessage]=useState("")
  const [showError,setShowError]=useState(false)

  useEffect(()=>{
    if(!socket) return
    socket.on('error',(data)=>{
      setErrorMessage(data.message)
      if(!message){
        setShowError(true)
      }
    })
  },[socket])

  return showError && (
    <div className="bg-red-100 text-red-500">
      {message}
      {!message && errorMessage}
      <button onClick={()=>setShowError(false)}>
        X
      </button>
    </div>
  )
}