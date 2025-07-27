# ChatBot-Web

Aplikasi web chatbot modern yang menggunakan AI untuk memberikan respons cerdas dan interaktif.

## 🚀 Fitur

- **AI-Powered Chat**: Menggunakan Groq API dengan model llama-3.3-70b-versatile
- **Real-time Messaging**: Interface chat yang responsif dan real-time
- **Dark/Light Theme**: Toggle tema untuk kenyamanan pengguna
- **Markdown Support**: Dukungan penuh untuk markdown dan syntax highlighting
- **Chat History**: Penyimpanan riwayat chat di localStorage
- **Rate Limiting**: Perlindungan dari spam dan abuse
- **Responsive Design**: Optimized untuk desktop dan mobile
- **Character Counter**: Indikator jumlah karakter dengan batas 4000
- **Copy Messages**: Fitur copy pesan dengan satu klik
- **Error Handling**: Penanganan error yang komprehensif

## 🛠️ Teknologi

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI Provider**: Groq SDK
- **Security**: Helmet, CORS, Rate Limiting
- **Styling**: Font Awesome, Google Fonts (Inter)

## 📦 Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/hanru-ism/ChatBot-Web.git
   cd ChatBot-Web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit file `.env` dan tambahkan:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   NODE_ENV=development
   API_BASE_URL=
   FRONTEND_URL=http://localhost:3000
   ```

4. **Dapatkan Groq API Key**
   - Kunjungi [Groq Console](https://console.groq.com/)
   - Buat akun dan generate API key
   - Masukkan API key ke file `.env`

## 🚀 Menjalankan Aplikasi

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📁 Struktur Proyek

```
ChatBot-Web/
├── index.html          # Halaman utama
├── script.js           # JavaScript frontend
├── styles.css          # Styling CSS
├── server.js           # Server Express.js
├── package.json        # Dependencies dan scripts
├── .env.example        # Template environment variables
├── API_CONFIG.md       # Dokumentasi konfigurasi API
├── ngrok.js           # Script untuk ngrok tunneling
└── public/
    └── main.js        # Utility JavaScript tambahan
```

## 🔧 Konfigurasi API

Aplikasi mendukung konfigurasi API base URL yang fleksibel. Lihat [API_CONFIG.md](API_CONFIG.md) untuk detail lengkap.

## 🔒 Keamanan

- **Rate Limiting**: 100 requests per 15 menit, 10 chat requests per menit
- **CORS Protection**: Konfigurasi CORS yang aman
- **Input Validation**: Validasi input dan sanitization
- **Helmet Security**: Headers keamanan HTTP
- **Environment Variables**: Sensitive data disimpan di environment variables

## 📱 Fitur Mobile

- Responsive design untuk semua ukuran layar
- Touch-friendly interface
- Optimized untuk mobile browsers
- Auto-resize textarea

## 🎨 Customization

### Mengubah Tema
Aplikasi mendukung dark/light theme yang dapat diubah melalui toggle di header.

### Mengubah Model AI
Edit `server.js` pada bagian:
```javascript
model: 'llama-3.3-70b-versatile'
```

### Mengubah Rate Limits
Edit konfigurasi rate limiting di `server.js`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per windowMs
});
```

## 🐛 Troubleshooting

### Error: GROQ_API_KEY not set
Pastikan file `.env` sudah dibuat dan berisi API key yang valid.

### CORS Errors
Periksa konfigurasi CORS di `server.js` dan pastikan `FRONTEND_URL` sudah benar.

### Port Already in Use
Ubah port di file `.env` atau hentikan aplikasi yang menggunakan port tersebut.

## 📊 API Endpoints

- `GET /` - Halaman utama
- `POST /api/chat` - Endpoint chat dengan AI
- `GET /api/config` - Konfigurasi API
- `GET /health` - Health check

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

## 👨‍💻 Author

**Han** - [@hanru-ism](https://github.com/hanru-ism)

## 🙏 Acknowledgments

- [Groq](https://groq.com/) untuk AI API
- [Font Awesome](https://fontawesome.com/) untuk icons
- [Google Fonts](https://fonts.google.com/) untuk typography
- [Marked.js](https://marked.js.org/) untuk markdown parsing
- [DOMPurify](https://github.com/cure53/DOMPurify) untuk HTML sanitization

## 🔮 Roadmap

- [ ] WebSocket real-time communication
- [ ] Multi-AI provider support
- [ ] User authentication
- [ ] Voice input/output
- [ ] Chat export/import
- [ ] Plugin system
- [ ] PWA support
- [ ] Mobile app
