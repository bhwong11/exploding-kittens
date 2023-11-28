'use client'
import React,{ createContext,useContext, useState } from "react";

type PlayerContextValues ={
  currentPlayerUsername:string | null
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  setCurrentPlayerUsername: React.Dispatch<React.SetStateAction<string | null>>
}

export const PlayerContext = createContext<PlayerContextValues | null>(null)

export const PlayerContextProvider = ({children}:{
  children: React.ReactNode
})=>{
  const [players, setPlayers]= useState<Player[]>([])
  const [currentPlayerUsername, setCurrentPlayerUsername]= useState<string | null>(null)
  return (
    <PlayerContext.Provider
      value={{
        players,
        currentPlayerUsername,
        setPlayers,
        setCurrentPlayerUsername,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayerContext = () => useContext(PlayerContext)