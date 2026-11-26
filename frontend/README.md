# RoomMate AI frontend

React/Vite arayüzü, Django REST API’yi oturum çerezi ve CSRF ile kullanır. Başlatma, PostgreSQL kurulumu ve Google Maps yapılandırması için proje kökündeki [README](../README.md) dosyasına bakın.

Ev ve oda ilanları `#/ilanlar` adresinde listelenir. `#/ilanlar/yeni` fotoğraflı ilan yayınlar ve `#/ilanlar/{id}` kalıcı kaydı açar. İlanlar ve adaylar sayfalar hâlinde yüklenir. Konumu olan ilanların işaretleri, Google Maps yapılandırıldığında arama sonuçlarıyla birlikte güncellenir.

`npm.cmd run lint` kod denetimini, `npm.cmd run build` derlemeyi çalıştırır. Yerel Vite sunucusu `/api` isteklerini Django’ya aktarır. Derlenmiş uygulama için de aynı kaynakta `/api` yönlendirmesi gerekir.
