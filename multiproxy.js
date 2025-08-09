const express = require('express');
const axios = require('axios');
const cors = require('cors');
const qs = require('qs');

const app = express();

// --- Konfigurasi ---
const PORT = 31401; // Port tempat proxy ini berjalan

// --- BARU: Daftar server target untuk rotasi ---
// Ganti dengan daftar server Horizon Anda yang sebenarnya
const TARGET_NODES = [
  'http://113.176.102.87:31401',
  'http://14.241.120.142:31401', // Contoh node lain (ganti dengan node Anda)
  'http://113.160.156.51:31401',       // Contoh node lain (ganti dengan node Anda)
];

// --- BARU: Variabel untuk menyimpan state rotasi ---
let currentNodeIndex = 0;
let currentTargetNode = TARGET_NODES[currentNodeIndex]; // Node yang aktif saat ini

// --- BARU: Logic untuk rotasi server setiap 1 detik ---
setInterval(() => {
  // Pindah ke index berikutnya, kembali ke 0 jika sudah di akhir daftar
  currentNodeIndex = (currentNodeIndex + 1) % TARGET_NODES.length;
  currentTargetNode = TARGET_NODES[currentNodeIndex];
  console.log(`[ROTATION] Target server diubah ke: ${currentTargetNode}`);
}, 1000); // 1000 milidetik = 1 detik

// --- Middleware ---
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Logic Reverse Proxy Utama ---
app.use(async (req, res) => {
  // --- DIPERBARUI: Gunakan node yang aktif saat ini ---
  // Kita simpan ke variabel lokal agar konsisten selama satu request
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
    
    if (responseBody && contentType && contentType.includes('application/json')) {
      // --- DIPERBARUI: Gunakan URL node yang aktif untuk rewrite ---
      const targetRegex = new RegExp(activeTargetNode, 'g');
      responseBody = responseBody.replace(targetRegex, proxyBaseUrl);
      console.log(`[PROXY] Menulis ulang URL di respons JSON.`);
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
      // --- DIPERBARUI: Pesan error yang lebih dinamis ---
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
  console.log(`Target akan dirotasi setiap 2 detik di antara:`, TARGET_NODES);
});
