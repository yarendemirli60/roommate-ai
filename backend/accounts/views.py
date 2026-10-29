from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_protect

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import GirisSerializer, KayitSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def kayit(request):
    serializer = KayitSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    kullanici = serializer.save()

    return Response(
        {
            "mesaj": "Kayıt başarılı.",
            "kullanici": {
                "id": kullanici.pk,
                "kullanici_adi": kullanici.username,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@csrf_protect
@api_view(["POST"])
@permission_classes([AllowAny])
def giris(request):
    serializer = GirisSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    kullanici = authenticate(
        request=request,
        username=serializer.validated_data["kullanici_adi"],
        password=serializer.validated_data["sifre"],
    )

    if kullanici is None:
        return Response(
            {"mesaj": "Kullanıcı adı veya şifre hatalı."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login(request, kullanici)

    return Response(
        {
            "mesaj": "Giriş başarılı.",
            "kullanici": {
                "id": kullanici.pk,
                "kullanici_adi": kullanici.username,
            },
        },
        status=status.HTTP_200_OK,
    )


@csrf_protect
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cikis(request):
    logout(request)

    return Response(
        {"mesaj": "Çıkış başarılı."},
        status=status.HTTP_200_OK,
    )