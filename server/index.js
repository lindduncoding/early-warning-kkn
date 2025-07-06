import cron from 'node-cron'
import Express from 'express'
import DataRouter from './api/data.js'
import * as DB from './data/mongoDBController.js'
import * as Anomaly from './data/helper.js'

const DBHandle = DB.getDBHandle('BMKG')
const app = new Express()

// Fetch, insert, and calculate anomaly (if any)
async function main(){
  const weatherArray = await Anomaly.fetchUrl('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=33.12.18.2006')
  await DB.insertWeatherData(DBHandle, weatherArray)
  const anomalies = await Anomaly.getAnomalousWeather(DBHandle)
  console.log(anomalies)
}

// Schedule API
cron.schedule('0 * * * *', () => {
  console.log('Service is running every hour')
  main()
})

// Attach router
app.use('/data', DataRouter)

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})