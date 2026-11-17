import { useEffect, useRef, useState } from 'react'
import samplePhoto from '../../assets/hero.png'
import { locations, roomTypes } from '../../data/demoListings'

const initial = { type: 'oda', title: '', description: '', city: '', district: '', rent: '', roomType: '', area: '', furnished: 'true' }
const allowedImages = ['image/jpeg', 'image/png', 'image/webp']

export default function ListingForm({ onCreate }) {
  const [data, setData] = useState(initial)
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  function change(name, value) {
    setData((old) => ({ ...old, [name]: value, ...(name === 'city' ? { district: '' } : {}), ...(name === 'type' ? { roomType: '' } : {}) }))
  }
  async function selectPhotos(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setError('')
    if (files.length + photos.length > 5 || files.some((file) => !allowedImages.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('En fazla 5 fotoğraf seçebilirsin. Her dosya JPEG, PNG veya WebP biçiminde ve en fazla 5 MB olmalı.')
      return
    }
    setReading(true)
    try {
      const images = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Fotoğraf okunamadı. Başka bir dosya dene.'))
        reader.onload = () => {
          const image = new Image()
          image.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, src: reader.result })
          image.onerror = () => reject(new Error('Seçilen dosya geçerli bir fotoğraf olarak açılamadı.'))
          image.src = reader.result
        }
        reader.readAsDataURL(file)
      })))
      if (alive.current) setPhotos((old) => [...old, ...images])
    } catch (failure) { if (alive.current) setError(failure.message) }
    finally { if (alive.current) setReading(false) }
  }
  function submit(event) {
    event.preventDefault()
    setError('')
    if (!data.title.trim() || !data.description.trim() || !locations[data.city]?.includes(data.district) || !Number.isFinite(Number(data.rent)) || Number(data.rent) <= 0 || !Number.isFinite(Number(data.area)) || Number(data.area) <= 0 || !photos.length) {
      setError('Başlık, açıklama, geçerli konum, pozitif kira ve alan bilgisi ile en az bir fotoğraf ekle.')
      return
    }
    onCreate({ ...data, title: data.title.trim(), description: data.description.trim(), rent: Number(data.rent), area: Number(data.area), furnished: data.furnished === 'true', id: `yerel-${crypto.randomUUID()}`, localDemo: true, photos: photos.map((photo) => photo.src) })
  }
  const types = data.type === 'ev' ? roomTypes.slice(0, 4) : roomTypes.slice(4)
  return <main className="listings-shell listing-form-shell">
    <div className="listing-demo-banner"><strong>Demo — gerçek ilan yayınlanmaz.</strong> Form ve fotoğraflar yalnızca tarayıcı belleğinde tutulur. Sunucuya gönderilmez; sayfa yenilendiğinde kaybolur.</div>
    <a className="listing-back" href="#/ilanlar">← İlanlara dön</a>
    <header className="listings-heading"><div><span className="eyebrow">BİR ALANI PAYLAŞ, YENİ BİR HİKÂYE BAŞLAT</span><h1>Yerini <span>anlat.</span></h1><p>Evini veya odanı tanıtan bir demo ilan hazırla.</p></div></header>
    <form className="listing-form" onSubmit={submit}>
      <fieldset><legend>01 · Nasıl bir alan?</legend><div className="listing-type-choices">{[['oda', '⌑', 'Bir oda', 'Ortak yaşamda sana bir yer'], ['ev', '⌂', 'Evin tamamı', 'Yeni başlangıçlar için bir ev']].map(([value, icon, title, subtitle]) => <label key={value} className={data.type === value ? 'selected' : ''}><input type="radio" name="listing-type" value={value} checked={data.type === value} onChange={() => change('type', value)} /><span aria-hidden="true">{icon}</span><strong>{title}</strong><small>{subtitle}</small></label>)}</div></fieldset>
      <fieldset><legend>02 · İlan bilgileri</legend><div className="listing-form-grid">
        <label className="listing-wide">İlan başlığı<input required maxLength={100} value={data.title} onChange={(event) => change('title', event.target.value)} placeholder="Örn. Kadıköy’de aydınlık, eşyalı oda" /></label>
        <label className="listing-wide">Açıklama<textarea required maxLength={3000} rows={5} value={data.description} onChange={(event) => change('description', event.target.value)} placeholder="Alanı, ortak kullanım olanaklarını ve çevreyi anlat…" /><small>{data.description.length}/3000 karakter</small></label>
        <label>Şehir<select required value={data.city} onChange={(event) => change('city', event.target.value)}><option value="">Şehir seç</option>{Object.keys(locations).map((city) => <option key={city}>{city}</option>)}</select></label>
        <label>İlçe<select required disabled={!data.city} value={data.district} onChange={(event) => change('district', event.target.value)}><option value="">İlçe seç</option>{(locations[data.city] || []).map((district) => <option key={district}>{district}</option>)}</select></label>
        <label>Aylık kira (TL)<input required type="number" min="0.01" max="99999999.99" step="0.01" value={data.rent} onChange={(event) => change('rent', event.target.value)} placeholder="Örn. 12500" /><small>{data.type === 'ev' ? 'Evin tamamının aylık kirası' : 'Kişi başı aylık oda kirası'}</small></label>
        <label>Oda türü<select required value={data.roomType} onChange={(event) => change('roomType', event.target.value)}><option value="">Oda türü seç</option>{types.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>{data.type === 'ev' ? 'Ev alanı (m²)' : 'Oda alanı (m²)'}<input required type="number" min="1" max="10000" step="1" value={data.area} onChange={(event) => change('area', event.target.value)} /></label>
        <label>Eşya durumu<select value={data.furnished} onChange={(event) => change('furnished', event.target.value)}><option value="true">Eşyalı</option><option value="false">Eşyasız</option></select></label>
      </div><p className="listing-filter-note">Demo konum listesi sınırlıdır. Tam adres veya kişisel iletişim bilgisi eklemene gerek yok.</p></fieldset>
      <fieldset><legend>03 · Fotoğraflar</legend><label className="listing-upload"><span aria-hidden="true">＋</span><strong>{reading ? 'Fotoğraflar hazırlanıyor…' : 'Fotoğraf seç'}</strong><small>JPEG, PNG, WebP · En fazla 5 fotoğraf, her biri en fazla 5 MB · İlk fotoğraf kapaktır</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={reading || photos.length >= 5} onChange={selectPhotos} /></label>
        <button className="listing-text-button listing-sample-photo" type="button" disabled={reading || photos.length >= 5 || photos.some((photo) => photo.id === 'sample')} onClick={() => { setError(''); setPhotos((old) => [...old, { id: 'sample', name: 'Temsili fotoğraf', src: samplePhoto }]) }}>Örnek fotoğraf kullan</button>
        <div className="listing-upload-previews">{photos.map((photo, index) => <div key={photo.id}><img src={photo.src} alt={`Seçilen fotoğraf: ${photo.name}`} /><span>{index === 0 ? 'Kapak' : `Fotoğraf ${index + 1}`}</span><button type="button" aria-label={`${photo.name} fotoğrafını kaldır`} disabled={reading} onClick={() => setPhotos((old) => old.filter((item) => item.id !== photo.id))}>×</button></div>)}</div>
      </fieldset>
      {error && <p className="listing-form-error" role="alert">{error}</p>}
      <div className="listing-form-footer"><p>Veritabanına kaydedilmez.<br />Demo ilan yenilemede kaybolur.</p><button className="primary-button" type="submit" disabled={reading}>Demo listeye ekle ↗</button></div>
    </form>
  </main>
}
