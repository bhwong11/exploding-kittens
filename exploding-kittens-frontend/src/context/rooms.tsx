'use client'
import React, { createContext, useContext, useState } from 'react'
import { Socket } from 'socket.io-client'

type RoomsContextValues = {
  rooms: Room[]
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
  setSocket: React.Dispatch<React.SetStateAction<Socket<ServerToClientEvents, ClientToServerEvents> | null>>
}

export const RoomsContext = createContext<RoomsContextValues | null>(null)

export const RoomsContextProvider = ({children}:{children: React.ReactNode}) => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  
  return (
    <RoomsContext.Provider
      value={{
        rooms, 
        setRooms,
        socket,
        setSocket
      }}
    >
      {children}
    </RoomsContext.Provider>
  )
}

export const useRoomsContext = () => useContext(RoomsContext)