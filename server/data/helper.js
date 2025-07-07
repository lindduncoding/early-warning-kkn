import * as DB from './mongoDBController.js'
import dotenv from 'dotenv'

// Read .env file
dotenv.config()

// Retrieve from .env file
const ID = process.env.ID ?? 'id'
const SESS_ID = process.env.SESS_ID ?? 'session'

export async function fetchUrl(url){
    const response = await fetch(url)
    const body = await response.json()
    const weatherData = body['data']
    const weather = weatherData[0].cuaca
    const flatCuaca = weather.flat()

    return flatCuaca
}

export async function getAnomalousWeather(DBHandle) {
  const data = await DB.getSummarizedWeather(DBHandle)
  const sorted = [...data].sort((a, b) => new Date(a.datetime) - new Date(b.datetime))

  // Detect sudden changes
  const thresholds = { t: 4, tcc: 30, hu: 20 }
  const features = ['t', 'tcc', 'hu']
  const anomalies = []

  for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const changes = {}

      for (const f of features) {
        const diff = Math.abs(curr[f] - prev[f])
        const isAnomaly = diff > thresholds[f]

        if (isAnomaly) {
          changes[f] = {
            change: +(curr[f] - prev[f]).toFixed(1),
            threshold: thresholds[f],
            isAnomaly
          }
        }
      }

      if (Object.keys(changes).length > 0) {
        anomalies.push({
          datetime: curr.datetime,
          description: curr.weather_desc,
          deltas: changes
        })
      }
    }

  return anomalies
}

async function sendMessages(phoneNumbers, text) {
  for (const phone of phoneNumbers) {
    const response = await fetch('https://api-zawa.azickri.com/message', {
      method: 'POST',
      headers: {
        "id": ID,
        "session-id": SESS_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "phone": phone,
        "type": "text",
        "text": text // dynamic message
      })
    });

    const data = await response.json();
    console.log(`Sent to ${phone}:`, data);
  }
}

export async function checkAndNotifyAnomalies(phoneNumbers, DBHandle) {
  const anomalies = await getAnomalousWeather(DBHandle)

  if (anomalies.length === 0) {
    console.log("No anomalies detected")
    return
  }

  const today = new Date().toISOString().slice(0, 10) 
  const messages = []

  for (const anomaly of anomalies) {
  const { datetime, description, deltas } = anomaly
  const dateStr = new Date(datetime).toISOString().slice(0, 10)

  if (dateStr !== today) continue

  const [paramKey] = Object.keys(deltas)
  const { change, threshold } = deltas[paramKey]

  const messageText = `Pada ${datetime}, diprediksi ${description}, karena perubahan ekstrim pada ${paramKey} sebesar ${change} (normal: ${threshold})`
  messages.push(messageText)
  }

  if (messages.length > 0) {
    const fullMessage = `Anomali cuaca Krandegan terdeteksi hari ini:\n\n${messages.join('\n')}`
    await sendMessages(phoneNumbers, fullMessage)
  }
}