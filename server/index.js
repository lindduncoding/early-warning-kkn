import cron from 'node-cron'
import Express from 'express'
import DataRouter from './api/data.js'
import AuthorizeRouter from './api/authorize.js'
import * as DB from './data/mongoDBController.js'
import * as Anomaly from './data/helper.js'

const DBHandle = DB.getDBHandle('BMKG')
const app = new Express()
const phones = process.env.PHONES.split(',').map(p => p.trim())

// Fetch, insert, calculate and broadcast anomaly (if any)
async function main(){
  const weatherArray = await Anomaly.fetchUrl('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=33.12.18.2006')
  await DB.upsertWeatherData(DBHandle, weatherArray)
  Anomaly.checkAndNotifyAnomalies(phones, DBHandle)
}

// Schedule API
cron.schedule('0 */8 * * *', () => {
  console.log('Service is running every 8 hour')
  main()
})

// Attach router
app.use('/data', DataRouter)
app.use('/api', AuthorizeRouter)

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})