# RoomMate AI frontend

Mevcut tasarım, logo ve React/Vite yapısı korunarak geliştirildi. Yeni paket eklenmedi. Uzak backend henüz bütçe aralığı ve sigara kategorisi model/migration alanlarını içermiyor; tam entegrasyon için Yaren'in bu kaynakları getirmesi gerekiyor.

## Başlatma

Proje kökünden `powershell -ExecutionPolicy Bypass -File .\start.ps1`; uygulama http://127.0.0.1:5173 adresinde açılır. Backend, kök .venv veya mevcut backend/.venv ortamında çalışır. Yerel sırlar proje kökündeki .env içinden yüklenir. Kurulum ayrıntıları ../README.md, backend sürüm farkı ../database/BACKEND_UYUM_NOTU.md içindedir.

Ayrı terminallerde çalıştırmak için proje kökünden `.\database\run-backend.ps1`; frontend klasöründen `npm.cmd run dev` kullanılabilir.

## Ekranlar

Ana sayfa; #/kayit; #/giris; #/panel; #/profil; #/anket; #/filtreler; #/adaylar; #/uyum; #/mesajlar.

Kayıt/giriş/çıkış ve profil/anket/arama tercihi kaydı mevcut Django API'lerine bağlıdır. Konum ve bütçe ekranı tercih kaydeder; gerçek aday filtreleme endpoint'i yoktur. Aday/AI/mesajlaşma ekranları sunucu desteği beklediğini belirtir. Sahte aday ve skor gösterilmez; mesaj gönderme kapalıdır.

## Bağlantı

src/api.js çerez tabanlı session ve CSRF kullanır. Yeni backend API'si eklenmedi. vite.config.js, göreli /api isteklerini yalnız yerel 8000 portuna aktarır; CSRF başlangıcını mevcut admin/login GET sayfasından sağlar. Geliştirme 5173, preview 4173 portundadır. Proxy üretim dağıtımı yerine geçmez.

`npm.cmd run lint` ve `npm.cmd run build` geçti. `npm.cmd run preview` derlenmiş frontend'i yerel API proxy'siyle açar; backend ayrıca açık olmalıdır.
