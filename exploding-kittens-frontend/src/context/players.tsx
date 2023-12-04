'use client'
import React,{ createContext,useContext, useState } from "react";

type PlayerContextValues ={
  currentPlayer:User | null
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  setCurrentPlayer: React.Dispatch<React.SetStateAction<User | null>>
}

export const PlayerContext = createContext<PlayerContextValues | null>(null)

export const PlayerContextProvider = ({children}:{
  children: React.ReactNode
})=>{
  const [players, setPlayers]= useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer]= useState<User | null>(null)
  return (
    <PlayerContext.Provider
      value={{
        players,
        currentPlayer,
        setPlayers,
        setCurrentPlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayerContext = () => useContext(PlayerContext)