import { useRoomsContext } from '@/context/rooms'
import { useRoomSocket } from '@/lib/hooks'
import Link from 'next/link'

export const RoomList = () => {
  useRoomSocket()
  const { rooms } = useRoomsContext() || {}

  return (
    <section>
      <ul className="border">
        { (rooms && rooms.length > 0) ? rooms.map(room => {
          return (
            <li key={room._id} className="border p-3">
              <Link href={"/" + room.roomNumber}>
              <div>
                Room:&nbsp;
                  {room.roomNumber}
              </div>
              <p>Players: {room.users?.length}</p>
              </Link>
            </li>
          )
      }) : <li></li>}
      </ul>
    </section>
  )
}