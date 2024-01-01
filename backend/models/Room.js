import mongoose from 'mongoose'

const { Schema } = mongoose

const cardTypes = [
  'attack', 
  'cat-beard',
  'cat-melon',
  'cat-potatoe',
  'cat-rainbow',
  'cat-taco',
  'diffuse',
  'exploding',
  'favor',
  'nope',
  'see-the-future',
  'shuffle', 
  'skip'
]

//schemas that are only used as sub scehmas
const cardSchema = new Schema({
  id:Number,
  color: String,
  image: String,
  type: { "type": String, "enum": cardTypes }
}, { _id : false })

const noResponseSchema = new Schema({
  username: String
}, { _id : false })

const playerSchema = new Schema({
  username:String,
  active: Boolean,
  lose: Boolean,
  cards:[
    cardSchema
  ]
}, { _id : false })

const roomSchema = new Schema({
  roomNumber: { type: String, required: true },
  users:[
    {type: Schema.Types.ObjectId, ref: 'User'}
  ],
  players:[
    playerSchema
  ],
  deck:[
    cardSchema
  ],
  discardPile:[
    cardSchema
  ],
  turnCount: Number,
  attackTurns:Number,
  //current action data
  currentActions:[String],
  noResponses:[noResponseSchema],
  allowedUsers:[String],
  //action prompt Data
  actionPromptFormObject: Schema.Types.Mixed,
  actionPromptIndex: Number,
  //need to add game state data to save
},{ timestamps: true });

const Room = mongoose.model('Room', roomSchema);

export default Room