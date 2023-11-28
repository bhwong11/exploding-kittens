import { actionTypes } from "@/data/index"
import { cardTypes } from "@/data/index"
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
    type: typeof cardTypes[keyof typeof cardTypes]["type"]
  }
  type Actions = typeof actionTypes[keyof typeof actionTypes]
  type ResponseActions = Actions["nope"] | Actions["diffuse"]
  type Player = {
    username: string
    lose: boolean
    cards: Card[]
  }
  //socket.io event types
  interface ServerToClientEvents {
    ['new-page-backend']: (arg:{message:string}) => void
    ['activate-attempt']: (arg:{
      action:Actions,
      allowedResponse: ResponseActions,
      allowedUsers: string[]
    }) => void
    ['no-response']: () => void
    ['new-player']: (arg:{
      username:string
    }) => void
  }
  
  interface ClientToServerEvents {
    ['new-page']: (arg:{message:string}) => void
    ['new-player']: (arg:{username:string}) => void
    ['activate-attempt']: (arg:{
      action:Actions | null,
      allowedResponse: ResponseActions,
      allowedUsers: string[]
    }) => void
    ['no-response']: () => void
  }
}