

export default `#graphql
type Card {
  id:Int,
  color: String,
  image: String,
  type: String
}

type NoResponse {
  username: String
}

type Player {
  username:String,
  active: Boolean,
  lose: Boolean,
  cards:[Card]
}
type Room {
  roomNumber: Int,
  users:[User],
  players:[Player],
  deck:[Card],
  discardPile:[Card],
  turnCount: Int,
  attackTurns:Int,
  currentActions:[String],
  noResponses:[NoResponse],
  allowedUsers:[String],
  actionPromptIndex: Int,
  createdAt: String
  updatedAt: String
}
type User {
  _id:ID
  username: String
  email: String
  wins: Int
  rooms:[Room]
  createdAt: String
  updatedAt: String
}

input UpdateUserInput {
  username: String
  email: String
  wins: Int
  rooms:[String]
}

type UserWithRanking {
  _id:ID
  username: String
  email: String
  wins: Int
  rooms:[Room]
  createdAt: String
  updatedAt: String
}

type UserWithRankingResponse {
  fromCache: Boolean,
  results:[UserWithRanking]
}

type Query {
  getUser (username: String!): User,
  getUsersWithRanking: UserWithRankingResponse,
}

type Mutation {
  updateUser (username: String!,updateUserInput:UpdateUserInput): User
}
`