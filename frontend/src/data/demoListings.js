// Fictional UI fixtures. These are not API responses or database records.
export const locations = {
  İstanbul: ['Kadıköy', 'Beşiktaş', 'Üsküdar'],
  Ankara: ['Çankaya', 'Yenimahalle'],
  İzmir: ['Bornova', 'Buca', 'Karşıyaka'],
  Eskişehir: ['Tepebaşı', 'Odunpazarı'],
}

export const roomTypes = ['Stüdyo', '1+1', '2+1', '3+1', 'Tek kişilik oda', 'Paylaşımlı oda']
export const rentalLabel = (listing) => listing.type === 'ev' ? 'evin tamamı / ay' : 'kişi başı / ay'
export const formatRent = (rent) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(rent)

const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`
export const demoListings = [
  { id: 'ornek-1', title: 'Kadıköy’de ışık dolu bir oda', city: 'İstanbul', district: 'Kadıköy', rent: 12500, type: 'oda', roomType: 'Tek kişilik oda', furnished: true, area: 18, description: 'Bu örnek oda ilanı, ortak yaşam alanını ve oda detaylarını göstermek için hazırlanmıştır. Aydınlık oda, ortak mutfak ve çalışma alanı tasviri tamamen kurgusaldır.', photos: [photo('photo-1616486338812-3dadae4b4ace'), photo('photo-1600210492486-724fe5c67fb0')] },
  { id: 'ornek-2', title: 'Bornova’da yeni başlangıçlara yer aç', city: 'İzmir', district: 'Bornova', rent: 22000, type: 'ev', roomType: '2+1', furnished: true, area: 85, description: 'Geniş salonu ve iki odasıyla paylaşımlı yaşam için örnek bir ev. Konum, fiyat ve tüm özellikler yalnızca arayüzü denemek içindir.', photos: [photo('photo-1600210492486-724fe5c67fb0')] },
  { id: 'ornek-3', title: 'Çankaya’da sakin bir çalışma köşesi', city: 'Ankara', district: 'Çankaya', rent: 9500, type: 'oda', roomType: 'Tek kişilik oda', furnished: true, area: 16, description: 'Öğrenci yaşamını anlatan kurgusal bir oda ilanı. Gerçek bir ev sahibi veya kiralama teklifi bulunmaz.', photos: [photo('photo-1616486029423-aaa4789e8c9a')] },
  { id: 'ornek-4', title: 'Tepebaşı’nda kompakt, sıcak bir ev', city: 'Eskişehir', district: 'Tepebaşı', rent: 15000, type: 'ev', roomType: '1+1', furnished: false, area: 55, description: 'Kendi tarzını yansıtabileceğin eşyasız bir ev için örnek detay metni. İlanın tüm bilgileri kurgusaldır.', photos: [photo('photo-1600607687939-ce8a6c25118c')] },
  { id: 'ornek-5', title: 'Beşiktaş’ta paylaşmaya açık bir yaşam', city: 'İstanbul', district: 'Beşiktaş', rent: 8000, type: 'oda', roomType: 'Paylaşımlı oda', furnished: true, area: 22, description: 'Paylaşımlı oda kartını ve kişi başı fiyat gösterimini denemek için hazırlanmış örnek ilan.', photos: [photo('photo-1616486338812-3dadae4b4ace')] },
  { id: 'ornek-6', title: 'Karşıyaka’da ferah bir stüdyo', city: 'İzmir', district: 'Karşıyaka', rent: 18000, type: 'ev', roomType: 'Stüdyo', furnished: true, area: 40, description: 'Stüdyo ev filtresini deneyebileceğin kurgusal bir ilan. Fotoğraf temsilidir, gerçek bir kiralık konutu göstermez.', photos: [photo('photo-1616486029423-aaa4789e8c9a')] },
]
