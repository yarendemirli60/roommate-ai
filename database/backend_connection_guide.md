# Yaren için Django–PostgreSQL bağlantı rehberi

Bu dosya bağlantı kurulumunu tarif eder. Bu çalışma migration uygulamamıştır. Güncel `settings.py` PostgreSQL motorunu, `roommate_ai` veritabanını, `roommate_app` rolünü, `localhost:5433` adresini ve `DB_PASSWORD` ortam değişkenini kullanacak biçimde yapılandırılmıştır. Bu doküman bu ayar dosyasını değiştirmez.

## 1. Bağımlılık ve ortam değişkenleri

Django 6.1.2 ve PostgreSQL 18 için psycopg 3 kullanılmalıdır. Repoda Python bağımlılık manifesti bulunmadığı için Yaren, seçilen paket yöneticisinde en az aşağıdaki bağımlılıkları sürümleyerek eklemelidir:

```powershell
py -m pip install "Django==6.1.2" djangorestframework "psycopg[binary]>=3.1.12"
```

Parolayı kaynak koda, Git'e veya örnek dosyaya yazmayın. Yerel terminalde aşağıdaki ortam değişkenleri tanımlanmalıdır:

```powershell
$env:DJANGO_SECRET_KEY = "yerel-gizli-anahtar"
$env:DB_NAME = "roommate_ai"
$env:DB_USER = "roommate_app"
$env:DB_PASSWORD = "<PostgreSQL-parolasi>"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5433"
```

## 2. Mevcut ayar ve önerilen iyileştirme

Mevcut ayar bağlantıyı gerçekten PostgreSQL'e yönlendirir; ancak veritabanı adı, kullanıcı, host ve port kaynakta sabittir. Aşağıdaki tüm-değerleri-ortamdan-okuyan yapı, Yaren isterse sonraki ayrı backend değişikliğinde kullanabileceği öneridir. Bu teslimatta uygulanmamıştır.

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["DB_NAME"],
        "USER": os.environ["DB_USER"],
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5433"),
        "CONN_MAX_AGE": 60,
        "CONN_HEALTH_CHECKS": True,
    }
}
```

Windows'ta TCP bağlantısı için `HOST=localhost` açıkça verilmelidir. PostgreSQL bağlantı ayrıntıları için [Django veritabanı dokümantasyonu](https://docs.djangoproject.com/en/6.1/ref/databases/) kullanılmalıdır.

## 3. Onaydan sonra migration sırası

Yalnız veritabanı sorumlusunun onayından sonra, `backend` klasöründe sırasıyla çalıştırılmalıdır:

```powershell
python manage.py check
python manage.py migrate --plan
python manage.py migrate
python manage.py showmigrations
```

İlk migration `django_*`, `auth_*` ve `profil_profil` tablolarını oluşturur. `accounts` tablosu oluşturmaz. Manuel `CREATE TABLE`, `migrate --fake`, migration silme veya SQLite dosyasını PostgreSQL'e doğrudan kopyalama kullanılmamalıdır.

## 4. AI entegrimi için backend notu

AI fonksiyonları mevcut `Profil` nesnesini doğrudan kabul etmez. Yaren ve AI sorumlusu, backend kodu değişikliğinden önce aşağıdaki sözleşmeyi kararlaştırmalıdır:

| AI girdisi | Mevcut karşılık | Karar ihtiyacı |
|---|---|---|
| `id`/`user_id` | `Profil.kullanici_id` | Tek kimlik kaynağı kullanıcı PK olmalıdır. |
| `konum`/`location` | `sehir`, `ilce`, `aranan_*` | Mevcut konum ile aranan konumun filtre kuralı belirlenmeli. |
| `butce_min`/`butce_max` | `kira_butcesi` | Aralık gereksinimi ve para birimi onaylanmalı. |
| Etiketli sigara/temizlik/gürültü/evcil hayvan kabulü | Boolean/sayısal/üç değerli Profil alanları | Kanonik ölçek ve normalleştirme kuralı belirlenmeli. |

`roommate_dataset.csv`, öneri kodunun istediği `noise_tolerance` ve `pet_acceptance` sütunlarını içermez. Bu ham CSV canlı aday kaynağı olarak doğrudan kullanılmamalıdır. `uyum_modeli.joblib` sadece güvenilir kaynaktan yüklenmelidir.
