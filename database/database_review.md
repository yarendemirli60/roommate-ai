# RoomMate AI — teslim durumu ve sınırlar

> Bu sonuçlar çalışan yerel sistem içindir. Paylaşım branchindeki backend eksikliği [BACKEND_UYUM_NOTU.md](BACKEND_UYUM_NOTU.md) içinde açıklanır; aynı sonucun temiz klonda kendiliğinden alınacağı iddia edilmez.

4 Kasım 2026: Mevcut PostgreSQL 18 veritabanı korundu, yedeklendi, eksik profil.0002 migration'ı uygulandı. Django check/migration kontrolü geçti. Frontend'den kayıt, giriş, profil oluşturma, anket ve konum/bütçe güncellemesi yapıldı. Sayfa yenilemesi ve bağımsız PostgreSQL sorgusu kalıcılığı doğruladı. Otomatik entegrasyon betiğinde 14 kontrol geçti.

## Çalışan özellikler

- Ana sayfa ve mevcut logo/renk/tasarım çizgisi.
- Gerçek kullanıcı kaydı; kullanıcı adı/e-posta doğrulamaları ve şifre hash'i.
- Oturum tabanlı giriş/çıkış; sayfa yenilendikten sonra oturumu geri yükleme.
- Profil oluşturma, okuma, güncelleme.
- Yaşam alışkanlıkları ve tercihlerinin profile kaydı.
- Aranan şehir/ilçeler, bütçe alt/üst sınırı ve taşınma tarihinin profile kaydı.
- Hatalı bütçe aralığının frontend ve PostgreSQL seviyesinde engellenmesi.
- Mobil/masaüstü görünüm ve form hata/başarı durumları.

## Backend desteği bekleyen özellikler

- Başka kullanıcıları aday olarak listeleme ve gerçek aday sorgusuna konum/bütçe filtresi uygulama.
- AI fonksiyonlarını canlı Profil kayıtlarıyla çağırma; sonuç API'si.
- Eşleşme geçmişinin uygulamadan yazılması/okunması.
- Mesaj gönderme, alma ve sohbet listeleme.

Arayüzler hazır ve eksik destek açıkça belirtilir. Sahte aday, uyum yüzdesi veya gönderilmiş gibi gösterilen mesaj yoktur. Konum/bütçe ekranı şimdilik arama tercihini kaydeder; gerçek aday filtrelemesi yaptığı iddia edilmez.

## Yaren'e aktarılacak bulgular

1. `backend` URL'leri yalnız hesap ve kendi profil API'lerini sunuyor. Yeni endpoint/model kodu bu çalışmada yazılmadı.
2. AI ham CSV'sinde öneri fonksiyonunun beklediği name, noise_tolerance ve pet_acceptance sütunları yok. Gerçek profil -> AI girdi dönüşümü gerekiyor.
3. Modelin temizlik etiketi 1–4; Profil 1–5. fark_etmez evcil hayvan tercihi Yes/No'ya doğrudan dönüştürülemez. Keyfi dönüşüm yapılmadı.
4. AI için gerekli paketler backend sanal ortamında kurulu değil. Model eğitimi çalıştırılmadı, joblib dosyası değiştirilmedi/yüklenmedi.
5. Giriş endpoint'inin anonim CSRF davranışı doğrulama testinde açıklandı; backend_connection_guide.md ayrıntı içerir.
6. Bütçe aralık kontrolü PostgreSQL'de var; mevcut serializer bu aralık için özel API hatası üretmiyor. Frontend ters aralığı API'ye göndermeden engeller. Gelecekte Yaren serializer seviyesinde de doğrulamalıdır.

## Veri koruma

Başlangıçta hesap/profil sayıları 0 idi. Sonrasında tarayıcıyla sunum hesabı ve ayrı bir doğrulama hesabı eklendi. Hesaplar test/sunum amaçlıdır, gerçek aday olarak kullanılmamalıdır. Hiçbir mevcut kayıt silinmedi. Mesaj kısıt testleri transaction içinde geri alındı. Yerel sırlar ve yedekler .gitignore kapsamındadır.
