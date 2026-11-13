import { useState } from 'react'
import { formatRent, rentalLabel } from '../../data/demoListings'

export default function ListingDetail({ listing }) {
  const [selected, setSelected] = useState(0)
  const [failed, setFailed] = useState(false)
  const query = new URLSearchParams(window.location.hash.split('?')[1] || '').toString()
  const back = `#/ilanlar${query ? `?${query}` : ''}`
  if (!listing) return <main className="listings-shell"><div className="listing-demo-banner">Demo — örnek ilanlar, gerçek kayıt değildir.</div><section className="listing-empty"><h1>İlan bulunamadı</h1><p>Bu demo ilan mevcut değil veya sayfa yenilendiği için yerel önizleme sona erdi.</p><a className="primary-button" href={back}>İlanlara dön</a></section></main>
  return <main className="listings-shell">
    <div className="listing-demo-banner"><strong>Demo — örnek ilanlar, gerçek kayıt değildir.</strong> {listing.localDemo ? 'Bu ilan yalnızca bu sayfa oturumunda tutulur. Yenilemede kaybolur; veritabanına kaydedilmedi.' : 'Fotoğraflar ve ilan bilgileri temsilidir.'}</div>
    <a className="listing-back" href={back}>← İlanlara dön</a>
    <header className="listings-heading"><div><span className="eyebrow">{listing.type === 'ev' ? 'EVİN TAMAMI' : 'ODA'} · DEMO İLAN</span><h1>{listing.title}</h1><p>⌖ {listing.district}, {listing.city}</p></div></header>
    <div className="listing-detail-grid"><section aria-label="İlan fotoğrafları"><div className="listing-gallery-main">{failed || !listing.photos.length ? <div className="listing-photo-fallback">⌂ Fotoğraf görüntülenemiyor</div> : <img src={listing.photos[selected]} alt={`${listing.title}, fotoğraf ${selected + 1}`} onError={() => setFailed(true)} />}<span className="listing-demo-tag">{listing.localDemo ? 'Yerel önizleme' : 'Temsili fotoğraf'}</span></div>
      {listing.photos.length > 1 && <div className="listing-thumbnails" aria-label="Fotoğraf seçimi">{listing.photos.map((photo, index) => <button key={index} aria-label={`${index + 1}. fotoğrafı göster`} aria-pressed={selected === index} onClick={() => { setSelected(index); setFailed(false) }}><img src={photo} alt={`Fotoğraf ${index + 1} küçük resmi`} /></button>)}</div>}
      <section className="listing-description"><h2>Bu alan hakkında</h2><p>{listing.description}</p></section>
    </section><aside className="listing-detail-summary"><span className="listing-type-inline">{listing.type === 'ev' ? 'Ev ilanı' : 'Oda ilanı'}</span><h2>{formatRent(listing.rent)}</h2><p>{rentalLabel(listing)}</p><dl><div><dt>Oda türü</dt><dd>{listing.roomType}</dd></div><div><dt>{listing.type === 'ev' ? 'Ev alanı' : 'Oda alanı'}</dt><dd>{listing.area} m²</dd></div><div><dt>Eşya durumu</dt><dd>{listing.furnished ? 'Eşyalı' : 'Eşyasız'}</dd></div><div><dt>Konum</dt><dd>{listing.district}, {listing.city}</dd></div></dl>
      {listing.localDemo ? <div className="listing-filter-note">Bu ilanı sen oluşturdun.</div> : <>
        <div className="listing-filter-note">İlan sahibiyle sohbet etmeyi demo olarak deneyebilirsin.</div>
        <a className="primary-button" href={`#/mesajlar/${listing.id}`}>Mesaj Gönder</a>
      </>}
      <a className="inline-link listing-create-link" href="#/ilanlar/yeni">Sen de demo ilan oluştur ↗</a>
    </aside></div>
  </main>
}
