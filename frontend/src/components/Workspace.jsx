import { useEffect, useState } from 'react'
import { api, readSession } from '../api'

const labels = {
  kullanici_adi: 'Kullanıcı adı', eposta: 'E-posta', sifre: 'Şifre', ad: 'Ad', soyad: 'Soyad', yas: 'Yaş',
  sehir: 'Şehir', ilce: 'İlçe', meslek: 'Meslek', hakkimda: 'Hakkımda', kullanim_amaci: 'Arayışın',
  aranan_sehir: 'Aranan şehir', aranan_ilceler: 'Aranan ilçeler', kira_butcesi: 'Aylık bütçe',
  kira_butcesi_min: 'En düşük bütçe', kira_butcesi_max: 'En yüksek bütçe', tasinma_tarihi: 'Taşınma tarihi',
  sigara: 'Sigara kullanımı', sigara_durumu: 'Sigara durumu', evcil_hayvan: 'Evcil hayvan', temizlik: 'Temizlik',
  gurultu: 'Gürültü düzeyi', sigara_kabulu: 'Sigara tercihi', evcil_hayvan_kabulu: 'Evcil hayvan tercihi',
  minimum_temizlik: 'Minimum temizlik', maksimum_gurultu: 'Gürültü toleransı', non_field_errors: 'Form', detail: 'Bilgi', mesaj: 'Bilgi',
}
const links = [
  ['panel', '⌂', 'Genel bakış'], ['profil', '○', 'Profilim'], ['anket', '☷', 'Yaşam alışkanlıkları'],
  ['filtreler', '⌕', 'Konum ve bütçe'], ['adaylar', '♧', 'Ev arkadaşı adayları'],
  ['uyum', '✦', 'Uyumluluk sonuçları'], ['mesajlar', '◌', 'Mesajlar'],
]
const emptyProfile = {
  ad: '', soyad: '', yas: '', sehir: '', ilce: '', meslek: '', hakkimda: '', kullanim_amaci: 'ev_ariyorum',
  aranan_sehir: '', aranan_ilceler: [], kira_butcesi: '', kira_butcesi_min: '', kira_butcesi_max: '', tasinma_tarihi: '',
  sigara: '', sigara_durumu: '', evcil_hayvan: '', temizlik: '', gurultu: '',
  sigara_kabulu: '', evcil_hayvan_kabulu: '', minimum_temizlik: '', maksimum_gurultu: '',
}
const levels = [['1', '1 · Çok düşük'], ['2', '2 · Düşük'], ['3', '3 · Orta'], ['4', '4 · Yüksek'], ['5', '5 · Çok yüksek']]
const acceptance = [['evet', 'Evet'], ['hayir', 'Hayır'], ['fark_etmez', 'Fark etmez']]

function ErrorNotice({ error }) {
  if (!error) return null
  const fields = Object.entries(error.fields || {}).filter(([key]) => key !== 'detail' && key !== 'mesaj')
  return <div className="notice notice-error" role="alert">
    <strong>{error.message}</strong>
    {fields.length > 0 && <ul>{fields.map(([key, value]) => <li key={key}>{labels[key] || key}: {Array.isArray(value) ? value.join(' ') : String(value)}</li>)}</ul>}
  </div>
}

function Field({ name, value, onChange, label, hint, required, children, ...props }) {
  return <div className={`form-field ${props.type === 'textarea' ? 'wide-field' : ''}`}>
    <label htmlFor={name}>{label || labels[name]}{required && <span className="required-mark" aria-hidden="true"> *</span>}</label>
    {children
      ? <select id={name} name={name} aria-describedby={hint ? `${name}-hint` : undefined} value={value ?? ''} required={required} onChange={(e) => onChange(name, e.target.value)} {...props}>{children}</select>
      : props.type === 'textarea'
        ? <textarea id={name} name={name} aria-describedby={hint ? `${name}-hint` : undefined} value={value ?? ''} maxLength={1000} rows={4} onChange={(e) => onChange(name, e.target.value)} />
        : <input id={name} name={name} aria-describedby={hint ? `${name}-hint` : undefined} value={value ?? ''} required={required} onChange={(e) => onChange(name, e.target.value)} {...props} />}
    {hint && <small id={`${name}-hint`}>{hint}</small>}
  </div>
}

function SelectField({ name, value, onChange, options, ...props }) {
  return <Field name={name} value={value} onChange={onChange} {...props}>
    <option value="">Seçiniz</option>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
  </Field>
}

function Auth({ mode, onSession }) {
  const register = mode === 'kayit'
  const [data, setData] = useState({ kullanici_adi: '', eposta: '', sifre: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [visible, setVisible] = useState(false)
  const change = (name, value) => setData((old) => ({ ...old, [name]: value }))
  async function submit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (register) {
        await api.register({ ...data, kullanici_adi: data.kullanici_adi.trim(), eposta: data.eposta.trim() })
        setData((old) => ({ ...old, sifre: '' }))
        setSuccess(true)
      } else {
        const result = await api.login({ kullanici_adi: data.kullanici_adi.trim(), sifre: data.sifre })
        const session = await readSession(result.kullanici)
        if (!session.authenticated) throw new Error('Giriş yapıldı ancak profil bağlantısı doğrulanamadı. Tekrar deneyin.')
        onSession(session)
        window.location.hash = '/panel'
      }
    } catch (err) { setError(err) } finally { setBusy(false) }
  }
  return <main className="auth-layout">
    <aside className="auth-story">
      <span className="eyebrow">YENİ BİR BAŞLANGIÇ</span>
      <h1>Aynı evi.<br /><span>Aynı huzuru.</span></h1>
      <p>Ev arkadaşlığı, ortak bir adresin çok ötesinde. Kendini anlat, yaşam tarzını belirle ve ilk adımı at.</p>
      <div className="auth-story-note"><span>✦</span><div><strong>Uyum, seni tanımakla başlar.</strong><p>Profilin ve tercihlerin, arayışının pusulası.</p></div></div>
      <span className="auth-story-bottom">Birlikte yaşamak, uyumla başlar.</span>
    </aside>
    <section className="auth-card" aria-labelledby="auth-title">
      <a className="back-link" href="#/">← Ana sayfaya dön</a>
      <span className="eyebrow">ROOMMATE AI</span>
      <h2 id="auth-title">{register ? 'Yeni bir sayfa aç.' : 'Tekrar hoş geldin.'}</h2>
      <p>{register ? 'Hesabını oluştur, sana ait bir yaşam alanına ilk adımı at.' : 'Ev arkadaşı yolculuğuna kaldığın yerden devam et.'}</p>
      {success ? <div className="registration-success" role="status"><span className="success-circle">✓</span><h3>Hesabın oluşturuldu!</h3><p>Kullanıcı adınla giriş yaparak profilini oluşturabilirsin.</p><a className="primary-button" href="#/giris">Giriş yap →</a></div>
        : <form onSubmit={submit}>
          <ErrorNotice error={error} />
          <fieldset disabled={busy} className="form-stack">
            <Field name="kullanici_adi" value={data.kullanici_adi} onChange={change} required maxLength={150} autoComplete="username" autoCapitalize="none" spellCheck="false" placeholder="Kullanıcı adın" />
            {register && <Field name="eposta" value={data.eposta} onChange={change} required type="email" maxLength={254} autoComplete="email" placeholder="ornek@universite.edu.tr" />}
            <div className="password-field">
              <Field name="sifre" value={data.sifre} onChange={change} required type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} placeholder="Şifren" hint={register ? 'En az 8 karakter; yaygın, yalnızca sayısal veya kullanıcı adına benzer bir şifre seçme.' : undefined} />
              <button type="button" className="password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}>{visible ? 'Gizle' : 'Göster'}</button>
            </div>
            <button className="primary-button full-button" type="submit">{busy ? 'İşlem yapılıyor…' : register ? 'Hesap oluştur ↗' : 'Giriş yap ↗'}</button>
          </fieldset>
        </form>}
      <p className="auth-switch">{register ? 'Zaten hesabın var mı?' : 'Henüz hesabın yok mu?'} <a href={register ? '#/giris' : '#/kayit'}>{register ? 'Giriş yap' : 'Kayıt ol'}</a></p>
      <div className="privacy-note">◇ Şifren tarayıcıda saklanmaz. Oturumunu güvenle kapatabilirsin.</div>
    </section>
  </main>
}

function completion(profile) {
  return [
    { name: 'Kişisel profil', done: Boolean(profile), page: 'profil', text: 'Seni biraz daha yakından tanıyalım.' },
    { name: 'Yaşam alışkanlıkları', done: Boolean(profile && ['sigara', 'evcil_hayvan', 'temizlik', 'gurultu', 'sigara_kabulu', 'evcil_hayvan_kabulu', 'minimum_temizlik', 'maksimum_gurultu'].every((key) => profile[key] !== null && profile[key] !== '')), page: 'anket', text: 'Ortak yaşamda senin için önemli olanlar.' },
    { name: 'Konum ve bütçe', done: Boolean(profile?.aranan_sehir && profile.kira_butcesi_min !== null && profile.kira_butcesi_max !== null), page: 'filtreler', text: 'Yaşamak istediğin yer ve bütçe aralığın.' },
  ]
}

function Overview({ session }) {
  const steps = completion(session.profile)
  const done = steps.filter((step) => step.done).length
  return <>
    <div className="welcome-banner"><div><span className="eyebrow">SANA AİT BİR BAŞLANGIÇ</span><h1>Merhaba{session.profile?.ad ? `, ${session.profile.ad}` : ''} <span>✦</span></h1><p>Bir sonraki güzel ev arkadaşlığı, seni tanımakla başlasın.</p><a className="primary-button" href={`#/${steps.find((step) => !step.done)?.page || 'profil'}`}>{done === 3 ? 'Profilimi görüntüle' : 'Yolculuğuma devam et'} →</a></div><div className="welcome-symbol" aria-hidden="true">⌂<span>♡</span></div></div>
    <div className="dashboard-columns">
      <section className="surface"><div className="card-heading"><h2>Profil yolculuğun</h2><span className="pill">{done} / 3 tamamlandı</span></div><div className="progress-track" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={3} aria-label="Profil tamamlama"><span style={{ width: `${done / 3 * 100}%` }} /></div><div className="journey-list">{steps.map((step, index) => <a href={`#/${step.page}`} key={step.page}><span className={`step-number ${step.done ? 'completed' : ''}`}>{step.done ? '✓' : `0${index + 1}`}</span><div><strong>{step.name}</strong><p>{step.text}</p></div><span>↗</span></a>)}</div></section>
      <section className="surface next-card"><span className="feature-icon">✦</span><h2>Uyum için ilk adım</h2><p>Konumunu, bütçeni ve yaşam alışkanlıklarını profilinde bir araya getir.</p><div className="notice notice-soft">Aday önerileri ve AI sonuçları için sunucu bağlantısı henüz hazır değil. Profilini şimdiden tamamlayabilirsin.</div><a className="inline-link" href="#/uyum">Uyumluluk ekranı →</a></section>
    </div>
    {session.profile && <div className="saved-strip"><span className="online-dot" /><span>Profilin kayıtlı. Son güncelleme: {new Date(session.profile.guncellenme_tarihi).toLocaleString('tr-TR')}</span></div>}
  </>
}

function Habits({ data, change, required = true }) {
  return <>
    <div className="section-title"><span>01</span><div><h3>Senin yaşam tarzın</h3><p>Günlük yaşamını en iyi anlatan seçenekleri işaretle.</p></div></div>
    <div className="form-grid">
      <SelectField name="sigara_durumu" value={data.sigara_durumu} onChange={change} options={[["non_smoker", 'Sigara içmiyorum'], ['smoker', 'Sigara içiyorum'], ['occasional', 'Ara sıra içiyorum']]} required={required} />
      <SelectField name="evcil_hayvan" label="Evcil hayvanın var mı?" value={String(data.evcil_hayvan ?? '')} onChange={change} options={[["true", 'Evet'], ['false', 'Hayır']]} required={required} />
      <SelectField name="temizlik" label="Temizlik düzenin" value={data.temizlik} onChange={change} options={levels} required={required} hint="1: Rahat bir düzen · 5: Çok titiz" />
      <SelectField name="gurultu" label="Günlük gürültü düzeyin" value={data.gurultu} onChange={change} options={levels} required={required} hint="Müzik, konuşma ve günlük aktiviteler." />
    </div>
    <div className="section-title"><span>02</span><div><h3>Ev arkadaşından beklentilerin</h3><p>Ortak alanlarda seni rahat hissettiren tercihler.</p></div></div>
    <div className="form-grid">
      <SelectField name="sigara_kabulu" label="Sigara kullanan biriyle yaşar mısın?" value={data.sigara_kabulu} onChange={change} options={acceptance} required={required} />
      <SelectField name="evcil_hayvan_kabulu" label="Evcil hayvanla yaşamaya açık mısın?" value={data.evcil_hayvan_kabulu} onChange={change} options={acceptance} required={required} />
      <SelectField name="minimum_temizlik" label="Beklediğin en düşük temizlik düzeyi" value={data.minimum_temizlik} onChange={change} options={levels} required={required} />
      <SelectField name="maksimum_gurultu" label="Kabul ettiğin en yüksek gürültü düzeyi" value={data.maksimum_gurultu} onChange={change} options={levels} required={required} />
    </div>
  </>
}

function ProfileForm({ section, profile, onProfile }) {
  const [data, setData] = useState(() => {
    let draft = {}
    try {
      const search = JSON.parse(sessionStorage.getItem('roommate_search_draft') || 'null')
      if (search) {
        const [min, max] = (search.budget || '').split(':')
        draft = { aranan_sehir: search.city || profile?.aranan_sehir || '', kira_butcesi_min: min || profile?.kira_butcesi_min || '', kira_butcesi_max: max || profile?.kira_butcesi_max || '' }
      }
    } catch { /* Ignore an invalid browser-only search draft. */ }
    return { ...emptyProfile, ...profile, ...draft, sigara_durumu: profile?.sigara_durumu || (profile?.sigara === true ? 'smoker' : profile?.sigara === false ? 'non_smoker' : '') }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [savedSection, setSavedSection] = useState('')
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    if (!dirty) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function change(name, value) {
    setSaved(false)
    setDirty(true)
    setData((old) => ({ ...old, [name]: value, ...(name === 'sigara_durumu' ? { sigara: value === '' ? '' : value !== 'non_smoker' } : {}) }))
  }
  async function submit(event) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    if (data.kira_butcesi_min !== '' && data.kira_butcesi_min !== null && data.kira_butcesi_max !== '' && data.kira_butcesi_max !== null && Number(data.kira_butcesi_min) > Number(data.kira_butcesi_max)) {
      setError(new Error('En düşük bütçe, en yüksek bütçeden büyük olamaz. Konum ve bütçe alanlarını kontrol et.'))
      return
    }
    const payload = Object.fromEntries(Object.keys(emptyProfile).map((name) => [name, data[name]]))
    payload.aranan_ilceler = data.aranan_ilceler.map((item) => item.trim()).filter(Boolean)
    for (const name of ['yas', 'temizlik', 'gurultu', 'minimum_temizlik', 'maksimum_gurultu']) payload[name] = data[name] === '' || data[name] === null ? null : Number(data[name])
    for (const name of ['kira_butcesi', 'kira_butcesi_min', 'kira_butcesi_max', 'tasinma_tarihi']) payload[name] = data[name] || (data[name] === 0 ? '0' : null)
    for (const name of ['sigara', 'evcil_hayvan']) payload[name] = data[name] === '' || data[name] === null ? null : data[name] === true || data[name] === 'true'
    for (const name of ['ad', 'soyad', 'sehir', 'ilce', 'meslek', 'aranan_sehir']) payload[name] = String(payload[name] || '').trim()
    setBusy(true)
    try {
      const result = await (profile ? api.updateProfile(payload) : api.createProfile(payload))
      // Confirm persistence by reading the saved object back through the API.
      const verified = await api.getProfile()
      if (verified.id !== result.id) throw new Error('Profil kaydı doğrulanamadı. Sayfayı yenileyip tekrar kontrol et.')
      setData({ ...emptyProfile, ...verified })
      setDirty(false)
      sessionStorage.removeItem('roommate_search_draft')
      setSaved(true)
      setSavedSection(section)
      onProfile(verified)
    } catch (err) { setError(err) } finally { setBusy(false) }
  }
  const titles = { profil: ['Kendinden bahset.', 'İyi bir ev arkadaşlığı, birbirini tanımakla başlar.'], anket: ['Yaşam tarzın, senin ritmin.', 'Alışkanlıklarını ve ortak yaşamdan beklentilerini belirle.'], filtreler: ['Nerede yaşamak istersin?', 'Aradığın konumu ve aylık kişi başı kira bütçeni belirle.'] }
  if (!profile && section !== 'profil') return <EmptyState icon="○" title="Önce seni tanıyalım." text="Tercihlerini kaydetmeden önce temel profil bilgilerini oluşturmalısın." action="Profilimi oluştur →" href="#/profil" />
  return <>
    <div className="page-heading"><span className="eyebrow">{section === 'profil' ? 'SENİ TANIYALIM' : section === 'anket' ? 'ORTAK YAŞAM' : 'ARAMA TERCİHLERİN'}</span><h1>{titles[section][0]}</h1><p>{titles[section][1]}</p></div>
    <div className="profile-tabs">{[['profil', '01 · Profil'], ['anket', '02 · Alışkanlıklar'], ['filtreler', '03 · Konum ve bütçe']].map(([id, title]) => <a key={id} href={`#/${id}`} className={section === id ? 'active' : ''} aria-current={section === id ? 'page' : undefined}>{title}</a>)}</div>
    <form className="surface profile-form" onSubmit={submit}>
      <ErrorNotice error={error} />
      {saved && savedSection === section && <div className="notice notice-success" role="status">✓ Bilgilerin kaydedildi ve sunucudan tekrar okunarak doğrulandı.</div>}
      <fieldset disabled={busy}>
        {section === 'profil' && <>
          <div className="profile-intro"><div className="avatar large-avatar">{data.ad?.[0]?.toLocaleUpperCase('tr-TR') || '○'}</div><div><h2>{profile ? `${profile.ad} ${profile.soyad}` : 'Sana ait bir profil'}</h2><p>Yıldızlı alanlar zorunludur.</p></div><span className="pill">{profile ? 'Profil kayıtlı' : 'Yeni profil'}</span></div>
          <div className="form-grid">
            <Field name="ad" value={data.ad} onChange={change} required maxLength={50} autoComplete="given-name" placeholder="Adın" />
            <Field name="soyad" value={data.soyad} onChange={change} required maxLength={50} autoComplete="family-name" placeholder="Soyadın" />
            <Field name="yas" value={data.yas} onChange={change} required type="number" min={18} max={120} placeholder="18 ve üzeri" />
            <Field name="meslek" value={data.meslek} onChange={change} required maxLength={100} placeholder="Örn. Üniversite öğrencisi" />
            <Field name="sehir" label="Şu an yaşadığın şehir" value={data.sehir} onChange={change} required maxLength={50} autoComplete="address-level1" placeholder="Örn. İstanbul" />
            <Field name="ilce" label="Şu an yaşadığın ilçe" value={data.ilce} onChange={change} required maxLength={50} autoComplete="address-level2" placeholder="Örn. Kadıköy" />
            <div className="wide-field"><SelectField name="kullanim_amaci" label="Nasıl bir ev arkadaşlığı arıyorsun?" value={data.kullanim_amaci} onChange={change} required options={[["ev_ariyorum", 'Taşınabileceğim bir ev arıyorum'], ['evime_arkadas', 'Evime arkadaş arıyorum'], ['birlikte_ev', 'Birlikte ev arayacağım bir arkadaş arıyorum']]} /></div>
            <Field name="hakkimda" value={data.hakkimda} onChange={change} type="textarea" hint={`${data.hakkimda.length} / 1000 karakter · İlgi alanların, günlük düzenin ve seni anlatan birkaç cümle.`} />
          </div>
          {data.kullanim_amaci !== 'ev_ariyorum' && <><div className="notice notice-soft">Bu arayış türünde yaşam alışkanlıklarını ve tercihlerini de doldurmalısın.</div><Habits data={data} change={change} /></>}
        </>}
        {section === 'anket' && <><Habits data={data} change={change} /><div className="notice notice-soft">Tercihlerin profilinde saklanır. AI sonuçları henüz kullanıma açık değil; bu form uyum skoru hesaplamaz.</div></>}
        {section === 'filtreler' && <>
          <div className="section-title"><span>⌕</span><div><h2>Arama alanını belirle</h2><p>Bu tercihler profilinde saklanır. Aday filtreleme servisi henüz hazır değil.</p></div></div>
          <div className="form-grid">
            <Field name="aranan_sehir" value={data.aranan_sehir} onChange={change} required maxLength={50} placeholder="Örn. İstanbul" />
            <Field name="aranan_ilceler" value={data.aranan_ilceler.join(', ')} onChange={(_, value) => change('aranan_ilceler', value.split(',').map((item) => item.trimStart()))} hint="Birden fazla ilçe için virgül kullan. Örn. Kadıköy, Üsküdar" placeholder="Örn. Kadıköy, Üsküdar" />
            <Field name="kira_butcesi_min" label="En düşük aylık bütçe (TL)" value={data.kira_butcesi_min} onChange={change} type="number" min={0} max={99999999.99} step="0.01" required placeholder="Örn. 10000" />
            <Field name="kira_butcesi_max" label="En yüksek aylık bütçe (TL)" value={data.kira_butcesi_max} onChange={change} type="number" min={0} max={99999999.99} step="0.01" required placeholder="Örn. 15000" />
            <Field name="tasinma_tarihi" value={data.tasinma_tarihi} onChange={change} type="date" />
          </div>
          <div className="budget-note"><span>₺</span><p>Bütçe, aylık ve kişi başı kira tutarıdır. Alt sınır, üst sınırı aşamaz.</p></div>
        </>}
        <div className="form-footer"><span>{dirty ? 'Kaydedilmemiş değişikliklerin var.' : 'Bilgilerini istediğin zaman güncelleyebilirsin.'}</span><button type="submit" className="primary-button">{busy ? 'Kaydediliyor…' : profile ? 'Değişiklikleri kaydet ✓' : 'Profilimi oluştur ↗'}</button></div>
      </fieldset>
    </form>
  </>
}

function EmptyState({ icon, title, text, action, href }) {
  return <section className="surface empty-state"><span className="empty-icon">{icon}</span><h2>{title}</h2><p>{text}</p>{action && <a className="primary-button" href={href}>{action}</a>}</section>
}

function Upcoming({ page, profile }) {
  const budget = profile?.kira_butcesi_min !== null && profile?.kira_butcesi_min !== undefined && profile?.kira_butcesi_max !== null
    ? `${Number(profile.kira_butcesi_min).toLocaleString('tr-TR')} – ${Number(profile.kira_butcesi_max).toLocaleString('tr-TR')} TL` : 'Bütçe belirlenmedi'
  if (page === 'mesajlar') return <>
    <div className="page-heading"><span className="eyebrow">BİR MERHABA İLE BAŞLAR</span><h1>Mesajların</h1><p>Güzel bir ev arkadaşlığının ilk sohbeti burada başlayacak.</p></div>
    <div className="messaging-layout surface"><aside><h2>Sohbetler <span className="pill">Yakında</span></h2><p>Sohbetler henüz yüklenemiyor.</p><span className="muted">Mesajlaşma bağlantısı bekleniyor.</span></aside><div className="message-placeholder"><span className="empty-icon">◌</span><h2>Sohbet alanın hazır.</h2><p>Mesajlaşma servisi henüz mevcut değil. Şu anda mesaj gönderilemez veya alınamaz.</p><div className="message-compose"><input aria-label="Mesaj" placeholder="Mesajlaşma henüz kullanıma açık değil" disabled /><button disabled aria-label="Mesaj gönder">↑</button></div></div></div>
  </>
  return <>
    <div className="page-heading"><span className="eyebrow">{page === 'uyum' ? 'BİRLİKTE YAŞAMIN UYUMU' : 'YENİ BİR EV ARKADAŞLIĞI'}</span><h1>{page === 'uyum' ? 'Uyumluluk sonuçların' : 'Ev arkadaşı adayların'}</h1><p>{page === 'uyum' ? 'Yaşam tarzına dair ortak noktalar, tek bir yerde.' : 'Aynı şehir, ortak beklentiler ve yeni bir başlangıç.'}</p></div>
    <div className="filter-summary"><span>⌕ {profile?.aranan_sehir || 'Konum belirlenmedi'}{profile?.aranan_ilceler?.filter(Boolean).length ? ` · ${profile.aranan_ilceler.filter(Boolean).join(', ')}` : ''}</span><span>₺ {budget}</span><a href="#/filtreler">Tercihleri düzenle ↗</a></div>
    <EmptyState icon={page === 'uyum' ? '✦' : '♧'} title={page === 'uyum' ? 'Uyum sonuçları için bağlantı bekleniyor.' : 'Aday önerileri henüz kullanıma açık değil.'} text={page === 'uyum' ? 'Mevcut AI sistemi henüz uygulama API’sine bağlı değil. Gerçek bir sonuç gelmeden uyum yüzdesi gösterilmez.' : 'Aday listeleme ve filtreleme için sunucu desteği henüz yok. Profil ve arama tercihlerini şimdiden kaydedebilirsin.'} action="Profilime dön →" href="#/profil" />
    {page === 'uyum' && <div className="compatibility-grid">{[['⌕', 'Konum ve bütçe', 'Önce aynı konum ve kesişen bütçe aralığı değerlendirilir.'], ['☷', 'Yaşam alışkanlıkları', 'Yaş, sigara, temizlik, gürültü toleransı ve evcil hayvan kabulü karşılaştırılır.'], ['✦', 'Skor ve açıklamalar', 'Servis bağlandığında sonuç ve açıklamaları burada görebileceksin.']].map(([icon, title, text]) => <article className="surface" key={title}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div>}
  </>
}

export default function Workspace({ page, session, onSession, onLogout }) {
  if (page === 'giris' || page === 'kayit') {
    if (session.authenticated) return <main className="workspace-content"><EmptyState icon="✓" title="Oturumun açık." text="Profiline ve tercihlerine hesabından ulaşabilirsin." action="Hesabıma git →" href="#/panel" /></main>
    return <Auth key={page} mode={page} onSession={onSession} />
  }
  if (session.loading) return <main className="workspace-content"><div className="surface empty-state" role="status">Oturumun kontrol ediliyor…</div></main>
  if (!session.authenticated) return <main className="workspace-content"><EmptyState icon="○" title={session.offline ? 'Sunucu bağlantısı bekleniyor.' : 'Yolculuğuna giriş yap.'} text={session.offline ? 'Uygulama sunucusuna şu anda ulaşılamıyor. Bağlantı sağlandığında tekrar deneyebilirsin.' : 'Profilini ve tercihlerini görüntülemek için hesabına giriş yapmalısın.'} action="Giriş yap →" href="#/giris" /></main>
  return <div className="workspace-layout">
    <aside className="workspace-sidebar"><div className="sidebar-caption">KİŞİSEL ALANIN</div><nav aria-label="Hesap menüsü">{links.map(([id, icon, text]) => <a key={id} href={`#/${id}`} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined}><span aria-hidden="true">{icon}</span>{text}{['adaylar', 'uyum', 'mesajlar'].includes(id) && <span className="soon-dot" title="Sunucu desteği bekleniyor" />}</a>)}</nav><div className="sidebar-note"><span>✦</span><strong>Önce uyum, sonra adres.</strong><p>Profilin, seni anlatan en iyi başlangıç.</p></div><button className="logout-button" onClick={onLogout}>↪ Oturumu kapat</button></aside>
    <main className="workspace-content">
      {page === 'panel' && <Overview session={session} />}
      {['profil', 'anket', 'filtreler'].includes(page) && <ProfileForm section={page} profile={session.profile} onProfile={(profile) => onSession({ ...session, profile })} />}
      {['adaylar', 'uyum', 'mesajlar'].includes(page) && <Upcoming page={page} profile={session.profile} />}
    </main>
  </div>
}
