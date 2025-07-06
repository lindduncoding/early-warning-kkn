import Express from 'express'
import * as DB from '../data/mongoDBController.js'
import * as Anomaly from '../data/helper.js'

const DBHandle = DB.getDBHandle('BMKG')
const router = new Express.Router()

router.get('/weather', async (req, res) => {
  // Get summarized array
  const summarized = await DB.getSummarizedWeather(DBHandle)
  res.json(summarized)
})

router.get('/anomaly', async(req, res) => {
  // Get anomaly data
  const anomaly = await Anomaly.getAnomalousWeather(DBHandle)
  if (anomaly){
    res.json(anomaly)
  } else {
    res.status(404).json({
      anomaly: false,
      message: 'No anomaly, all good!'
    })
  }
})

export default router