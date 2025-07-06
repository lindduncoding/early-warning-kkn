import { MongoClient, ServerApiVersion } from 'mongodb'
import dotenv from 'dotenv'

// Read .env file
dotenv.config()

// Retrieve from .env file
const DB_USER = process.env.DB_USER ?? 'username'
const DB_PASS = process.env.DB_PASS ?? 'password'
const DB_URL = process.env.DB_URL ?? 'user.mongodb.net'

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_URL}/?retryWrites=true&w=majority&appName=ewskkn`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

// Return a database handle for use with queries
export function getDBHandle (dbName) {
  return client.db(dbName)
}

// Insertion
export async function insertWeatherData (DBHandle, weatherObject) {
  try {
    const result = await DBHandle.collection('cuaca').insertMany(weatherObject)
    console.log(`Inserted ${result.insertedCount} documents`)
  } catch (err){
    console.error('Error at: ', err)
  }
}

// Get summarized weather data
export async function getSummarizedWeather (DBHandle) {
  try {
    const weather = await DBHandle.collection('cuaca')
      .find({})
      .project({ datetime: 1, t: 1, tcc: 1, hu: 1, weather_desc: 1, _id: 0 })
      .toArray()
    return weather
  } catch (err) {
    console.error('Error at: ', err)
  }
}