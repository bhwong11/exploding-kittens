import { usePlayerContext } from "@/context/players"

export const Hand = ()=>{
  const {players,currentPlayerUsername} =  usePlayerContext() || {}
  const currentCards = players?.find(p=>p.username===currentPlayerUsername)?.cards
  return (
  <div className="flex flex-wrap">
    hand:
    {currentCards?.map(card=>(
      <div className="hand-card border border-black w-[10rem] break-words" key={card.id}>
        {JSON.stringify(card)}
      </div>
    ))}
  </div>
  )
}