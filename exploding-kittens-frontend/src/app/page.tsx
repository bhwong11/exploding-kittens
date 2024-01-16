'use client'
import { RoomList } from './RoomList'

export default function Home() {
  // will probably move this createRoom function
  // out to another component down the line
  const createRoom = async () => {
    await fetch(process.env.NEXT_PUBLIC_BACKEND_API + '/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
    .then(res => res.json())
    .then((data: Room[]) => {
      console.log('new room', data)
    })
  }

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
      // update players on room card. Bug on create room
      // redirect to new room on create
      // 
      <RoomList />
      <button onClick={createRoom}>Create New Room</button>
    </main>
  )
}
