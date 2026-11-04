# Backend ve PostgreSQL bağlantısı

Güncel, taşınabilir kurulum adımları kökteki [README](../README.md) içindedir. [Backend uyum notunu](BACKEND_UYUM_NOTU.md) önce okuyun.

Ortak depodaki settings.py DB_NAME, DB_USER, DB_HOST, DB_PORT ve DB_PASSWORD ortam değişkenlerini okur. Çalışan yerel sunum kopyasında isim/kullanıcı/host/port sabittir. Örnek değerler her iki düzene de uyumlu olarak roommate_ai, roommate_app, localhost, 5433'tür. Hiçbir settings.py değiştirilmedi.

`.env` yalnız yereldir; `.env.example` gizli değer içermez. `runtime.ps1` ortamı okur, kök .venv veya eski backend/.venv Python'unu seçer. `manage.ps1` mevcut manage.py'yi -B ile çağırır. Yeni backend API'si eklenmedi.

Django tabloları mevcut migration'larla oluşturulur. Uzak backend şu anda çalışan yerel sürümün üç ek profil alanı ve 0002 migration'ından geridedir. Bu eksikliği Yaren kendi sorumluluğundaki kaynaklarıyla çözmelidir; SQL sütunu eklemek ORM'yi tamamlamaz.

Vite, /api isteklerini sabit loopback backend'e aktarır; CSRF başlangıcı mevcut admin/login GET sayfasından sağlanır. Origin/Referer yerel upstream'e uygun aktarılır; frontend CSRF tokenı gönderir. Bu düzen yerel geliştirme içindir. Çalışan yerel API'de anonim girişin tokensız geçerli kimlik bilgilerini kabul ettiği gözlendi; oturumlu profil güncellemesi tokensız 403 verdi. Yaren dekoratör davranışını incelemelidir; bu hazırlıkta backend değiştirilmedi.
