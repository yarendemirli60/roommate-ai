import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { listingHref } from '../../data/listings'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID'
let mapsPromise

function loadMaps() {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  mapsPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const callback = '__roommateMapsReady'
    const timeout = window.setTimeout(fail, 15000)
    function finish() {
      window.clearTimeout(timeout)
      delete window[callback]
    }
    function fail() {
      finish()
      script.remove()
      mapsPromise = undefined
      reject(new Error('Harita yüklenemedi.'))
    }
    window[callback] = () => {
      finish()
      resolve(window.google.maps)
    }
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({ key: apiKey, callback, loading: 'async', language: 'tr', region: 'TR', v: 'weekly' })}`
    script.async = true
    script.onerror = fail
    document.head.append(script)
  })
  return mapsPromise
}

function GoogleListingsMap({ listings, query }) {
  const target = useRef(null)
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    const element = target.current
    let active = true
    let markers = []
    let listeners = []
    const previousAuthFailure = window.gm_authFailure
    const authFailure = () => {
      if (active) setStatus('error')
      previousAuthFailure?.()
    }
    window.gm_authFailure = authFailure
    async function draw() {
      const maps = await loadMaps()
      const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
        maps.importLibrary('maps'), maps.importLibrary('marker'),
      ])
      if (!active) return
      const positions = listings.map(({ enlem, boylam }) => ({ lat: enlem, lng: boylam }))
      const map = new Map(element, { center: positions[0], zoom: 13, mapId })
      const bounds = new maps.LatLngBounds()
      markers = listings.map((listing, index) => {
        const position = positions[index]
        bounds.extend(position)
        const marker = new AdvancedMarkerElement({ map, position, title: listing.baslik, gmpClickable: true })
        const open = () => { window.location.hash = listingHref(listing.id, query).slice(1) }
        marker.addEventListener('gmp-click', open)
        listeners.push(() => marker.removeEventListener('gmp-click', open))
        return marker
      })
      if (positions.length > 1 && !bounds.getNorthEast().equals(bounds.getSouthWest())) map.fitBounds(bounds, 44)
      setStatus((current) => current === 'error' ? current : 'ready')
    }
    draw().catch(() => { if (active) setStatus('error') })
    return () => {
      active = false
      listeners.forEach((remove) => remove())
      listeners = []
      markers.forEach((marker) => { marker.map = null })
      element.replaceChildren()
      if (window.gm_authFailure === authFailure) {
        if (previousAuthFailure) window.gm_authFailure = previousAuthFailure
        else delete window.gm_authFailure
      }
    }
  }, [listings, query])
  return <section className="listing-map-panel" aria-label="İlan haritası">
    {status === 'loading' && <p role="status">Harita yükleniyor…</p>}
    {status === 'error' && <p role="status">Google Maps açılamadı. İlanları aşağıdaki listeden inceleyebilirsin.</p>}
    <div ref={target} className="listing-map" hidden={status === 'error'} />
  </section>
}

function OpenStreetListingsMap({ listings, query }) {
  const target = useRef(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const element = target.current
    let active = true
    let map
    async function draw() {
      const { default: leaflet } = await import('leaflet')
      if (!active) return
      map = leaflet.map(element, { scrollWheelZoom: false })
      const points = listings.map(({ enlem, boylam }) => [enlem, boylam])
      const bounds = leaflet.latLngBounds(points)
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.setView(points[0], 13)
      else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 })

      const icon = leaflet.divIcon({
        className: 'listing-map-pin', iconSize: [24, 24], iconAnchor: [12, 12],
      })
      for (const [index, listing] of listings.entries()) {
        const label = document.createElement('span')
        label.textContent = listing.baslik
        leaflet.marker(points[index], { icon, title: listing.baslik, alt: listing.baslik })
          .addTo(map).bindTooltip(label, { direction: 'top', offset: [0, -12] })
          .on('click', () => { window.location.hash = listingHref(listing.id, query).slice(1) })
      }
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        referrerPolicy: 'strict-origin-when-cross-origin',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on('tileerror', () => {
        if (active) setStatus('tiles-unavailable')
      }).addTo(map)
      setStatus('ready')
    }
    draw().catch(() => { if (active) setStatus('error') })
    return () => { active = false; map?.remove() }
  }, [listings, query])

  return <section className="listing-map-panel" aria-label="İlan haritası">
    {status === 'loading' && <p role="status">Harita yükleniyor…</p>}
    {status === 'tiles-unavailable' && <p role="status">Harita zemini yüklenemedi. İşaretlerden veya listeden ilanları açabilirsin.</p>}
    {status === 'error' && <p role="status">Harita açılamadı. İlanları aşağıdaki listeden inceleyebilirsin.</p>}
    <div ref={target} className="listing-map" hidden={status === 'error'} />
  </section>
}

export default function ListingsMap({ listings, query }) {
  const mapped = listings.filter(({ enlem, boylam }) => Number.isFinite(enlem) && Number.isFinite(boylam))
  if (!mapped.length) return <p className="surface listing-map-panel">Bu sayfada konumu işaretlenmiş ilan yok.</p>
  return apiKey ? <GoogleListingsMap listings={mapped} query={query} />
    : <OpenStreetListingsMap listings={mapped} query={query} />
}
