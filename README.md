# 🐼 Haidilao Night Wall

Live chat wall buat ditampilkan di **layar besar** restoran. Customer scan **QR di pojok kanan bawah** → buka form di HP (Nama, No. Meja, Pesan) → tekan **Kirim** → pesan langsung **melayang** sebagai bubble chat di layar, di atas latar panggung malam Haidilao yang bergerak (bintang, asap hotpot, laser ungu, bahan-bahan lewat, lampu sorot).

## Halaman
| Route | Untuk | Isi |
|---|---|---|
| `/display` | Layar besar (TV/projector) | Latar animasi + maskot panda + QR + bubble chat masuk realtime |
| `/chat` | HP customer (tujuan QR) | Form Name / Table No. / Message + tombol Send |
| `/admin` | Staff (terkunci password) | Lihat semua pesan, hapus satu-satu / clear all (live ke layar) |
| `/api/messages` | Backend | `GET` (pesan & penghapusan) & `POST` (kirim pesan) |
| `/api/admin/messages` | Backend (auth) | `GET` list, `DELETE` hapus/clear |

`/` otomatis redirect ke `/display`.

## Jalankan lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:3000/display` (layar) dan `http://localhost:3000/chat` (HP / tab lain). Saat dev, pesan disimpan di memori proses — cukup untuk uji 1 mesin.

## Deploy ke Vercel
1. Push folder ini ke GitHub.
2. Di **vercel.com** → **Add New → Project** → import repo → **Deploy** (preset Next.js terdeteksi otomatis).
3. **WAJIB untuk produksi:** tambah penyimpanan biar pesan HP nyampe ke layar.
   - Vercel serverless itu stateless, jadi mode memori **tidak** sinkron antar request di Vercel.
   - Buka tab **Storage** project → **Marketplace** → pilih **Upstash for Redis** (ada free tier) → Connect.
   - Integrasi otomatis mengisi env `KV_REST_API_URL` dan `KV_REST_API_TOKEN`. Kode langsung memakainya (lihat `lib/store.js`).
   - **Redeploy** setelah connect.
4. Buka `https://<project>.vercel.app/display` di layar besar (fullscreen browser / kiosk). QR di layar otomatis mengarah ke `https://<project>.vercel.app/chat` — tinggal di-scan customer.

## Panel admin (`/admin`)
Halaman moderasi terkunci password — hanya yang tahu password yang bisa buka.
1. Set env **`ADMIN_PASSWORD`** di Vercel (Project → Settings → Environment Variables) dengan password kuat, lalu redeploy.
2. Buka `https://<project>.vercel.app/admin`, masukkan password → muncul daftar semua pesan.
3. Klik **Delete** untuk hapus satu pesan, atau **Clear all** untuk kosongkan layar. Pesan yang dihapus **langsung ketarik dari layar besar** (live) dalam ±1–2 detik.

Catatan keamanan: password dikirim lewat header `x-admin-key` di atas HTTPS dan dibandingkan secara constant-time di server (`lib/admin.js`). Sesi login disimpan di `sessionStorage` (hilang saat tab ditutup). Untuk dev lokal tanpa env, password default `haidilao-admin` — **wajib ganti** di produksi.

## Ganti / atur
- **Maskot:** ganti `public/mascot.png` (PNG transparan).
- **Warna & animasi:** semua token + keyframes ada di `app/globals.css`.
- **Bahan hotpot yang lewat:** array `INGREDIENTS` di `components/Backdrop.jsx`.
- **Kecepatan refresh layar:** interval polling di `app/display/page.js` (default 1.5 dtk).
- **Backlog:** layar sengaja hanya menampilkan pesan yang masuk **setelah** halaman dibuka (biar nggak banjir riwayat lama).

## Catatan
- Untuk skala besar / banyak layar, polling bisa diganti SSE atau provider realtime (Pusher/Ably) — struktur API sudah dipisah jadi mudah ditukar.
- Tidak ada moderasi bawaan. Kalau dipakai publik, tambahkan filter kata di handler `POST` (`app/api/messages/route.js`).
