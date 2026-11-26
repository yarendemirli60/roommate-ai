import { useState } from 'react'
import { formatRent, listingHref, locationName, rentalLabel, roomTypes } from '../../data/listings'

export default function ListingCard({ listing, query }) {
  const [failed, setFailed] = useState(false)
  return <article className="listing-card">
    <a className="listing-card-link" href={listingHref(listing.id, query)}>
      <div className="listing-photo">
        {failed || !listing.fotograflar.length ? <span className="listing-photo-fallback">Fotoğraf görüntülenemiyor</span>
          : <img src={listing.fotograflar[0]} alt={listing.baslik} loading="lazy" onError={() => setFailed(true)} />}
        <span className="listing-type">{listing.ilan_turu === 'ev' ? 'Ev' : 'Oda'}</span>
      </div>
      <div className="listing-card-body">
        <p className="listing-location">{locationName(listing.ilce_kodu)}, {locationName(listing.sehir_kodu)}</p>
        <h2>{listing.baslik}</h2>
        <p className="listing-specs">{roomTypes[listing.oda_turu]} · {listing.alan_m2} m² · {listing.esyali ? 'Eşyalı' : 'Eşyasız'}</p>
        <div className="listing-card-bottom"><div><strong>{formatRent(listing.aylik_kira)}</strong><small>{rentalLabel(listing)}</small></div><span aria-hidden="true">↗</span></div>
      </div>
    </a>
  </article>
}
