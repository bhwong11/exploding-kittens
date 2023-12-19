export {}

declare global{
  type cardTypesConst = typeof import('../data/index').cardTypes
  type actionTypesConst = typeof import('../data/index').actionTypes
  type User = {
    wins?: number
    rooms?: []
    _id?: string
    id?: number
    username?: string
  }
  type CardType = cardTypesConst[keyof cardTypesConst]["type"]
  type Card = {
    id:number
    color: string
    image: string
    type: CardType
  }
  type Actions = actionTypesConst[keyof actionTypesConst]
  type ResponseActions = Actions["nope"] | Actions["diffuse"]
  type Player = {
    username: string
    active: boolean,
    lose: boolean
    cards: Card[]
  }
  type ActionPromptData = {
    showToUser?:string
    text?:string
    options:{
      [key:string]:{value:string | number,display:string | number}[]
    }
    submitCallBack: Function
  }
  //socket.io event types
  interface ServerToClientEvents {
    ['new-page-backend']: (arg:{message:string}) => void
    ['activate-attempt']: (arg:{
      action:Actions,
      newAllowedUsers: string[],
      allowedUsers: string[]
    }) => void
    ['no-response']: () => void
    ['new-player']: (arg:{
      username:string
    }) => void
    ['all-players']: (arg:Player[]) => void
    ['deck']: (arg:Card[]) => void
    ['error']: (arg:{message:string}) => void
    ['turn-count']: (arg:number) => void
    ['discard-pile']: (arg:Card[]) => void
    ['next-action-response']: (arg:{
      formObject:{[key:string]:any}
      complete:boolean
    }) => void
  }
  
  interface ClientToServerEvents {
    ['new-page']: (arg:{message:string}) => void
    ['new-player']: (arg:{username:string}) => void
    ['all-players']: (arg:Player[]) => void
    ['activate-attempt']: (arg:{
      action:Actions | null,
      newAllowedUsers: string[],
      allowedUsers: string[]
    }) => void
    ['no-response']: () => void
    ['clear-players']: () => void
    ['deck']: (arg:Card[]) => void
    ['error']: (arg:string) => void
    ['turn-count']: (arg:number) => void
    ['discard-pile']: (arg:Card[]) => void
    ['next-action-response']: (arg:{
      formObject:{[key:string]:any}
      complete:boolean
    }) => void
  }
}