'use client'
import React,{ createContext, useState } from "react";

//seperate out into types files
export type Player = {
  username: string
}

type PlayerContextValues ={
  players: Player[],
  setPlayers: React.Dispatch<React.SetStateAction< Player[]>>
}

export const PlayerContext = createContext<PlayerContextValues | null>(null)

export const PlayerContextProvider = ({children}:{
  children: React.ReactNode
})=>{
  const [players, setPlayers]= useState<Player[]>([])
  return (
    <PlayerContext.Provider
      value={{
        players,
        setPlayers
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}