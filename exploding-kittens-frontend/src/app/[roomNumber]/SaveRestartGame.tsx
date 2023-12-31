"use client"
import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext } from "@/context/players"
import { useState, useEffect } from "react"

const SaveRefreshGame = ()=>{
  const {socket} =  useGameStateContext() || {}
  const { currentPlayer, players } = usePlayerContext() || {}

  const [saving,setSaving]=useState<boolean>(false)
  const [refreshing,setRefreshing]=useState<boolean>(false)
  const [error,setError]=useState<string>('')

  const isJoinedRoom = !!players?.find(player=>player.username==currentPlayer?.username)

  useEffect(()=>{
    if(!socket?.id) return
    socket?.on('save-room',(data)=>{
      console.log('save-room',data)
      setSaving(false)
      if(!data.success){
        setError(data.message)
      }
    })

    socket?.on('get-saved-room',(data)=>{
      console.log('get-saved-room',data)
      setRefreshing(false)
      if(!data.success){
        setError(data.message)
      }
    })

    socket?.on('refresh-game-state',()=>{
      setRefreshing(false)
    })
  },[socket?.id])

  const saveRoom = ()=>{
    socket?.emit('save-room')
    setSaving(true)
  }

  const refreshRoom = () =>{
    socket?.emit('get-saved-room')
    setRefreshing(true)
  }


  return (
    isJoinedRoom &&
      <div className="w-fit">
        <button onClick={saveRoom} className="btn btn-blue">
            {saving?"saving":"save room"}
        </button>
        <button onClick={refreshRoom} className="btn btn-blue">
            {refreshing?"refreshing room":"refresh from saved room"}
        </button>
        {error && <div className="bg-red-300">
          {JSON.stringify(error)}
        </div>}
      </div>
  )
}

export default SaveRefreshGame