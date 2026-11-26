import { useEffect, useRef, useState } from 'react'
import { api } from '../../api'
import { cities, locationCode, roomTypes } from '../../data/listings'

const initial = { ilan_turu: 'oda', baslik: '', aciklama: '', city: '', district: '', aylik_kira: '', oda_turu: '', alan_m2: '', esyali: 'true', enlem: '', boylam: '' }
const allowedImages = ['image/jpeg', 'image/png', 'image/webp']
const fieldNames = { baslik: 'İlan başlığı', aciklama: 'Açıklama', sehir_kodu: 'Şehir', ilce_kodu: 'İlçe', aylik_kira: 'Aylık kira', oda_turu: 'Oda türü', alan_m2: 'Alan', enlem: 'Enlem', boylam: 'Boylam', fotograf_dosyalari: 'Fotoğraflar' }

function fieldErrors(value) {
  if (typeof value === 'string') return [value]
  return value && typeof value === 'object' ? Object.values(value).flatMap(fieldErrors) : []
}

export default function ListingForm({ onCreate }) {
  const [data, setData] = useState(initial)
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const URLs = useRef(new Set())
  useEffect(() => {
    const urls = URLs.current
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)); urls.clear() }
  }, [])

  function change(name, value) {
    setError('')
    setData((old) => ({ ...old, [name]: value, ...(name === 'ilan_turu' ? { oda_turu: '' } : {}) }))
  }

  function selectPhotos(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    if (files.length + photos.length > 5 || files.some((file) => !allowedImages.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('En fazla 5 JPEG, PNG veya WebP fotoğrafı yükleyebilirsin. Her dosya en fazla 5 MB olabilir.')
      return
    }
    setError('')
    const next = files.map((file) => {
      const url = URL.createObjectURL(file)
      URLs.current.add(url)
      return { file, url }
    })
    setPhotos([...photos, ...next])
  }

  function removePhoto(url) {
    URL.revokeObjectURL(url)
    URLs.current.delete(url)
    setPhotos((previous) => previous.filter((photo) => photo.url !== url))
  }

  async function submit(event) {
    event.preventDefault()
    if (pending) return
    const { city, district, enlem, boylam, ...fields } = data
    const sehir_kodu = locationCode(city)
    const ilce_kodu = locationCode(district)
    if (!fields.baslik.trim() || !fields.aciklama.trim() || !sehir_kodu || !ilce_kodu || !photos.length) {
      setError('Başlığı, açıklamayı, şehri ve ilçeyi gir. En az bir fotoğraf ekle.')
      return
    }
    if (Boolean(enlem) !== Boolean(boylam)) {
      setError('Haritada göstermek için enlem ve boylamı birlikte gir.')
      return
    }
    const form = new FormData()
    for (const [name, value] of Object.entries({ ...fields, sehir_kodu, ilce_kodu })) form.append(name, value)
    if (enlem && boylam) { form.append('enlem', enlem); form.append('boylam', boylam) }
    for (const { file } of photos) form.append('fotograf_dosyalari', file)
    setPending(true)
    setError('')
    try {
      const listing = await api.createListing(form)
      onCreate(listing.id)
    } catch (failure) {
      const messages = Object.entries(failure.fields || {}).flatMap(([key, value]) => fieldErrors(value).map((message) => fieldNames[key] ? `${fieldNames[key]}: ${message}` : message))
      setError(messages.join(' ') || failure.message)
    } finally {
      setPending(false)
    }
  }

  const types = Object.entries(roomTypes).slice(...(data.ilan_turu === 'ev' ? [0, 4] : [4]))
  return <main className="listings-shell listing-form-shell">
    <a className="listing-back" href="#/ilanlar">← İlanlara dön</a>
    <header className="listings-heading"><h1>İlan oluştur</h1></header>
    <form className="listing-form" onSubmit={submit}>
      <fieldset disabled={pending}><legend>İlan türü</legend><div className="listing-type-choices">
        {[['oda', 'Bir oda'], ['ev', 'Evin tamamı']].map(([value, title]) => <label key={value} className={data.ilan_turu === value ? 'selected' : ''}>
          <input type="radio" name="listing-type" value={value} checked={data.ilan_turu === value} onChange={() => change('ilan_turu', value)} />
          <strong>{title}</strong>
        </label>)}
      </div></fieldset>
      <fieldset disabled={pending}><legend>İlan bilgileri</legend><div className="listing-form-grid">
        <label className="listing-wide">İlan başlığı<input required maxLength={100} value={data.baslik} onChange={(event) => change('baslik', event.target.value)} /></label>
        <label className="listing-wide">Açıklama<textarea required maxLength={3000} rows={5} value={data.aciklama} onChange={(event) => change('aciklama', event.target.value)} /></label>
        <label>Aylık kira (TL)<input required type="number" min="0.01" max="99999999.99" step="0.01" value={data.aylik_kira} onChange={(event) => change('aylik_kira', event.target.value)} /><small>{data.ilan_turu === 'ev' ? 'Evin tamamı' : 'Kişi başı'}</small></label>
        <label>Oda türü<select required value={data.oda_turu} onChange={(event) => change('oda_turu', event.target.value)}><option value="">Oda türü seç</option>{types.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <label>Alan (m²)<input required type="number" min="1" max="10000" step="1" value={data.alan_m2} onChange={(event) => change('alan_m2', event.target.value)} /></label>
        <label>Eşya durumu<select value={data.esyali} onChange={(event) => change('esyali', event.target.value)}><option value="true">Eşyalı</option><option value="false">Eşyasız</option></select></label>
      </div></fieldset>
      <fieldset disabled={pending}><legend>Konum</legend><div className="listing-form-grid">
        <label>Şehir<input required maxLength={24} list="listing-form-cities" value={data.city} onChange={(event) => change('city', event.target.value)} /></label>
        <datalist id="listing-form-cities">{cities.map((city) => <option key={city} value={city} />)}</datalist>
        <label>İlçe<input required maxLength={40} value={data.district} onChange={(event) => change('district', event.target.value)} /></label>
        <label>Enlem (isteğe bağlı)<input type="number" min="-90" max="90" step="0.000001" placeholder="40.990000" value={data.enlem} onChange={(event) => change('enlem', event.target.value)} /></label>
        <label>Boylam (isteğe bağlı)<input type="number" min="-180" max="180" step="0.000001" placeholder="29.030000" value={data.boylam} onChange={(event) => change('boylam', event.target.value)} /></label>
      </div><p className="listing-filter-note">İlanı haritada göstermek için yaklaşık bir konum gir.</p></fieldset>
      <fieldset disabled={pending}><legend>Fotoğraflar</legend>
        <label className="listing-upload"><strong>Fotoğraf seç</strong><small>JPEG, PNG veya WebP. En fazla 5 fotoğraf, her biri en fazla 5 MB.</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={photos.length >= 5} onChange={selectPhotos} /></label>
        <div className="listing-upload-previews">{photos.map(({ file, url }, index) => <div key={url}><img src={url} alt={file.name} /><span>{index === 0 ? 'Kapak' : `Fotoğraf ${index + 1}`}</span><button type="button" aria-label={`${file.name} fotoğrafını kaldır`} onClick={() => removePhoto(url)}>×</button></div>)}</div>
      </fieldset>
      {error && <p className="listing-form-error" role="alert">{error}</p>}
      <div className="listing-form-footer"><button className="primary-button" type="submit" disabled={pending}>{pending ? 'Yayınlanıyor…' : 'İlanı yayınla'}</button></div>
    </form>
  </main>
}
