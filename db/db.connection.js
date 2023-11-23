// import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config()

// const connString = process.env.DB_URI;

// mongoose.connect(connString);
// const db = mongoose.connection;

// export default db;


import { MongoClient } from 'mongodb';


const connectionString = process.env.DB_URI || "";

const client = new MongoClient(connectionString);
let conn;
try {
  conn = await client.connect();
} catch(e) {
  console.error(e);
}

let db = conn.db('exploding-kittens');
export default db;