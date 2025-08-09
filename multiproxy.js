const express = require('express');
const axios = require('axios');
const cors = require('cors');
const qs = require('qs');

const app = express();

// --- Konfigurasi ---
const PORT = 31401;

// --- Konfigurasi Notifikasi Telegram (GANTI DENGAN MILIK ANDA) ---
const TELEGRAM_BOT_TOKEN = '8311357854:AAHSnR0IGV146rR9BcpPK1NzGohny82qF3A'; // <-- GANTI INI
const TELEGRAM_CHAT_ID = '7890743177';   // <-- GANTI INI

// --- Daftar server target untuk rotasi ---
const TARGET_NODES = [
  'http://113.176.102.87:31401',
  'http://14.241.120.142:31401',
  'http://113.160.156.51:31401',
];

// --- Variabel untuk menyimpan state rotasi ---
let currentNodeIndex = 0;
let currentTargetNode = TARGET_NODES[currentNodeIndex];

// --- Logic untuk rotasi server setiap 2 detik ---
setInterval(() => {
  currentNodeIndex = (currentNodeIndex + 1) % TARGET_NODES.length;
  currentTargetNode = TARGET_NODES[currentNodeIndex];
  console.log(`[ROTATION] Target server diubah ke: ${currentTargetNode}`);
}, 1000);

// --- BARU: Fungsi untuk mengirim notifikasi ke Telegram ---
async function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[TELEGRAM] Bot Token atau Chat ID belum diatur. Melewatkan notifikasi.');
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown', // Agar bisa format tebal, miring, dll.
    });
    console.log('[TELEGRAM] Notifikasi berhasil dikirim.');
  } catch (error) {
    console.error('[TELEGRAM ERROR] Gagal mengirim notifikasi:', error.response?.data || error.message);
  }
}

// --- Middleware ---
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Logic Reverse Proxy Utama ---
app.use(async (req, res) => {
  const activeTargetNode = currentTargetNode; 
  const targetUrl = activeTargetNode + req.originalUrl;
  const proxyBaseUrl = `${req.protocol}://${req.get('host')}`;

  console.log(`[PROXY] Meneruskan ${req.method} ${req.originalUrl} -> ${targetUrl}`);

  try {
    const headers = { ...req.headers };
    delete headers.host;

    let dataToSend;
    if (req.method === 'POST' && req.is('application/x-www-form-urlencoded')) {
        dataToSend = qs.stringify(req.body); 
    } else {
        dataToSend = req.body;
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: dataToSend,
      responseType: 'text',
      transformResponse: [(data) => data],
    });

    let responseBody = response.data;
    const contentType = response.headers['content-type'];
    
    // --- BARU: Logic untuk mengirim notifikasi jika transaksi sukses ---
    // Cek apakah ini adalah pengiriman transaksi yang berhasil
    if (req.method === 'POST' && req.originalUrl === '/transactions' && response.status === 200) {
      try {
        const txInfo = JSON.parse(responseBody);
        if (txInfo.hash && txInfo.source_account) {
          const message = `✅ *Transaksi Berhasil Dikirim*\n\n` +
                          `*Hash:* \`${txInfo.hash}\`\n` +
                          `*Akun Sumber:* \`${txInfo.source_account}\`\n` +
                          `*Node:* ${activeTargetNode}`;
          
          // Kirim notifikasi tanpa menunggu (fire-and-forget) agar tidak memperlambat respons ke client
          sendTelegramNotification(message);
        }
      } catch (e) {
        console.warn('[NOTIF PARSE ERROR] Gagal mem-parsing respons transaksi untuk notifikasi.');
      }
    }

    if (responseBody && contentType && contentType.includes('application/json')) {
      const targetRegex = new RegExp(activeTargetNode, 'g');
      responseBody = responseBody.replace(targetRegex, proxyBaseUrl);
    }

    Object.keys(response.headers).forEach((key) => {
      res.setHeader(key, response.headers[key]);
    });
    
    res.status(response.status).send(responseBody);

  } catch (err) {
    if (err.response) {
      console.error(`[PROXY ERROR] Target server (${activeTargetNode}) merespons dengan status ${err.response.status}:`, err.response.data);
      res.status(err.response.status).send(err.response.data);
    } else if (err.request) {
      console.error(`[PROXY ERROR] Tidak bisa terhubung ke ${targetUrl}:`, err.message);
      res.status(502).send({ error: 'Bad Gateway', message: `Tidak dapat terhubung ke server target di ${activeTargetNode}` });
    } else {
      console.error('[PROXY ERROR] Kesalahan internal:', err.message);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Reverse proxy berjalan di http://localhost:${PORT}`);
  console.log(`Memulai dengan target: ${currentTargetNode}`);
  console.log(`Target akan dirotasi setiap 1 detik di antara:`, TARGET_NODES);
});
