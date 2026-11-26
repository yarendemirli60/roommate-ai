import { useEffect, useState } from 'react'
import { api } from '../../api'
import { formatRent, locationName, rentalLabel, roomTypes } from '../../data/listings'

export default function ListingDetail({ id }) {
  const [listing, setListing] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState(0)
  const [failed, setFailed] = useState(false)
  const query = new URLSearchParams(window.location.hash.split('?')[1] || '').toString()
  const back = `#/ilanlar${query ? `?${query}` : ''}`

  useEffect(() => {
    let active = true
    api.getListing(id).then(
      (data) => { if (active) setListing(data) },
      (failure) => { if (active) setError(failure) },
    )
    return () => { active = false }
  }, [id, attempt])

  if (error || !listing) return <main className="listings-shell">
    <a className="listing-back" href={back}>← İlanlara dön</a>
    {error ? <section className="listing-empty">
      <h1>{error.status === 404 ? 'İlan bulunamadı' : 'İlan yüklenemedi'}</h1>
      {error.status !== 404 && <><p role="alert">{error.message}</p><button type="button" className="primary-button" onClick={() => { setError(null); setAttempt(attempt + 1) }}>Yeniden dene</button></>}
    </section> : <p role="status">İlan yükleniyor…</p>}
  </main>

  const location = `${locationName(listing.ilce_kodu)}, ${locationName(listing.sehir_kodu)}`
  return <main className="listings-shell">
    <a className="listing-back" href={back}>← İlanlara dön</a>
    <header className="listings-heading"><div><h1>{listing.baslik}</h1><p>{location}</p></div></header>
    <div className="listing-detail-grid">
      <section aria-label="İlan fotoğrafları">
        <div className="listing-gallery-main">{failed || !listing.fotograflar.length
          ? <div className="listing-photo-fallback">Fotoğraf görüntülenemiyor</div>
          : <img src={listing.fotograflar[selected]} alt={`${listing.baslik}, fotoğraf ${selected + 1}`} onError={() => setFailed(true)} />}</div>
        {listing.fotograflar.length > 1 && <div className="listing-thumbnails" aria-label="Fotoğraf seçimi">
          {listing.fotograflar.map((photo, index) => <button type="button" key={photo} aria-label={`${index + 1}. fotoğrafı göster`} aria-pressed={selected === index} onClick={() => { setSelected(index); setFailed(false) }}>
            <img src={photo} alt="" />
          </button>)}
        </div>}
        <section className="listing-description"><h2>Açıklama</h2><p>{listing.aciklama}</p></section>
      </section>
      <aside className="listing-detail-summary">
        <span className="listing-type-inline">{listing.ilan_turu === 'ev' ? 'Ev ilanı' : 'Oda ilanı'}</span>
        <h2>{formatRent(listing.aylik_kira)}</h2><p>{rentalLabel(listing)}</p>
        <dl>
          <div><dt>Oda türü</dt><dd>{roomTypes[listing.oda_turu]}</dd></div>
          <div><dt>Alan</dt><dd>{listing.alan_m2} m²</dd></div>
          <div><dt>Eşya durumu</dt><dd>{listing.esyali ? 'Eşyalı' : 'Eşyasız'}</dd></div>
        </dl>
        {Number.isFinite(listing.enlem) && Number.isFinite(listing.boylam) &&
          <p><a className="inline-link" href={`https://www.google.com/maps/search/?api=1&query=${listing.enlem},${listing.boylam}`} target="_blank" rel="noreferrer">Google Maps’te aç</a></p>}
        {listing.sahip_profil_id && <a className="primary-button" href={`#/mesajlar/${listing.sahip_profil_id}`}>İlan sahibine mesaj gönder</a>}
      </aside>
    </div>
  </main>
}
