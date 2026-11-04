# RoomMate AI — çalıştırılmış doğrulama

Bu sonuçlar çalışan yerel backend sürümüyle alındı. Temiz klonda önce README ve BACKEND_UYUM_NOTU.md adımları tamamlanmalıdır.

Proje kökünden:

```powershell
.\database\manage.ps1 check
.\database\manage.ps1 showmigrations profil
.\database\manage.ps1 makemigrations --check --dry-run
.\start.ps1 -NoBrowser
.\database\verify.ps1
cd frontend
npm.cmd run lint
npm.cmd run build
```

Yerel .env runtime.ps1 ile yüklenir; sırlar komut satırına verilmez. verify.ps1 ayrı doğrulama hesabını oluşturur/günceller. Bu hesabın rastgele bilgileri .local/verification-account.json içindedir. Sunum hesabını değiştirmez ve hiçbir kayıt silmez. Yeniden çalıştırılabilir.

## Sonuçlar

14 entegrasyon kontrolü geçti: anonim profil erişiminin engellenmesi; hatalı kayıt; kayıt ve tekrar kayıt kontrolü; yanlış şifre; oturumlu giriş; token olmadan oturumlu profil değişikliğinin engellenmesi; yaşam alışkanlıklarıyla profil; tekrar profil ve yaş doğrulaması; güncelleme ve GET; bağımsız PostgreSQL bağlantısıyla kalıcılık/parola hash doğrulaması; ters bütçenin DB'de engellenmesi; mesaj/ilişki kısıtları; çıkış; yeni HTTP oturumundan aynı profilin okunması.

Mesaj kısıt testlerinin geçici kayıtları transaction ile geri alınır. Kalıcı olarak eklenen kayıtlar yalnız sunum ve doğrulama hesapları/profilleridir. Mevcut veriler silinmez.

Giriş API'sinin anonim CSRF davranışı testte ayrıca kaydedildi: mevcut endpoint geçerli bilgileri tokensız da kabul ediyor; Yaren'in incelemesi gereken bu davranış backend_connection_guide.md'de açıklanmıştır. Rapor .local/verification-report.json içindedir.

Tarayıcı üzerinden kayıt, giriş, profil oluşturma, yaşam alışkanlığı güncelleme, bütçe doğrulama ve sayfa yenilemesi sonrası veri korunması da test edildi. Ortak bir sunum hesabı veya parola paylaşılmaz; UI üzerinden kendi deneme hesabınızı oluşturun. Betik ayrıca en az bir başka deneme kullanıcısının varlığını bekler.
