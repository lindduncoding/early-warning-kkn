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

  const anomalies = []
  const thresholds = {
    hujanLebat: { tcc: 90 },   
    kemarauPanjang: { hu: 70 } 
  }

  for (const curr of sorted) {
    const desc = curr.weather_desc.toLowerCase()

    // --- CATEGORY 1: Hujan Lebat ---
    if (curr.tcc > thresholds.hujanLebat.tcc && /(berawan|kabur|hujan)/.test(desc)) {
      anomalies.push({
        datetime: curr.datetime,
        description: curr.weather_desc,
        category: "Hujan Lebat",
        details: {
          tcc: curr.tcc,
          hu: curr.hu
        }
      })
      continue
    }

    // --- CATEGORY 2: Kemarau Panjang ---
    if (curr.hu < thresholds.kemarauPanjang.hu && /cerah/.test(desc)) {
      anomalies.push({
        datetime: curr.datetime,
        description: curr.weather_desc,
        category: "Kemarau Panjang",
        details: {
          tcc: curr.tcc,
          hu: curr.hu
        }
      })
    }
  }

  return anomalies
}


async function sendMessages(phoneNumbers, text) {
  try {
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
      })
      const data = await response.json();
      console.log(`Sent to ${phone}:`, data)
    }
  } catch (err) {
    console.error(err)
  }
}

export async function checkAndNotifyAnomalies(phoneNumbers, DBHandle) {
  const anomalies = await getAnomalousWeather(DBHandle)

  const today = new Date().toISOString().slice(0, 10)
  const categoryMessages = []

  for (const anomaly of anomalies) {
    const dateStr = new Date(anomaly.datetime).toISOString().slice(0, 10)
    if (dateStr !== today) continue

    const time = new Date(anomaly.datetime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

    const date = new Date(anomaly.datetime).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    let messageText = `Pada ${date} pukul ${time}, terdeteksi kategori *${anomaly.category}* (${anomaly.description})`
    
    // Add detail info if available
    if (anomaly.details) {
      if (anomaly.category === "Hujan Lebat") {
        messageText += ` dengan tutupan awan ${anomaly.details.tcc}% dan kelembapan ${anomaly.details.hu}%`
      } else if (anomaly.category === "Kemarau Panjang") {
        messageText += ` dengan kelembapan ${anomaly.details.hu}%`
      }
    }

    categoryMessages.push(messageText)
  }

  // Send final message
  if (categoryMessages.length > 0) {
    const fullMessage = 
      `Peringatan Cuaca Krandegan (BMKG):\n\n${categoryMessages.join('\n')}\n\n` +
      `Info lebih lengkap: https://www.bmkg.go.id/cuaca/potensi-cuaca-ekstrem`

    await sendMessages(phoneNumbers, fullMessage)
  } else {
    await sendMessages(phoneNumbers, "Hari ini tidak ada potensi hujan lebat atau kemarau panjang yang terdeteksi.")
  }
}