import * as DB from './mongoDBController.js'

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

    return { 
      total: data.length, 
      anomalies 
    }}