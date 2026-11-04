# Mevcut frontend/API/AI veri sözleşmesi

## Gerçek HTTP API

| İşlem | Yöntem ve yol | Girdi / sonuç |
|---|---|---|
| Kayıt | POST /api/kayit/ | kullanici_adi, eposta, sifre; mesaj ve kullanici{id,kullanici_adi} |
| Giriş | POST /api/giris/ | kullanici_adi, sifre; Django session cookie; kullanici bilgisi |
| Çıkış | POST /api/cikis/ | Mevcut oturum; oturum kapanır |
| Profil oluşturma | POST /api/profil/olustur/ | Profil alanları; kullanıcı request.user üzerinden atanır |
| Profil okuma | GET /api/profil/ | Oturumun kendi profili; profil yoksa 404, oturum yoksa 403 |
| Profil güncelleme | PATCH/PUT /api/profil/ | Profil alanları; frontend PATCH kullanır |

Profil serializer'ı kullanici alanını dışlar. Profil.id kullanıcı kimliği değildir. Kayıt oturum açmaz; kullanıcı ardından giriş yapar. Frontend parola/tokenı localStorage veya sessionStorage'a yazmaz; Django oturum çerezi kullanır. SessionStorage yalnız ana sayfadan gelen şehir/bütçe taslağını tutabilir; başarılı profil kaydında silinir.

Profilde ad, soyad, yas (18–120), sehir, ilce, meslek, kullanim_amaci zorunludur. evime_arkadas/birlikte_ev için sigara, evcil_hayvan, temizlik, gurultu, sigara_kabulu, evcil_hayvan_kabulu, minimum_temizlik, maksimum_gurultu ayrıca zorunludur. Boolean false geçerli bir yanıttır. Sayısal bütçeler API'den ondalık metin olarak dönebilir. Aranan ilçeler JSON metin listesidir.

sigara_durumu: non_smoker/smoker/occasional. Frontend sigara booleanını da uyumlu gönderir; occasional ayrı kategorik alanda korunur. Kabul tercihleri evet/hayir/fark_etmez; puanlar 1–5'tir. Kira bütçesi aylık kişi başı TL'dir.

## Mevcut AI kodunun ayrı sözleşmesi

Aday filtresi: id, konum, butce_min, butce_max. Aday DataFrame'i: user_id, location, budget_min, budget_max. Konum strip/casefold ile eşit olmalı; bütçe aralıkları kesişmeli; kişi kendisi aday olamaz.

Öneri girdisinde ayrıca yas, sigara (non_smoker/smoker/occasional), etiketli temizlik, etiketli gurultu_toleransi, evcil_hayvan_kabulu (Yes/No) bulunur. Öneri DataFrame'i name, age, smoking, cleanliness, noise_tolerance, pet_acceptance ister. Ham roommate_dataset.csv bu sözleşmeye doğrudan uymaz.

Mevcut öneri fonksiyonunun sonucu: `[{aday_id, ad, skor, aciklamalar}]`; yüksek skora göre sıralanır. Skor bir model tahminidir; ölçeği kalibre edilmeden yüzde diye etiketlenmemelidir. Frontend'de sonuç endpoint'i olmadığı için skor gösterilmez. Profil değerlerini AI'ye dönüştüren kod, AI API'si veya yeni algoritma bu çalışmada yazılmadı.

Temizlik=5, evcil_hayvan_kabulu=fark_etmez ve çoklu ilçe girdileri için Yaren'in açık sözleşme belirlemesi gerekir. Geçersiz/eksik girdiler keyfi değerlere çevrilmez.
