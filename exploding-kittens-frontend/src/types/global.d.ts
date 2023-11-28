export {}

declare global{
  type User = {
    wins?: number
    rooms?: []
    _id?: string
    id?: number
    username?: string
  }
  type Card = {
    id:number
    color: string
    image: string
    type: typeof import("@/data/index").cardTypes[keyof typeof import("@/data/index").cardTypes]
  }
  type Actions = typeof import("@/data/index").actionTypes[keyof typeof import("@/data/index").actionTypes]
  type Player = {
    username: string
    loss: boolean
    cards: Card[]
  }
  //socket.io event types
  interface ServerToClientEvents {
    ['new-page-backend']: (arg:{message:string}) => void;
  }
  
  interface ClientToServerEvents {
    ['new-page']: (arg:{message:string}) => void;
    ['new-player']: (arg:{username:string}) => void;
  }
}