import { usePlayerContext } from "@/context/players";

const OtherPlayers = ()=>{
  const {players, currentPlayer} = usePlayerContext() || {}
  return(
    <div>
      Other Players
      {players
        ?.filter((player: Player) => player.username !== currentPlayer?.username)
        .map(player=>(
        <div className="border border-black" key={player.username}>
          <div className="flex items-center">
          {player.username}:&nbsp;
          {player?.active?
            <div className="rounded-full bg-green-400 h-3 w-3"/>
            :<div className="rounded-full border-2 border-grey-500 bg-grey-100 h-3 w-3"/>
          }
          </div>
          <div>
            number of cards: {player?.cards?.length ?? 0}
          </div>
          <div>
            lost: {JSON.stringify(player?.lose)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default OtherPlayers