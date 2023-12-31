export const cardTypes = {
  attack:{
    type:'attack',
    images:['/','/','/','/'],
    count: 4,
    color: 'orange'
  },
  catBeard:{
    type:'cat-beard',
    images:['/','/','/','/'],
    count: 4,
    color: 'grey'
  },
  catMelon:{
    type:'cat-melon',
    images:['/','/','/','/'],
    count: 4,
    color: 'grey'
  },
  catPotatoe:{
    type:'cat-potatoe',
    images:['/','/','/','/'],
    count: 4,
    color: 'grey'
  },
  catRainbow:{
    type:'cat-rainbow',
    images:['/','/','/','/'],
    count: 4,
    color: 'grey'
  },
  catTaco:{
    type:'cat-taco',
    images:['/','/','/','/'],
    count: 4,
    color: 'grey'
  },
  diffuse:{
    type:'diffuse',
    images:['/','/','/','/','/','/'],
    count: 6,
    color: 'green'
  },
  exploding:{
    type:'exploding',
    images:['/','/','/','/'],
    count: 4,
    color: 'none'
  },
  favor:{
    type:'favor',
    images:['/','/','/','/'],
    count: 4,
    color: 'black'
  },
  nope:{
    type:'nope',
    images:['/','/','/','/','/'],
    count: 5,
    color: 'red'
  },
  seeTheFuture:{
    type:'see-the-future',
    images:['/','/','/','/','/'],
    count: 5,
    color: 'pink'
  },
  shuffle:{
    type:'shuffle',
    images:['/','/','/','/'],
    count: 4,
    color: 'brown'
  },
  skip:{
    type:'skip',
    images:['/','/','/','/'],
    count: 4,
    color: 'blue'
  },
} as const


export const actionTypes = {
  attack:'attack',
  diffuse:'diffuse',
  exploding:'exploding',
  favor:'favor',
  nope:'nope',
  seeTheFuture:'see-the-future',
  shuffle:'shuffle',
  skip:'skip',
  multiple2:'multiple-2',
  multiple3:'multiple-3',
 } as const

 export const actionWithPrompts =[
  actionTypes.diffuse,
  actionTypes.multiple2,
  actionTypes.multiple3,
  actionTypes.favor,
  actionTypes.seeTheFuture
] as const 

 export const responseActionsTypes = [actionTypes.diffuse,actionTypes.nope] as const

 export const socketEvents = {
  newPageBackend:'new-page-backend'
 } as const