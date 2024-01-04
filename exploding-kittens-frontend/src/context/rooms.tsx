'use client'
import React, { createContext, useContext, useState } from 'react'

type RoomsContextValues = {
  rooms: Room[]
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>
}

export const RoomsContext = createContext<RoomsContextValues | null>(null)

export const RoomsContextProvider = ({children}:{children: React.ReactNode}) => {
  const [rooms, setRooms] = useState<Room[]>([])
  return (
    <RoomsContext.Provider
      value={{
        rooms, 
        setRooms
      }}
    >
      {children}
    </RoomsContext.Provider>
  )
}

export const useRoomsContext = () => useContext(RoomsContext)