# RoomMate AI — sunum akışı

Kurulum için [README](README.md), uzak/yerel backend sürüm farkı için [Yaren'e uyum notu](database/BACKEND_UYUM_NOTU.md) kullanılır. Backend ve AI kaynaklarına dokunulmadı. Bu depoda kullanıcı verisi, .env, hesap parolası veya yedek yoktur.

1. Kendi yerel kurulumunda UI'dan bir deneme hesabı oluştur; ardından kullanıcı adınla giriş yap.
2. Temel profilini oluştur; yaşam alışkanlıklarını kaydet.
3. Backend sözleşmesi tamamlandıysa konum, ilçeler ve bütçe aralığını kaydet.
4. Profilde bir metni değiştir, kaydet ve sayfayı yenile. Verinin tekrar yüklendiğini göster.
5. PostgreSQL'de yalnız deneme hesabına ait profil kaydını sorgula; parola hash'lerini ekranda gösterme.
6. Aday, AI sonuçları ve mesajlaşma ekranlarında eksik API desteğinin açıkça belirtildiğini göster.
7. Çıkış yap ve profil erişiminin yeniden giriş istediğini göster.

Mevcut çalışan yerel sunum kopyasının hesap bilgileri ve yedeği Git dışında bırakılmıştır; bu branch aynı kullanıcıları/parolaları başka bilgisayara taşımaz. Herkes kendi yerel hesabını oluşturur.
