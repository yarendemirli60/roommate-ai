from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Profil(models.Model):
    class KullanimAmaci(models.TextChoices):
        EV_ARIYORUM = "ev_ariyorum", "Ev arıyorum"
        EVIME_ARKADAS = "evime_arkadas", "Evime arkadaş arıyorum"
        BIRLIKTE_EV = "birlikte_ev", "Birlikte ev arayacağım arkadaş arıyorum"

    class KabulTercihi(models.TextChoices):
        EVET = "evet", "Evet"
        HAYIR = "hayir", "Hayır"
        FARK_ETMEZ = "fark_etmez", "Fark etmez"

    kullanici = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil",
    )

    ad = models.CharField(max_length=50)
    soyad = models.CharField(max_length=50)
    yas = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(18), MaxValueValidator(120)]
    )
    sehir = models.CharField(max_length=50)
    ilce = models.CharField(max_length=50)
    meslek = models.CharField(max_length=100)
    hakkimda = models.TextField(max_length=1000, blank=True)

    kullanim_amaci = models.CharField(
        max_length=20,
        choices=KullanimAmaci.choices,
    )

    # Ev arama bilgileri
    aranan_sehir = models.CharField(max_length=50, blank=True)
    aranan_ilceler = models.JSONField(default=list, blank=True)
    kira_butcesi = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    tasinma_tarihi = models.DateField(null=True, blank=True)

    # Kişinin kendi yaşam alışkanlıkları
    sigara = models.BooleanField(null=True, blank=True)
    evcil_hayvan = models.BooleanField(null=True, blank=True)
    temizlik = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    gurultu = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )

    # Ev arkadaşı tercihleri
    sigara_kabulu = models.CharField(
        max_length=12,
        choices=KabulTercihi.choices,
        blank=True,
    )
    evcil_hayvan_kabulu = models.CharField(
        max_length=12,
        choices=KabulTercihi.choices,
        blank=True,
    )
    minimum_temizlik = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    maksimum_gurultu = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )

    olusturulma_tarihi = models.DateTimeField(auto_now_add=True)
    guncellenme_tarihi = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.ad} {self.soyad}"


