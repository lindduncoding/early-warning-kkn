
# Weather Anomaly Detection & Notification System

This project fetches weather forecast data, detects specific **weather anomalies**, and sends **WhatsApp notifications** to subscribed users via the **Zawa API**.
It is designed for localized weather monitoring (example: *Krandegan*) and uses **BMKG forecast data**.

---

## 🚀 Features

* **Automatic hourly weather fetching** from database.
* **Category-based anomaly detection**:

  * **Heavy Rain (Hujan Lebat)** → High cloud coverage beyond threshold **and** weather description contains `berawan`, `kabut`, or `hujan`.
  * **Prolonged Drought (Kemarau Panjang)** → Humidity below threshold **and** description contains `cerah`.
* **Real-time WhatsApp notifications** using the **Zawa API**.
* **Message aggregation** → Multiple anomalies in one day are combined into a single message to avoid spam.
* **MongoDB upsert** support → New data is inserted, old records are updated automatically.
* **.env support** → Phone numbers and API credentials are stored securely.

---

## 📂 Project Structure

```
.
├── src/
│   ├── routes/              # API routes (QR connect, authorization, etc.)
│   ├── services/            # Weather anomaly detection & notification logic
│   ├── db/                  # MongoDB database helpers
│   ├── utils/               # Helper functions
│   └── index.js              # App entry point
├── .env                      # Environment variables (not committed to GitHub)
├── package.json
└── README.md
```

---

## ⚙️ How It Works

1. **Data Fetching**
   The system queries the latest summarized weather data from MongoDB every hour.
   It also receives **updates to past data** and uses MongoDB's `updateOne(..., { upsert: true })` to insert or update records.

2. **Anomaly Detection**
   The detection logic is **category-based**:

   * **Heavy Rain**:

     ```js
     tcc > cloudThreshold && /(berawan|kabut|hujan)/i.test(description)
     ```
   * **Prolonged Drought**:

     ```js
     hu < humidityThreshold && /cerah/i.test(description)
     ```

3. **Notification**
   If anomalies match **today’s date**, a WhatsApp message is prepared:

   ```
   Peringatan Cuaca Krandegan (BMKG):

   Pada Senin, 11 Agustus 2025 pukul 15:00, terdeteksi kategori *Hujan Lebat* (Hujan Ringan) dengan tutupan awan 85% dan kelembapan 92%.

   Info lebih lengkap: https://www.bmkg.go.id/cuaca/potensi-cuaca-ekstrem
   ```

   If no anomalies are detected:

   ```
   Hari ini tidak ada potensi hujan lebat atau kemarau panjang yang terdeteksi.
   ```

4. **Message Delivery**
   Uses the **Zawa API** to send messages to phone numbers stored in `.env`.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
DB_USER=mongo_user
DB_PASS=mongo_password
DB_URL=mongo_db_uri
ID=ZAWA_ID
SESS_ID=ZAWA_SESS_ID
PHONES=list_of_subscribers_phone_numbers
```

---

## 📡 API Endpoints

### `GET /api/daftar`

Authorizes and registers the current Zawa session.

### `GET /api/hubungkan`

Fetches a **QR code** (base64) from Zawa API and returns it as an image.

### `GET /api/ulang`

Retries the registration process

### `GET /api/hapus`

Deletes the current session

More info at Zawa's ![documentation.](https://azickri.gitbook.io/zawa)

---

## 🛠 Installation

```bash
git clone https://github.com/lindduncoding/early-warning-kkn.git
cd weather-anomaly-notifier
npm install
```

---

## ▶️ Running the Project

```bash
node server/index.js

# or for always on deploymeny
nohup node server/index.js > output.log 2>&1 &
```

The app will:

1. Fetch the latest weather data.
2. Detect anomalies.
3. Send WhatsApp notifications.

It does this every 8 hours

---

## 🧪 Example Output

### **With Anomaly**

```
Peringatan Cuaca Krandegan (BMKG):

Pada Senin, 11 Agustus 2025 pukul 15:00, terdeteksi kategori *Hujan Lebat* (Hujan Ringan) dengan tutupan awan 85% dan kelembapan 92%.

Info lebih lengkap: https://www.bmkg.go.id/cuaca/potensi-cuaca-ekstrem
```

### **Without Anomaly**

```
Hari ini tidak ada potensi hujan lebat atau kemarau panjang yang terdeteksi.
```

---
