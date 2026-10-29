from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers


User = get_user_model()


class KayitSerializer(serializers.Serializer):
    kullanici_adi = serializers.CharField(
        max_length=150,
        validators=[UnicodeUsernameValidator()],
        error_messages={
            "required": "Kullanıcı adı zorunludur.",
            "blank": "Kullanıcı adı boş bırakılamaz.",
            "max_length": "Kullanıcı adı en fazla 150 karakter olabilir.",
        },
    )

    eposta = serializers.EmailField(
        max_length=254,
        error_messages={
            "required": "E-posta adresi zorunludur.",
            "blank": "E-posta adresi boş bırakılamaz.",
            "invalid": "Geçerli bir e-posta adresi girin.",
            "max_length": "E-posta adresi en fazla 254 karakter olabilir.",
        },
    )

    sifre = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        error_messages={
            "required": "Şifre zorunludur.",
            "blank": "Şifre boş bırakılamaz.",
        },
    )

    def validate_kullanici_adi(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Bu kullanıcı adı zaten kullanılıyor."
            )
        return value

    def validate_eposta(self, value):
        value = value.lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Bu e-posta adresi zaten kayıtlı."
            )
        return value

    def validate(self, attrs):
        kullanici = User(
            username=attrs["kullanici_adi"],
            email=attrs["eposta"],
        )

        try:
            validate_password(attrs["sifre"], user=kullanici)
        except DjangoValidationError as hata:
            raise serializers.ValidationError({
                "sifre": hata.messages
            })

        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["kullanici_adi"],
            email=validated_data["eposta"],
            password=validated_data["sifre"],
        )
class GirisSerializer(serializers.Serializer):
    kullanici_adi = serializers.CharField(
        error_messages={
            "required": "Kullanıcı adı zorunludur.",
            "blank": "Kullanıcı adı boş bırakılamaz.",
        }
    )

    sifre = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        error_messages={
            "required": "Şifre zorunludur.",
            "blank": "Şifre boş bırakılamaz.",
        }
    )