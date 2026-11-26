import { useEffect, useState } from 'react'
import { api } from '../../api'
import { cities, locationCode, locationName, roomTypes } from '../../data/listings'
import ListingCard from './ListingCard'
import ListingsMap from './ListingsMap'

const empty = { city: '', districts: '', min: '', max: '', room: '' }

function readSearch() {
  const query = window.location.hash.split('?')[1] || ''
  const params = new URLSearchParams(query)
  const city = params.get('sehir')
  return {
    query,
    filters: {
      city: city ? locationName(city) : '',
      districts: params.getAll('ilce').filter(Boolean).map(locationName).join(', '),
      min: params.get('min_kira') || '',
      max: params.get('max_kira') || '',
      room: params.get('oda_turu') || '',
    },
  }
}

export default function ListingsPage() {
  const [search, setSearch] = useState(readSearch)
  const [filters, setFilters] = useState(search.filters)
  const [response, setResponse] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [showMap, setShowMap] = useState(false)
  const [formError, setFormError] = useState('')
  const { query } = search
  const result = response?.query === query && response.attempt === attempt ? response : null

  useEffect(() => {
    function sync() {
      const next = readSearch()
      setSearch(next)
      setFilters(next.filters)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    let active = true
    api.getListings(query).then(
      (data) => { if (active) setResponse({ query, attempt, data }) },
      (error) => { if (active) setResponse({ query, attempt, error: error.message }) },
    )
    return () => { active = false }
  }, [query, attempt])

  function change(name, value) {
    setFilters((previous) => ({ ...previous, [name]: value }))
    setFormError('')
  }

  function apply(event) {
    event.preventDefault()
    if (filters.min && filters.max && Number(filters.min) > Number(filters.max)) {
      setFormError('En düşük kira, en yüksek kirayı aşamaz.')
      return
    }
    const params = new URLSearchParams()
    const city = locationCode(filters.city)
    const districts = filters.districts.split(',').map(locationCode).filter(Boolean)
    if ((filters.city.trim() && !city) || (filters.districts.trim() && !districts.length)) {
      setFormError('Şehir ve ilçe adlarında harf veya rakam kullan.')
      return
    }
    if (city) params.set('sehir', city)
    for (const district of new Set(districts)) params.append('ilce', district)
    for (const [key, value] of [['min_kira', filters.min], ['max_kira', filters.max], ['oda_turu', filters.room]]) {
      if (value) params.set(key, value)
    }
    window.location.hash = `/ilanlar${params.size ? `?${params}` : ''}`
  }

  function reset() {
    setFilters(empty)
    setFormError('')
    window.location.hash = '/ilanlar'
  }

  function pageHref(url) {
    return `#/ilanlar?${new URL(url, window.location.origin).searchParams}`
  }

  const rows = result?.data?.results || []
  return <main className="listings-shell">
    <header className="listings-heading">
      <div><h1>Ev ve oda ilanları</h1><p>Konuma, kiraya ve oda türüne göre ara.</p></div>
      <a className="primary-button" href="#/ilanlar/yeni">İlan oluştur</a>
    </header>
    <div className="listings-layout">
      <form className="listing-filters" aria-label="İlan filtreleri" onSubmit={apply}>
        <div className="listing-section-heading"><h2>Filtreler</h2><button type="button" className="listing-text-button" onClick={reset}>Sıfırla</button></div>
        <label>Şehir<input list="listing-cities" value={filters.city} onChange={(event) => change('city', event.target.value)} /></label>
        <datalist id="listing-cities">{cities.map((city) => <option key={city} value={city} />)}</datalist>
        <label>İlçeler<input value={filters.districts} onChange={(event) => change('districts', event.target.value)} placeholder="Kadıköy, Üsküdar" /><small>Birden fazla ilçeyi virgülle ayır.</small></label>
        <div className="listing-rent-fields">
          <label>Min. kira (TL)<input type="number" min="0" max="99999999.99" step="0.01" value={filters.min} onChange={(event) => change('min', event.target.value)} /></label>
          <label>Maks. kira (TL)<input type="number" min="0" max="99999999.99" step="0.01" value={filters.max} onChange={(event) => change('max', event.target.value)} /></label>
        </div>
        <label>Oda türü<select value={filters.room} onChange={(event) => change('room', event.target.value)}>
          <option value="">Tüm oda türleri</option>{Object.entries(roomTypes).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select></label>
        {formError && <p className="listing-field-error" role="alert">{formError}</p>}
        <button type="submit" className="primary-button">Filtrele</button>
      </form>
      <section aria-label="İlan sonuçları">
        {!result && <p role="status">İlanlar yükleniyor…</p>}
        {result?.error && <div className="surface" role="alert"><p>{result.error}</p><button type="button" className="listing-text-button" onClick={() => setAttempt(attempt + 1)}>Yeniden dene</button></div>}
        {result?.data && <>
          <div className="listing-results-heading">
            <p role="status"><strong>{result.data.count}</strong> ilan</p>
            {rows.length > 0 && <button type="button" className="listing-text-button" aria-pressed={showMap} onClick={() => setShowMap((value) => !value)}>Harita</button>}
          </div>
          {showMap && rows.length > 0 && <ListingsMap key={query} listings={rows} query={query} />}
          {rows.length ? <div className="listing-grid">{rows.map((listing) => <ListingCard key={listing.id} listing={listing} query={query} />)}</div>
            : <div className="listing-empty"><h2>İlan bulunamadı</h2><p>{query ? 'Filtreleri değiştirip yeniden ara.' : 'İlk ilanı oluşturabilirsin.'}</p></div>}
          {(result.data.previous || result.data.next) && <nav className="listing-pagination" aria-label="İlan sayfaları">
            {result.data.previous && <a className="inline-link" href={pageHref(result.data.previous)}>Önceki sayfa</a>}
            {result.data.next && <a className="inline-link" href={pageHref(result.data.next)}>Sonraki sayfa</a>}
          </nav>}
        </>}
      </section>
    </div>
  </main>
}
