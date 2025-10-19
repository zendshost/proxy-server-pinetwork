# Pi Network Horizon Proxy Server

![Node.js](https://img.shields.io/badge/Node.js-14.x+-brightgreen.svg)
![Lisensi](https://img.shields.io/badge/License-MIT-blue.svg)
![Status Proyek](https://img.shields.io/badge/status-aktif-success.svg)

Solusi reverse proxy yang sederhana namun kuat, dirancang khusus untuk pengembang aplikasi di ekosistem Pi Network. Proyek ini mengatasi masalah umum **CORS (Cross-Origin Resource Sharing)** saat berinteraksi dengan node Horizon Pi dari aplikasi web (frontend), sekaligus menambahkan fitur canggih seperti rotasi node dan notifikasi transaksi.

## 🌟 Latar Belakang & Tujuan

Saat mengembangkan aplikasi web yang berinteraksi langsung dengan Pi Blockchain, pengembang sering kali menghadapi batasan keamanan browser yang disebut Kebijakan Asal yang Sama (Same-Origin Policy). Kebijakan ini mencegah skrip frontend memuat sumber daya dari domain yang berbeda (misalnya, dari `aplikasi-anda.com` ke `node-pi.com`).

**Proxy Server Pi Network** ini bertindak sebagai perantara yang andal:
1.  Aplikasi frontend Anda mengirim permintaan ke server proxy ini.
2.  Server proxy meneruskan permintaan tersebut ke node Horizon Pi yang sebenarnya.
3.  Node Horizon merespons kembali ke proxy.
4.  Proxy menerima respons, secara cerdas menulis ulang URL internal apa pun agar menunjuk kembali ke dirinya sendiri, dan kemudian meneruskannya ke aplikasi frontend Anda.

Dengan cara ini, dari sudut pandang browser, aplikasi Anda hanya berkomunikasi dengan satu domain (domain proxy), sehingga masalah CORS sepenuhnya teratasi.

## ✨ Fitur Utama

Proyek ini menyediakan dua mode operasi, dari yang sederhana hingga yang canggih:

### 1. Mode Proxy Tunggal (`index.js`)
-   **Solusi CORS**: Secara efektif menghilangkan error CORS saat terhubung ke Pi Horizon API.
-   **Penulisan Ulang URL Dinamis**: Secara otomatis mengganti URL node target dalam respons JSON dengan URL proxy, memastikan semua tautan _hypermedia_ (seperti `_links`) berfungsi dengan benar di aplikasi klien Anda.
-   **Ringan & Cepat**: Dibangun dengan Express.js dan Axios untuk performa maksimal dengan jejak minimal.
-   **Mudah Dikonfigurasi**: Cukup ubah dua variabel untuk memulai.

### 2. Mode Multi-Proxy dengan Rotasi (`multiproxy.js`)
-   **Semua Fitur Mode Tunggal**: Mencakup semua keunggulan di atas.
-   **🔄 Rotasi Node Otomatis**: Secara otomatis merotasi permintaan di antara beberapa node target pada interval yang ditentukan. Ini berfungsi sebagai penyeimbang beban (load balancer) sederhana dan mekanisme failover. Jika satu node lambat atau tidak responsif, permintaan berikutnya akan dialihkan ke node lain.
-   **🔔 Notifikasi Transaksi Telegram**: Dapatkan notifikasi _real-time_ ke bot Telegram Anda setiap kali transaksi berhasil dikirim melalui proxy. Sangat berguna untuk memantau aktivitas penting.
-   **Tahan Banting**: Dirancang untuk menjaga aplikasi Anda tetap berjalan bahkan jika salah satu node target sedang down.

---

## 🚀 Memulai

Ikuti langkah-langkah ini untuk menjalankan server proxy di lingkungan lokal atau server Anda.

### Persyaratan
-   [Node.js](https://nodejs.org/) (versi 14.x atau lebih tinggi)
-   [npm](https://www.npmjs.com/) (biasanya terinstal bersama Node.js)
-   `git` (untuk mengkloning repositori)

### Instalasi

1.  **Clone Repositori**
    Buka terminal atau command prompt Anda dan jalankan perintah berikut:
    ```bash
    git clone https://github.com/zendshost/proxy-server-pinetwork.git
    ```

2.  **Masuk ke Direktori Proyek**
    ```bash
    cd proxy-server-pinetwork
    ```

3.  **Instal Dependensi**
    Proyek ini menggunakan beberapa paket npm seperti `express`, `axios`, `cors`, dan `qs`. Instal semuanya dengan satu perintah:
    ```bash
    npm install
    ```

---

## 🛠️ Penggunaan & Konfigurasi

Setelah instalasi selesai, Anda dapat memilih mode proxy mana yang ingin Anda jalankan.

### Opsi 1: Menjalankan Proxy Node Tunggal (`index.js`)

Ini adalah opsi paling sederhana, cocok untuk pengembangan atau jika Anda memiliki satu node andalan.

#### a. Konfigurasi
Buka file `index.js` dan sesuaikan konstanta di bagian atas:
```javascript
// --- Konfigurasi ---
const PORT = 31401; // Port tempat proxy ini akan berjalan
const TARGET_NODE = 'http://203.236.58.84:31401'; // Alamat server Horizon yang dituju
```
-   `PORT`: Ganti `31401` jika port tersebut sudah digunakan di sistem Anda.
-   `TARGET_NODE`: Masukkan URL lengkap dari node Horizon Pi yang ingin Anda gunakan.

#### b. Menjalankan Server
Simpan file dan jalankan dari terminal:
```bash
node index.js
```
Anda akan melihat output:
```
Reverse proxy berjalan di http://localhost:31401
Meneruskan permintaan ke: http://203.236.58.84:31401
```

### Opsi 2: Menjalankan Multi-Proxy dengan Rotasi & Notifikasi (`multiproxy.js`)

Opsi ini sangat direkomendasikan untuk lingkungan produksi untuk meningkatkan keandalan dan mendapatkan wawasan.

#### a. Konfigurasi
Buka file `multiproxy.js` dan konfigurasikan bagian berikut:

```javascript
// --- Konfigurasi ---
const PORT = 31401; // Port tempat proxy ini akan berjalan

// --- Konfigurasi Notifikasi Telegram (WAJIB GANTI) ---
const TELEGRAM_BOT_TOKEN = 'GANTI_DENGAN_TOKEN_BOT_ANDA'; // <-- Ganti dengan token Bot Father
const TELEGRAM_CHAT_ID = 'GANTI_DENGAN_CHAT_ID_ANDA';   // <-- Ganti dengan ID user/grup Anda

// --- Daftar server target untuk rotasi ---
const TARGET_NODES = [
  'http://113.176.102.87:31401',
  'http://113.160.156.51:31401',
  'http://api.mainnet.minepi.com:31401', // Anda bisa menambahkan lebih banyak node
  // 'http://node_lain.com:31401',
];
```
-   `PORT`: Sesuaikan port jika perlu.
-   `TELEGRAM_BOT_TOKEN`: Dapatkan token ini dari [@BotFather](https://t.me/BotFather) di Telegram.
-   `TELEGRAM_CHAT_ID`: Dapatkan ID obrolan Anda dari bot seperti [@userinfobot](https://t.me/userinfobot).
-   `TARGET_NODES`: Tambahkan, hapus, atau ubah daftar URL node Horizon yang ingin Anda rotasi.

#### b. Menjalankan Server
Simpan file dan jalankan dari terminal:
```bash
node multiproxy.js
```
Anda akan melihat output yang menunjukkan bahwa rotasi aktif:
```
Reverse proxy berjalan di http://localhost:31401
Memulai dengan target: http://113.176.102.87:31401
Target akan dirotasi setiap 1 detik di antara: [ 'http://113.176.102.87:31401', 'http://113.160.156.51:31401' ]
```
Setiap detik, Anda akan melihat log `[ROTATION]` yang menunjukkan node target mana yang sedang aktif.

---

## ⚙️ Cara Mengintegrasikan dengan Aplikasi Pi Anda

Setelah server proxy Anda berjalan, mengintegrasikannya ke dalam aplikasi web (frontend) Anda sangatlah mudah.

Cukup ubah URL server Horizon di kode JavaScript Anda dari URL node asli menjadi URL server proxy Anda.

**Contoh menggunakan `pi-stellar-sdk`:**

**SEBELUM:**
```javascript
import { Server } from 'pi-stellar-sdk';

// Terhubung langsung ke node Pi (akan menyebabkan error CORS di browser)
const server = new Server('http://api.mainnet.minepi.com:31401');
```

**SESUDAH:**
```javascript
import { Server } from 'pi-stellar-sdk';

// Terhubung melalui proxy Anda yang sedang berjalan
// Jika proxy berjalan di mesin yang sama, gunakan localhost.
// Jika di server lain, gunakan IP publik atau domain server tersebut.
const server = new Server('http://localhost:31401'); 
// atau const server = new Server('http://IP_SERVER_ANDA:31401');
```

Sekarang, semua panggilan API yang dibuat menggunakan objek `server` akan secara otomatis melewati proxy Anda, dan semuanya akan berjalan lancar tanpa error CORS.

---

## 🧠 Detail Teknis: Bagaimana Cara Kerjanya?

-   **Middleware `cors`**: Ini adalah lapisan pertama yang menangani permintaan `OPTIONS` (pre-flight) dari browser dan menambahkan header `Access-Control-Allow-Origin: *` ke semua respons, yang memberi tahu browser bahwa permintaan lintas domain diizinkan.
-   **Penerusan Permintaan**: Untuk setiap permintaan yang masuk, proxy menyalin metode (GET, POST), header, dan body, lalu membuat permintaan identik ke node Horizon yang sedang aktif.
-   **Penanganan `Content-Type`**: Kode ini secara khusus menangani pengiriman transaksi Pi (`POST /transactions`), yang menggunakan `Content-Type: application/x-www-form-urlencoded`. Ini memastikan data `tx` yang dikodekan diteruskan dengan benar.
-   **Manipulasi Respons**: Bagian paling cerdas adalah saat proxy menerima respons. Sebelum mengirimkannya kembali ke klien, ia memeriksa apakah responsnya adalah JSON. Jika ya, ia melakukan pencarian dan penggantian sederhana untuk mengubah semua kemunculan URL node target (`http://node-asli.com:31401`) menjadi URL proxy itu sendiri (`http://localhost:31401`). Ini sangat penting agar tautan `_links` dalam respons API Horizon berfungsi dengan benar di sisi klien.

---

## 🤝 Berkontribusi

Kontribusi, isu, dan permintaan fitur sangat kami hargai! Jangan ragu untuk membuat *pull request* atau membuka *issue* baru di repositori GitHub.

## 📜 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk detail lebih lanjut.

## 📞 Kontak Developer

Dibuat dan dikelola oleh **zendshost**.

-   **Telegram**: [@zendshost](https://t.me/zendshost)
-   **GitHub**: [zendshost](https://github.com/zendshost)
