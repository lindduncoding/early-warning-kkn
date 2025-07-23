import Express from 'express'
import dotenv from 'dotenv'

// Read .env file
dotenv.config()
const router = new Express.Router()

// Retrieve from .env file
const ID = process.env.ID ?? 'id'
const SESS_ID = process.env.SESS_ID ?? 'session'

router.get('/daftar', async (req, res) => {
  // Daftarin sesi ke Zawa
  try {
    const response = await fetch('https://api-zawa.azickri.com/authorize', {
    method: 'POST',
    headers: {
      "Accept": "*/*"
    }
  })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to access resource' })
  }
})

router.get('/hubungkan', async (req, res) => {
  // Ambil QR untuk hubungin ke Zawa
  try {
    const response = await fetch('https://api-zawa.azickri.com/qrcode', {
        method: 'GET',
        headers: {
          "id": ID,
          "session-id": SESS_ID,
          "Accept": "*/*"
        },
    })
    const data = await response.json()
    const base64String = data.qrcode
    const imgBuffer = Buffer.from(base64String, 'base64')

    res.set('Content-Type', 'image/png')
    res.send(imgBuffer)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch or render QR code' })
  }
})

router.get('/ulang', async(req, res) =>{
  try {
  // Hubungkan ulang ketika sesi QR habis
  const response = await fetch('https://api-zawa.azickri.com/authorize', {
    method: 'PUT',
    headers: {
      "id": ID,
      "session-id": SESS_ID,
      "Accept": "*/*"
    },
  })
  const data = await response.json()
  res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to access resource' })
  }
})

router.get('/hapus', async(req, res) =>{
  try {
  const response = await fetch('https://api-zawa.azickri.com/authorize', {
      method: 'DELETE',
      headers: {
        "id": ID,
        "session-id": SESS_ID,
        "Accept": "*/*"
      },
  })
  const data = await response.json()
  res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to access resource' })
  }
})

export default router