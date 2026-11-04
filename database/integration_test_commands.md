# PostgreSQL entegrasyonu — onay sonrası test sırası

Bu komutlar bu çalışma sırasında çalıştırılmamıştır. Önce yerel terminalde gizli değerleri tanımlayın; parolayı hiçbir dosyaya yazmayın.

```powershell
cd C:\Users\Administrator\RoomMate-AI\backend
.\.venv\Scripts\Activate.ps1
$env:DJANGO_SECRET_KEY = "yerel-gizli-anahtar"
$env:DB_PASSWORD = "<roommate_app_parolasi>"
```

## 1. Bağlantıyı doğrula — şema değiştirmez

```powershell
python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print(connection.vendor)"
```

Başarılı sonuç `postgresql` olmalıdır. Bu komut bağlantı açar ama tablo, migration veya veri yazmaz.

## 2. Migration planını gör — şema değiştirmez

```powershell
python manage.py check
python manage.py showmigrations
python manage.py makemigrations --check --dry-run
python manage.py migrate --plan
python manage.py sqlmigrate profil 0002
```

`makemigrations --check` Django sürümüne göre migration geçmişi bağlantısını kontrol edebilir; bu yüzden `DB_PASSWORD` tanımlı olmalıdır. `sqlmigrate` çıktısında iki sütun ve üç `CHECK` kısıtı görünmelidir.

## 3. Açık onaydan sonra uygula — şemayı değiştirir

```powershell
python manage.py migrate
python manage.py showmigrations profil
```

Bu aşama Django'nun tüm bekleyen migration'larını uygular. İlk PostgreSQL geçişinde `auth_*`, `django_*` ve `profil_profil` tablolarını oluşturur; mevcut bir veritabanında yalnız henüz uygulanmamış migration'ları uygular.

## 4. Uygulama sonrası doğrulama

```powershell
python manage.py dbshell
```

`psql` içinde:

```sql
\d profil_profil
SELECT app, name, applied
FROM django_migrations
WHERE app = 'profil'
ORDER BY applied;
```

Beklenen yeni sütunlar `kira_butcesi_min`, `kira_butcesi_max` ve `sigara_durumu`; beklenen kısıtlar da `profil_kira_butcesi_*` adlarıyla görünmelidir.
