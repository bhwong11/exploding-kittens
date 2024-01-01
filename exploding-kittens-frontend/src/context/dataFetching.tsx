'use client'
import { useGameStateContext } from "@/context/gameState"
import { usePlayerContext } from "@/context/players"

// not in use, since we would also need to send a socket event after to show it all players
// this also will need to update local states like allowedUsers
// to save a refresh saved gamestate 'get-saved-room' and 'save-room' events are used
// leaving here since we can potenitally can change to REST api endpoint for cleaner error handling
export const useFetchToContext = ()=>{
  
  const {
    setAttackTurns,
    setDeck,
    setDiscardPile,
    setTurnCount,
    setCurrentActions
  } = useGameStateContext() || {}

  const {
    setPlayers
  } = usePlayerContext() || {}

  const refreshRoom = (roomNumber:number,onError: Function) => (
    //no caching since we expect game data to change rapidly
    fetch(`process.env.NEXT_PUBLIC_BACKEND_API${roomNumber}/repopulate-room`)
      .then(
        res=>res.json()
      )
      .then(data=>{
        if(setAttackTurns && data.attackTurns) setAttackTurns(data.attackTurns)
        if(setDeck && data.deck)setDeck(data.deck)
        if(setCurrentActions && data.currentActions) setCurrentActions(data.currentActions)
        if(setDiscardPile && data.discardPile) setDiscardPile(data.discardPile)
        if(setTurnCount && data.turnCount) setTurnCount(data.turnCount)
        if(setPlayers && data.players) setPlayers(data.players)
        return data
      })
      .catch(err=>{
        console.error(`error on refresh room fetch ${err}`)
        onError(err)
      })
  )

  const saveRoomData = (roomNumber:number,onError: Function) => (
    //no caching since we expect game data to change rapidly
    fetch(`process.env.NEXT_PUBLIC_BACKEND_API${roomNumber}/save-game`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then(
        res=>res.json()
      )
      .then(data=>{
        return data
      })
      .catch(err=>{
        console.error(`error on saveRoomData fetch ${err}`)
        onError(err)
      })
  )

  return {
    refreshRoom,
    saveRoomData
  }
}