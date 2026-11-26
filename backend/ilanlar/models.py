from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models import Q

konum_kodu = RegexValidator(r"^[a-z0-9]+(?:-[a-z0-9]+)*\Z", "Geçerli bir konum kodu girin.")


class Ilan(models.Model):
    class Tur(models.TextChoices):
        EV = "ev", "Ev"
        ODA = "oda", "Oda"

    class OdaTuru(models.TextChoices):
        STUDYO = "studyo", "Stüdyo"
        BIR_ARTI_BIR = "1+1", "1+1"
        IKI_ARTI_BIR = "2+1", "2+1"
        UC_ARTI_BIR = "3+1", "3+1"
        TEK_KISILIK = "tek_kisilik", "Tek kişilik oda"
        PAYLASIMLI = "paylasimli", "Paylaşımlı oda"

    EV_ODALARI = ("studyo", "1+1", "2+1", "3+1")
    PAYLASIM_ODALARI = ("tek_kisilik", "paylasimli")

    sahip = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    ilan_turu = models.CharField(max_length=3, choices=Tur.choices)
    baslik = models.CharField(max_length=100)
    aciklama = models.TextField(max_length=3000)
    sehir_kodu = models.CharField(max_length=16, validators=[konum_kodu])
    ilce_kodu = models.CharField(max_length=32, validators=[konum_kodu])
    oda_turu = models.CharField(max_length=24, choices=OdaTuru.choices)
    aylik_kira = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    esyali = models.BooleanField()
    alan_m2 = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10000)]
    )
    enlem = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    boylam = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    yayinda = models.BooleanField(default=True)
    olusturulma_tarihi = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "roommate_listing"
        ordering = ("-olusturulma_tarihi", "-pk")
        indexes = [
            models.Index(fields=["sehir_kodu", "ilce_kodu"], condition=Q(yayinda=True), name="rm_ilan_sehir_ilce_idx"),
            models.Index(fields=["ilce_kodu"], condition=Q(yayinda=True), name="rm_ilan_ilce_idx"),
            models.Index(fields=["aylik_kira"], condition=Q(yayinda=True), name="rm_ilan_kira_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(aylik_kira__gte=Decimal("0.01")), name="rm_ilan_kira_pozitif"),
            models.CheckConstraint(condition=Q(alan_m2__range=(1, 10000)), name="rm_ilan_alan_araligi"),
            models.CheckConstraint(
                condition=(
                    Q(enlem__isnull=True, boylam__isnull=True)
                    | Q(enlem__isnull=False, boylam__isnull=False, enlem__range=(-90, 90), boylam__range=(-180, 180))
                ),
                name="rm_ilan_koordinat_cifti",
            ),
            models.CheckConstraint(
                condition=(
                    Q(ilan_turu="ev", oda_turu__in=("studyo", "1+1", "2+1", "3+1"))
                    | Q(ilan_turu="oda", oda_turu__in=("tek_kisilik", "paylasimli"))
                ),
                name="rm_ilan_oda_turu",
            ),
        ]


class IlanFotografi(models.Model):
    ilan = models.ForeignKey(Ilan, related_name="fotograflar", on_delete=models.CASCADE, db_index=False)
    sira = models.PositiveSmallIntegerField()
    mime_turu = models.CharField(max_length=16)
    icerik = models.BinaryField()

    class Meta:
        db_table = "roommate_listing_photo"
        ordering = ("sira",)
        constraints = [
            models.UniqueConstraint(fields=["ilan", "sira"], name="rm_ilan_foto_sira_tekil"),
            models.CheckConstraint(condition=Q(sira__range=(1, 5)), name="rm_ilan_foto_sira_araligi"),
        ]
