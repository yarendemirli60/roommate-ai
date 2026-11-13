import { useState } from 'react'
import { formatRent, rentalLabel } from '../../data/demoListings'

export default function ListingCard({ listing, query }) {
  const [failed, setFailed] = useState(false)
  return <article className="listing-card">
    <a className="listing-card-link" href={`#/ilanlar/${listing.id}${query ? `?${query}` : ''}`}>
      <div className="listing-photo">
        {failed || !listing.photos.length ? <span className="listing-photo-fallback">⌂ Fotoğraf görüntülenemiyor</span> : <img src={listing.photos[0]} alt={`${listing.title} — ${listing.localDemo ? 'yerel önizleme' : 'temsili fotoğraf'}`} loading="lazy" onError={() => setFailed(true)} />}
        <span className="listing-type">{listing.type === 'ev' ? 'Ev' : 'Oda'}</span>
        <span className="listing-demo-tag">Demo ilan</span>
      </div>
      <div className="listing-card-body">
        <p className="listing-location">⌖ {listing.district}, {listing.city}</p>
        <h2>{listing.title}</h2>
        <p className="listing-specs">{listing.roomType} · {listing.area} m² · {listing.furnished ? 'Eşyalı' : 'Eşyasız'}</p>
        <div className="listing-card-bottom"><div><strong>{formatRent(listing.rent)}</strong><small>{rentalLabel(listing)}</small></div><span aria-hidden="true">↗</span></div>
      </div>
    </a>
  </article>
}
