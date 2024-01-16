import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import db from './db/db.connection.js'
import routes from './routes/index.js'
import { generateRoutes } from './helpers/index.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4';
import resolvers from './graphql/resolvers.js'
import typeDefs from './graphql/typeDefs.js'
import { initalizeSocketEvents } from './socket/index.js'

dotenv.config()

const app = express()
const server = http.createServer(app)
const port = 3000

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

await apolloServer.start();

//socket.io
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

app.use(cors({
  credentials: true,
  origin: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/', async (req, res) => {
  let collection = db.collection("posts");
  let results = await collection.find({})
    .limit(50)
    .toArray()
  res.send(results).status(200)
})

app.use('/graphql', cors(),express.json(), expressMiddleware(apolloServer));

generateRoutes(routes,app)

db.once('connected', () => {
  console.log('DB connected')
})

initalizeSocketEvents()

server.listen(port, () => {
  console.log(`listening on port ${port}`)
})
