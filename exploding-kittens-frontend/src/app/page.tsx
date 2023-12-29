import Image from 'next/image'
import { RoomList } from './RoomList'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      HOME!
      
      //stuff we need to do
      homepage - unatuhenciated, leaderboard
      rooms page - authenticated route
      room - first person in is host, create assets button.
      game Over - disable everything save wins to users
      disable create game assets once created
      add READ.ME
      <RoomList />
    </main>
  )
}
