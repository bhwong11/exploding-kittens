import { Socket } from "socket.io-client";

export const shuffleArray =  (arr:any[])=>{
  return arr.sort(() => Math.random() - 0.5)
}

export const removeCardsFromHand = (
  socket:Socket<ServerToClientEvents, ClientToServerEvents> | null | undefined,
  cards: Card[],
  playerUsername:string | undefined,
  players: Player[] | undefined
)=>{
  if(!playerUsername || !players || !socket){
    console.error('missing playerUsername or players')
    return
  }
  const playerIndex = players?.findIndex(p=>p.username === playerUsername)
  const cardIds = cards.map(c=>c.id)

  const newPlayerHand = players?.[playerIndex]
    ?.cards.filter(c=>!cardIds.includes(c.id)) ?? []

  const playersCopy = [...players ?? []]
  playersCopy[playerIndex].cards = newPlayerHand

  socket.emit('all-players',playersCopy)
}

export const addCardsToHand = (
  socket:Socket<ServerToClientEvents, ClientToServerEvents> | null | undefined,
  cards: Card[],
  playerUsername:string | undefined,
  players: Player[] | undefined
)=>{
  if(!playerUsername || !players || !socket){
    console.error('missing playerUsername or players')
    return
  }
  const playerIndex = players?.findIndex(p=>p.username === playerUsername)

  const newPlayerHand = [
    ...players?.[playerIndex]?.cards ?? []
    ,...cards
  ]

  const playersCopy = [...players ?? []]
  playersCopy[playerIndex].cards = newPlayerHand

  socket.emit('all-players',playersCopy)
}

export const getNonLostPlayers = (players:Player[])=>(
  players.filter(p=>!p.lose)
)

export const authenticate = async () => {
  console.log('auth')
  return await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })
  .then(res => res.json())
  .then((user: User) => {
    console.log('user:', user)
    return user
  })
}

export const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'