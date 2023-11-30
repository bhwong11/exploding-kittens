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
  type CardType = typeof cardTypes[keyof typeof cardTypes]["type"]
  type Card = {
    id:number
    color: string
    image: string
    type: CardType
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
      newAllowedResponse: ResponseActions,
      newAllowedUsers: string[],
      allowedResponse: ResponseActions,
      allowedUsers: string[]
    }) => void
    ['no-response']: () => void
    ['new-player']: (arg:{
      username:string
    }) => void
    ['all-players']: (arg:Player[]) => void
    ['deck']: (arg:Card[]) => void
  }
  
  interface ClientToServerEvents {
    ['new-page']: (arg:{message:string}) => void
    ['new-player']: (arg:{username:string}) => void
    ['all-players']: (arg:Player[]) => void
    ['activate-attempt']: (arg:{
      action:Actions | null,
      newAllowedResponse: ResponseActions,
      newAllowedUsers: string[],
      allowedResponse: ResponseActions,
      allowedUsers: string[]
    }) => void
    ['no-response']: () => void
    ['clear-players']: () => void
    ['deck']: (arg:Card[]) => void
  }
}