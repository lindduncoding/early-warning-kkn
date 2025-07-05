import cron from 'node-cron'
import Express from 'express'
import * as DB from './data/mongoDBController.js'

const DBHandle = DB.getDBHandle('BMKG')
const app = new Express()

async function fetchUrl(url){
    const response = await fetch(url)
    const body = await response.json()
    const weatherData = body['data']
    const weather = weatherData[0].cuaca[0]

    return weather
}

// Fetch and insert to MongoDB instance
async function main(){
  const data = await fetchUrl('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=33.12.18.2006')
  // console.log(data)
  await DB.insertWeatherData(DBHandle, data)
}

main()

// Schedule API
// cron.schedule('0 */3 * * *', () => {
//   main()
// })

// Start the server
// app.listen(3000, () => {
//   console.log('Server is running on port 3000')
// })