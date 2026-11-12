from django.db import models
from django.conf import settings

# Create your models here.
class Mesaj(models.Model):
    gonderen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="gonderilen_mesajlar",
    )
    alici = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alinan_mesajlar",
    )
    icerik = models.TextField(max_length=1000)
    gonderilme_tarihi = models.DateTimeField(auto_now_add=True)