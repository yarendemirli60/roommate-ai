export const roomTypes = {
  studyo: 'Stüdyo', '1+1': '1+1', '2+1': '2+1', '3+1': '3+1',
  tek_kisilik: 'Tek kişilik oda', paylasimli: 'Paylaşımlı oda',
}

export const cities = ['İstanbul', 'Ankara', 'İzmir', 'Eskişehir', 'Bursa', 'Antalya', 'Kocaeli']

export function locationCode(value) {
  return value.trim().toLocaleLowerCase('tr-TR').replaceAll('ı', 'i')
    .normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const placeNames = new Map([...cities, 'Kadıköy', 'Beşiktaş', 'Üsküdar', 'Çankaya', 'Yenimahalle',
  'Bornova', 'Buca', 'Karşıyaka', 'Tepebaşı', 'Odunpazarı'].map((name) => [locationCode(name), name]))

export function locationName(code) {
  return placeNames.get(code) ?? code.split('-').filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
}

export const rentalLabel = (listing) => listing.ilan_turu === 'ev' ? 'evin tamamı / ay' : 'kişi başı / ay'
export const formatRent = (rent) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(rent)

export function listingHref(id, query = '') {
  return `#/ilanlar/${id}${query ? `?${query}` : ''}`
}
