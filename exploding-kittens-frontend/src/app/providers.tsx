'use client'
import { PlayerContextProvider } from '@/context/players'
import { GameStateContextProvider } from '@/context/gameState'
import { RoomsContextProvider } from '@/context/rooms'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from 'react';

const Providers = ({ children }: { children: React.ReactNode })=> {
  const [client] = useState(new QueryClient());

  return (
        <QueryClientProvider client={client}>
          <PlayerContextProvider>
            <GameStateContextProvider>
              <RoomsContextProvider>
              {children}
              <ReactQueryDevtools/>
              </RoomsContextProvider>
            </GameStateContextProvider>
          </PlayerContextProvider>
        </QueryClientProvider>
  );
}

export default Providers