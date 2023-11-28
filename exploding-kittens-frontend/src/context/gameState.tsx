'use client'
import React,{ createContext, useContext, useState } from "react";
import { Socket } from "socket.io-client";

type GameStateContextValues ={
  deck: Card[],
  discardPile: Card[],
  turnCount: number,
  currentActions:Actions[],
  socket:Socket<ServerToClientEvents, ClientToServerEvents> | null,
  setSocket: React.Dispatch<React.SetStateAction<Socket<ServerToClientEvents, ClientToServerEvents> | null>>,
  setDeck: React.Dispatch<React.SetStateAction<Card[]>>
  setDiscardPile: React.Dispatch<React.SetStateAction<Card[]>>
  setTurnCount: React.Dispatch<React.SetStateAction<number>>
  setCurrentActions: React.Dispatch<React.SetStateAction<Actions[]>>
}

export const GameStateContext = createContext<GameStateContextValues | null>(null)

export const GameStateContextProvider = ({children}:{
  children: React.ReactNode
})=>{
  const [deck, setDeck]= useState<Card[]>([])
  const [discardPile, setDiscardPile]= useState<Card[]>([])
  const [turnCount, setTurnCount]= useState<number>(0)
  const [currentActions, setCurrentActions]= useState<Actions[]>([])
  const [socket, setSocket]= useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)

  return (
    <GameStateContext.Provider
      value={{
        deck,
        discardPile,
        turnCount,
        currentActions,
        socket,
        setSocket,
        setDeck,
        setDiscardPile,
        setTurnCount,
        setCurrentActions
      }}
    >
      {children}
    </GameStateContext.Provider>
  )
}

export const useGameStateContext = () => useContext(GameStateContext)