'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export const RoomList = () => {
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    const findRooms = async () => {
      await fetch('http://localhost:3000/rooms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(res => res.json())
      .then((data: Room[]) => {
        console.log(data)
        setRooms(data)
      })
    }
    if (rooms.length < 1) findRooms()
  }, [])

  return (
    <section>
      <ul className="border">
        { rooms.length > 0 ? rooms.map(room => {
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