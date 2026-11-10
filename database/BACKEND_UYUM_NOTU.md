# Yaren için backend uyum notu

GitHub hazırlığı sırasında `origin/feature/backend` başı `6b7c966`, yerel veritabanı branch tabanı `e74f1cb` idi. Backend dosyalarında değişiklik yapılmadı. AI branch'i bu çalışmaya birleştirilmedi.

## Çalışan yerel sistem ile depodaki backend arasındaki fark

Satır sonları göz ardı edildiğinde yalnız iki mevcut backend kaynağı farklı:

- `backend/config/settings.py`: depodaki sürüm DB_NAME/DB_USER/DB_HOST/DB_PORT değişkenlerini zaten okuyor; çalışan yerel sürümde bu dört değer sabit. Her iki sürüm de DB_PASSWORD ve DJANGO_SECRET_KEY ortamdan alıyor. `.env.example` varsayılanları iki düzenle de uyumlu.
- `backend/profil/models.py`: çalışan yerel sürümde `kira_butcesi_min`, `kira_butcesi_max`, `sigara_durumu` alanları ve üç bütçe CHECK kısıtı var; depodaki backend'de bunlar yok.
- Çalışan yerel sürümdeki `backend/profil/migrations/0002_profil_ai_uyumluluk_alanlari.py`, ortak deponun incelenen branchlerinde bulunmuyor. Bu dosya bu branch'e eklenmedi.

**Yaren'in model ve bu mevcut migration dosyasını kendi backend çalışması kapsamında inceleyip getirmesi gerekiyor.** Sadece SQL ile sütun eklemek Django ORM/serializer alanlarını sağlamaz. Backend dosyalarını izinsiz kopyalamak, migration kaydını elle eklemek, --fake kullanmak veya yeni bir alternatif backend yazmak bu hazırlıkta yapılmadı.

`check_backend_contract.py`, yalnız Python AST'sini ve dosya varlığını okuyarak bu eksikliği bildirir. Bu branch şu an beklenen şekilde bu kontrolde durur. Eksik alanları içermeyen API ile bütün frontend özelliklerinin aynı şekilde çalıştığı iddia edilmez. `start.ps1` bu kontrol geçmeden servis başlatmaz; çalışan başka projedeki servisleri etkilemez.

Model/migration Yaren tarafından getirildiğinde mevcut migration'lar normal `migrate` ile uygulanır. Yerelde uygulanmış 0002 varsa migration geçmişi kontrol edilmelidir; migration dosyası değiştirilerek veya silinerek geçmiş düzeltilmemelidir.

## İlave tabloların sahipliği

`roommate_match`, `roommate_conversation`, `roommate_message` veritabanı çalışmasıdır; `messaging_matches.sql` içindedir. Mevcut backend bunları kullanmaz. Yaren yeni Django modelleri/migration'ları tasarlarken bu tablolarla çakışmayı önlemelidir. Eşleşme/mesajlaşma API'si olmadan bu ekranlar veri göndermez.

## Mevcut diğer sınırlar

AI için aday listeleme/skor API'si yok. Ham CSV sözleşmesi model girdisine doğrudan uymuyor; temizlik=5 ve fark_etmez için açık dönüşüm kararı gerekiyor. Yeni AI kodu/model eğitimi eklenmedi.

Çalışan yerel API testinde anonim giriş geçerli bilgileri CSRF tokensız da kabul etti; oturumlu profil güncellemesi tokensız 403 verdi. Frontend CSRF tokenını gönderir. Dekoratör davranışını Yaren incelemelidir; bu branch backend korumalarını değiştirmez.
