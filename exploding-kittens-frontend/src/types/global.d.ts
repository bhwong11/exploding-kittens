export {}

declare global{
  type cardTypesConst = typeof import('../data/index').cardTypes
  type actionTypesConst = typeof import('../data/index').actionTypes
  type actionsWithPromptsConst = typeof import('../data/index').actionWithPrompts
  type User = {
    wins?: number
    rooms?: []
    _id?: string
    id?: number
    username?: string,
    ranking?:number
  }
  type Room = {
    _id?: string
    roomNumber?: string
    createdAt?: string
    updatedAt?: string
    users?: Player[]
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
    isOwner:boolean,
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
  type updatedUserBody = {
    username?:string
    email?:string
    password?:string
    wins?:number
    rooms?:string[]
  }
  
  type UpdateUserByUsernameProps = {
    username:string,
    updateUserInput:updatedUserBody
  }

  type usersWithRankingCache = {
    fromCache: boolean,
    results: User[]
  }
  //socket.io event types
  interface ServerToClientEvents {
    ['new-page-backend']: (arg:{message:string}) => void
    ['activate-attempt']: (arg:{
      actions:Actions[],
      newAllowedUsers: string[],
    }) => void
    ['current-actions']: (arg:Actions[]) => void
    ['no-response']: (arg:{username:string}[]) => void
    ['refresh-game-state']: (arg:{  
      deck: Card[],
      discardPile: Card[],
      turnCount: number,
      currentActions:Actions[],
      noResponses:{username:string}[],
      allowedUsers:string[],
      actionPromptFormObject:{[key:string]:any},
      actionPromptIndex:number,
      attackTurns: number,
    }) => void
    ['action-complete']:() => void
    ['get-saved-room']:(arg:{
      success:string
      message:string
    }) => void
    ['save-room']:(arg:{
      success:string
      message:string
    }) => void
    ['allowed-users']:(arg:string[]) => void
    ['action-prompt']:(arg:ActionsWithPromptsConst[number]) => void
    ['clear-current-actions']:() => void
    ['new-player']: (arg:{username:string}) => void
    ['all-players']: (arg:Player[]) => void
    ['deck']: (arg:Card[]) => void
    ['error']: (arg:{message:string}) => void
    ['turn-count']: (arg:number) => void
    ['attack-turns']: (arg:number) => void
    ['discard-pile']: (arg:Card[]) => void
    ['next-action-response']: (arg:{
      actionPromptIndex:number,
      formObject:{[key:string]:any}
      complete:boolean
    }) => void
    ['new-room']: (arg:Room) => void
  }
  
  interface ClientToServerEvents {
    ['new-page']: (arg:{message:string}) => void
    ['new-player']: (arg:{username:string}) => void
    ['new-owner']: (arg:{username:string}) => void
    ['all-players']: (arg:Player[]) => void
    ['activate-attempt']: (arg:{
      actions:Actions[],
      newAllowedUsers: string[],
    }) => void
    ['current-actions']: (arg:Actions[]) => void
    ['no-response']: (arg:{username:string}[]) => void
    ['allowed-users']:(arg:string[]) => void
    ['clear-players']: () => void
    ['leave-room']: (arg:{username?:string}) => void
    ['clear-game-state']: () => void
    ['refresh-game-state']:() => void
    ['action-complete']:() => void
    ['save-room']:() => void
    ['get-saved-room']:() => void
    ['action-prompt']:(arg:ActionsWithPromptsConst[number]) => void
    ['clear-current-actions']:() => void
    ['deck']: (arg:Card[]) => void
    ['error']: (arg:string) => void
    ['turn-count']: (arg:number) => void
    ['attack-turns']: (arg:number) => void
    ['discard-pile']: (arg:Card[]) => void
    ['next-action-response']: (arg:{
      formObject:{[key:string]:any}
      complete:boolean
    }) => void
    ['new-room']: (arg:Room) => void
  }
}