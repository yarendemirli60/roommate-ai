import { useEffect, useState } from 'react'
import { locations, roomTypes } from '../../data/demoListings'
import ListingCard from './ListingCard'

const empty = { city: '', district: '', min: '', max: '', room: '' }
function readFilters() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const city = params.get('city') || ''
  const district = params.get('district') || ''
  const room = params.get('room') || ''
  const knownCity = Object.hasOwn(locations, city) ? city : ''
  return { city: knownCity, district: knownCity && locations[knownCity].includes(district) ? district : '', min: params.get('min') || '', max: params.get('max') || '', room: roomTypes.includes(room) ? room : '' }
}

export default function ListingsPage({ listings }) {
  const [filters, setFilters] = useState(readFilters)
  useEffect(() => {
    const sync = () => setFilters(readFilters())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '')).toString()
  const invalid = [filters.min, filters.max].some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0)) || (filters.min !== '' && filters.max !== '' && Number(filters.min) > Number(filters.max))
  function change(name, value) {
    const next = { ...filters, [name]: value, ...(name === 'city' ? { district: '' } : {}) }
    setFilters(next)
    const params = new URLSearchParams(Object.entries(next).filter(([, item]) => item !== '')).toString()
    window.history.replaceState(null, '', `#/ilanlar${params ? `?${params}` : ''}`)
  }
  function reset() {
    setFilters(empty)
    window.history.replaceState(null, '', '#/ilanlar')
  }
  const results = invalid ? [] : listings.filter((item) => (!filters.city || item.city === filters.city) && (!filters.district || item.district === filters.district) && (filters.min === '' || item.rent >= Number(filters.min)) && (filters.max === '' || item.rent <= Number(filters.max)) && (!filters.room || item.roomType === filters.room))
  return <main className="listings-shell">
    <div className="listing-demo-banner"><strong>Demo — örnek ilanlar, gerçek kayıt değildir.</strong> Fotoğraflar temsilidir. Kiralama veya iletişim işlemi yapılmaz.</div>
    <header className="listings-heading"><div><span className="eyebrow">YENİ BİR ADRESE, BİRLİKTE</span><h1>Kendine bir <span>yer bul.</span></h1><p>Bir oda, bir ev, yeni bir başlangıç. Sana uygun alanı keşfet.</p></div><a className="primary-button" href="#/ilanlar/yeni">+ Demo ilan oluştur</a></header>
    <div className="listings-layout">
      <aside className="listing-filters" aria-label="İlan filtreleri"><div className="listing-section-heading"><h2>Aramanı daralt</h2><button className="listing-text-button" onClick={reset}>Sıfırla</button></div>
        <label>Şehir<select value={filters.city} onChange={(event) => change('city', event.target.value)}><option value="">Tüm şehirler</option>{Object.keys(locations).map((city) => <option key={city}>{city}</option>)}</select></label>
        <label>İlçe<select value={filters.district} disabled={!filters.city} onChange={(event) => change('district', event.target.value)}><option value="">{filters.city ? 'Tüm ilçeler' : 'Önce şehir seç'}</option>{(locations[filters.city] || []).map((district) => <option key={district}>{district}</option>)}</select></label>
        <div className="listing-rent-fields"><label>Min. kira (TL)<input type="number" min="0" step="0.01" placeholder="0" value={filters.min} onChange={(event) => change('min', event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? 'rent-error' : undefined} /></label><label>Maks. kira (TL)<input type="number" min="0" step="0.01" placeholder="Üst sınır yok" value={filters.max} onChange={(event) => change('max', event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? 'rent-error' : undefined} /></label></div>
        {invalid && <p id="rent-error" className="listing-field-error" role="alert">Geçerli, negatif olmayan bir kira aralığı gir. Minimum tutar maksimumu aşamaz.</p>}
        <label>Oda türü<select value={filters.room} onChange={(event) => change('room', event.target.value)}><option value="">Tüm oda türleri</option>{roomTypes.map((room) => <option key={room}>{room}</option>)}</select></label>
        <p className="listing-filter-note">Kira aylıktır. Ev ilanlarında toplam, oda ilanlarında kişi başı tutar gösterilir. Demo konum seçenekleri sınırlıdır.</p>
      </aside>
      <section aria-label="Örnek ilanlar"><div className="listing-results-heading"><p role="status" aria-live="polite"><strong>{results.length}</strong> örnek ilan{query ? ' · Filtreler uygulandı' : ' · Keşfetmeye başla'}</p><span>Yalnızca demo</span></div>
        {results.length ? <div className="listing-grid">{results.map((listing) => <ListingCard key={listing.id} listing={listing} query={query} />)}</div> : <div className="listing-empty"><span aria-hidden="true">⌕</span><h2>{invalid ? 'Kira aralığını kontrol et' : 'Bu aramada örnek ilan yok'}</h2><p>Filtreleri değiştirerek yeniden deneyebilirsin.</p><button className="primary-button" onClick={reset}>Filtreleri temizle</button></div>}
      </section>
    </div>
  </main>
}
