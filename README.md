# RoomMate AI

Üniversite öğrencileri için ev arkadaşı bulma projesi. Frontend React/Vite, mevcut API Django REST Framework, veritabanı PostgreSQL kullanır.

- **Beyhan:** frontend, veritabanı şeması, bağlantı/kurulum betikleri ve belgeler.
- **Yaren:** `backend/` ve `ai/` kaynakları, API'ler ve eşleştirme algoritması.

Proje kayıt ve oturum yönetimi, yaşam profili, aday listesi, modelle uyum hesabı, özel mesajlaşma ve fotoğraflı kiralık ev veya oda ilanlarını içerir.

## Gereksinimler

- Windows PowerShell; Python 3.13 (`py -3.13`), Node.js 24 ve npm.
- PostgreSQL 18 ve psql. Bu projenin yerel varsayılan portu **5433**; PostgreSQL'in kurulum varsayılanı olan 5432 ile karıştırmayın. Kurulum sırasında 5433 seçin veya mevcut servis portunu kontrol edin. Mevcut PostgreSQL servisini/veritabanını silmeyin.
- İnternet: ilk Python/npm paket kurulumu için. Ana sayfa mevcut Unsplash görselini ve Google Fonts kullanır; yazı tipleri için sistem alternatifi vardır.

Bu belgede bütün komutlar deponun **kök klasöründen** çalıştırılır. Makineye özel mutlak proje yolu kullanılmaz.

## 1. Yerel sırları hazırlayın

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env` zaten varsa kopyalama komutunu kullanmayın; kendi yerel dosyanızı koruyun. Şu örnek bağlantı değerlerini ve size ait iki gizli değeri doldurun:

```dotenv
DB_NAME=roommate_ai
DB_USER=roommate_app
DB_HOST=localhost
DB_PORT=5433
DB_PASSWORD=<yalnizca-kendi-yerel-parolaniz>
DJANGO_SECRET_KEY=<yalnizca-kendi-yerel-anahtariniz>
```

Django anahtarını yerelde üretmek için `py -3.13 -c "import secrets; print(secrets.token_urlsafe(48))"` kullanılabilir. Değeri yalnız .env içine koyun. Bu komutun çıktısını paylaşmayın veya kaynak dosyasına eklemeyin. Kaynakta sabit, paylaşılan SECRET_KEY bulunmaz.

`.env`, `.local/`, veritabanı yedekleri ve sanal ortam Git dışında tutulur. `.env.example` yalnız örnek bağlantı değerlerini ve **boş** gizli değişkenleri içerir. Gerçek kullanıcı verisi, PostgreSQL data klasörü ve veritabanı dump'ı bu teslimatın parçası değildir.

## 2. PostgreSQL rolünü ve boş veritabanını hazırlayın

Önce mevcut rol/veritabanını kontrol edin. Veritabanı zaten varsa yeniden oluşturulmaz; mevcut rolün parolası değiştirilmez.

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U postgres -d postgres -f .\database\bootstrap.psql
```

PostgreSQL yönetici parolası psql tarafından terminalde sorulur; kaynak koduna veya komut argümanına yazılmaz. Betik:

1. `roommate_app` rolü yoksa oluşturur ve **yeni rolün** parolasını interaktif sorar. `.env` içindeki DB_PASSWORD aynı olmalıdır.
2. Rol zaten varsa parolayı korur; `.env` içine o rolün bilinen yerel parolasını siz yazarsınız.
3. `roommate_ai` yoksa oluşturur; varsa veri ve tabloları korur.
4. Uygulama rolüne veritabanı bağlantısı ile public şeması kullanım/oluşturma hakkı verir.

`bootstrap.psql` psql meta komutları içerir; pgAdmin Query Tool'a doğrudan yapıştırılmamalıdır. Mevcut tablolar başka role aitse migration yetkisi ayrıca incelenmelidir; betik tablo sahipliğini veya mevcut kullanıcı parolalarını değiştirmez. Dolu veritabanındaki şema işlemlerinden önce kendi yerel yedeğinizi alın; yedeği Git'e eklemeyin.

## 3. Python ve frontend bağımlılıkları

Kök `.venv` kullanımı backend kaynaklarını değiştirmez:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\database\requirements-runtime.txt
npm.cmd --prefix frontend ci
```

`.venv` zaten varsa oluşturma adımını atlayın. Mevcut `backend/.venv` ortamı da başlatma betikleri tarafından alternatif olarak desteklenir; kök `.venv` önceliklidir. Django, fotoğraf doğrulama ve uyum modeli bağımlılıkları `database/requirements-runtime.txt` içinde sabitlenmiştir.

## 4. Mevcut Django migration'larını uygulayın

```powershell
.\.venv\Scripts\python.exe -B .\database\check_backend_contract.py
.\database\manage.ps1 check
.\database\manage.ps1 showmigrations
.\database\manage.ps1 migrate --plan
.\database\manage.ps1 migrate --noinput
```

İlk komut eksik backend sözleşmesi bildiriyorsa [Yaren'e notu](database/BACKEND_UYUM_NOTU.md) çözmeden tam uygulama kurulumuna devam etmeyin. Dosya eksikliği veritabanını sıfırlayarak giderilmez.

Django hesap, profil, mesaj ve ilan tablolarını kendi migration’larıyla yönetir. Beklenen profil migration'ları `0001_initial` ve çalışan yerel sürümün `0002_profil_ai_uyumluluk_alanlari` dosyasıdır. Mevcut tablolar elle kopyalanmaz; `--fake`, `flush`, `DROP DATABASE`, eski migration silme/değiştirme kullanılmaz. `manage.ps1`, .env değerlerini sürece aktarır; backend kendi başına .env okumaz.

## 5. Ek veritabanı şemasını isteğe bağlı inceleyin

Migration'lar tamamlandıktan sonra uygulama kullanıcısıyla Django dbshell açın. psql PATH üzerinde olmalı:

```powershell
$env:Path = "C:\Program Files\PostgreSQL\18\bin;" + $env:Path
.\database\manage.ps1 dbshell
```

psql içinde (dbshell çalışma dizini backend olduğundan yol `../database/`):

```sql
\i ../database/messaging_matches.sql
\i ../database/database_schema.sql
\q
```

İlk dosya `roommate_match`, `roommate_conversation`, `roommate_message` tablolarını PK/FK/UNIQUE/CHECK kurallarıyla ekler; var olan tabloları silmez. İkinci dosya salt okunur şema doğrulamasıdır. Ek şema CREATE IF NOT EXISTS kullanır; önceden farklı tasarımla oluşturulmuş aynı adlı tabloları otomatik düzeltmez. Bu durumda [veri sözlüğünü](database/database_documentation.md) inceleyin.

Mevcut mesajlaşma API’si Django’nun `mesajlar_mesaj` tablosunu kullanır. Bu SQL taslağı uygulamayı çalıştırmak için gerekli değildir.

## 6. Backend ve frontend'i başlatın

Backend sözleşmesi ve migration'lar uygun olduğunda tek komut:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1
```

Uygulama: **http://127.0.0.1:5173**. Betik backend'i 127.0.0.1:8000 ve Vite'ı 127.0.0.1:5173 üzerinde arka planda başlatır. Günlükler .local altındadır. Migration veya veri silme işlemi yapmaz. Aynı portta başka bir proje açıksa o süreci yanlışlıkla kullanmamak için portu kontrol edin.

Alternatif: ayrı iki PowerShell terminalinde, depo kökünden:

```powershell
# Terminal 1
.\database\run-backend.ps1
# Terminal 2
npm.cmd --prefix frontend run dev
```

Bu alternatif komutlar sözleşme kontrolünü otomatik çalıştırmaz; 4. adımdaki kontrol önceden geçmelidir. Terminallerde Ctrl+C ile kapatabilirsiniz. Farklı hostlar arasında geçiş çerez oturumunu ayırır; sunum sırasında aynı 127.0.0.1 adresini kullanın.

Vite yerel `/api/` isteklerini Django API’sine aktarır. CSRF çerezi `/api/session-csrf/` üzerinden alınır. Üretim yayını için bu geliştirme proxy'si yeterli değildir; backend sahibiyle HTTPS/hosting düzeni ayrıca yapılmalıdır.


## İlan API’si

İlan tablolarını oluşturmak için proje kökünden `.\database\manage.ps1 migrate ilanlar` çalıştırın. Fotoğraf doğrulaması için çalışma zamanı bağımlılıkları arasında Pillow bulunur. İlan uç noktaları Django oturumuyla çalışır. İlan oluşturan istemci CSRF çerezini ve başlığını da göndermelidir.

- `GET /api/ilanlar/` yayındaki ilanları 20’şer döndürür. Yanıtta `count`, `next`, `previous` ve `results` alanları bulunur.
- Filtreler `sehir`, tekrarlanabilir `ilce`, `min_kira`, `max_kira`, `ilan_turu`, `oda_turu` ve `page` parametreleridir. Örnek URL `/api/ilanlar/?sehir=istanbul&ilce=kadikoy&ilce=uskudar&min_kira=10000&max_kira=25000`.
- `harita=true` aynı filtreleri uygular ve yalnızca koordinatı bulunan ilanları döndürür. `enlem` ve `boylam` sayı olarak gelir. Liste görünümünde koordinatsız ilanların iki alanı da `null` olabilir.
- `GET /api/ilanlar/{id}/` ilan detayını ve sıralı fotoğraf bağlantılarını döndürür. Fotoğraf bağlantıları da oturum gerektirir.
- `POST /api/ilanlar/` bir `multipart/form-data` isteğiyle ilan yayınlar. Alanlar `baslik`, `aciklama`, `ilan_turu` (`ev` veya `oda`), `oda_turu`, `sehir_kodu`, `ilce_kodu`, `aylik_kira`, `esyali` ve `alan_m2` değerleridir. `fotograf_dosyalari` alanı bir ile beş arasında JPEG, PNG veya WebP dosyası için aynı adla tekrarlanır. İsteğe bağlı `enlem` ve `boylam` birlikte gönderilir. Sahip, oturumdan atanır.
- Konum kodları küçük ASCII harf, rakam ve kısa çizgiyle yazılır. Ev ilanlarında oda kodları `studyo`, `1+1`, `2+1` ve `3+1`. Oda ilanlarında `tek_kisilik` ve `paylasimli` kullanılır.
- Aday API’si `GET /api/profil/adaylar/{id}/` ile aday detayını, `GET /api/profil/adaylar/?page=1` ile sayfalanmış aday listesini sunar. Parametresiz aday isteği mevcut React ekranları için dizi döndürür.

## Google Maps

İlan haritasını açmak için Google Cloud projesinde Maps JavaScript API’yi etkinleştirin ve tarayıcı anahtarını proje kökündeki `.env` dosyasında `VITE_GOOGLE_MAPS_API_KEY` olarak tanımlayın. Anahtarı Maps JavaScript API ve uygulamanın web adresleriyle sınırlandırın. Üretimde kendi harita kimliğinizi `VITE_GOOGLE_MAPS_MAP_ID` olarak verin. Yerel deneme için varsayılan `DEMO_MAP_ID` kullanılabilir. Vite’ı yeniden başlatın veya üretim derlemesini yenileyin. Anahtar yoksa harita OpenStreetMap ile açılır. Harita yüklenemezse ilan listesi kullanılabilir.

## Ekranlar ve çalışan kapsam

| Ekran | Durum |
|---|---|
| Ana sayfa, kayıt/giriş/çıkış | Mevcut Django hesap API'leriyle çalışır |
| Profil, yaşam alışkanlıkları | Kendi profilini oluşturma/okuma/güncelleme |
| Konum ve bütçe | Arama tercihini profile kaydeder; üç yeni alan için yukarıdaki backend uyumu gerekir |
| Ev arkadaşı adayları | Sayfalı aday listesi ve aday detay API’si |
| AI uyumluluk sonuçları | Eğitilmiş modelden uyum skoru ve açıklamalar |
| Mesajlaşma | Katılımcıların erişebildiği veritabanına kayıtlı konuşmalar |
| Ev ve oda ilanları | Kalıcı ilan ve fotoğraf kaydı, konum ve kira filtreleri, detay ve harita |

Bir mevcut Django süreci eski kodla çalışıyorsa durdurun ve başlatma komutunu tekrar çalıştırın.

## Kontroller

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
.\database\verify.ps1
```

verify.ps1 için backend/veritabanı sözleşmesi uygun, servisler açık ve UI'dan oluşturulmuş en az bir **deneme** hesabı olmalıdır. Betik ayrı bir verify_* hesabı oluşturur/günceller; parolası ve raporu yalnız .local içinde tutulur. Mevcut kullanıcıları silmez. Mesaj kısıt testleri transaction içinde geri alınır. Temiz kurulumda ortak bir kullanıcı parolası veya gerçek kullanıcı kaydı içe aktarılmaz; herkes kendi hesabını UI'dan oluşturur.

Şema: [ER diyagramı](database/ER_Diagram.md) · [API/veri sözleşmesi](database/common_data_contract.md) · [Yaren'e uyum notu](database/BACKEND_UYUM_NOTU.md).
