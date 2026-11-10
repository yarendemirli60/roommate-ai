
import { useEffect, useState } from 'react'
import { api, readSession } from './api'
import Workspace from './components/Workspace'
import './App.css'

const validPages = ['giris', 'kayit', 'panel', 'profil', 'anket', 'filtreler', 'adaylar', 'uyum', 'mesajlar']
const currentPage = () => window.location.hash.startsWith('#/') ? window.location.hash.slice(2).split('?')[0] : ''

const features = [
  { icon: '⌂', title: 'Doğru ev, doğru konum', text: 'Yaşamak istediğin bölgeye ve bütçene uygun ev arkadaşlarını keşfet.' },
  { icon: '✦', title: 'Yapay zekâ uyumu', text: 'Yaşam alışkanlıklarını karşılaştır, sana daha uygun eşleşmeleri bul.' },
  { icon: '♡', title: 'Huzurlu bir yaşam', text: 'Temizlik, gürültü ve evcil hayvan tercihlerini baştan belirle.' },
]

function App() {
  const [page, setPage] = useState(currentPage)
  const [session, setSession] = useState({ authenticated: false, profile: null, user: null, loading: true, offline: false })
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const navigate = () => { setPage(currentPage()); setNotice(''); window.scrollTo({ top: 0, behavior: 'instant' }) }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  useEffect(() => {
    let active = true
    readSession().then((result) => { if (active) setSession(result) })
    return () => { active = false }
  }, [])
  async function logout() {
    try {
      await api.logout()
      setSession({ authenticated: false, profile: null, user: null, loading: false, offline: false })
      window.location.hash = '/giris'
    } catch (error) { setNotice(error.message) }
  }
  const accountHref = session.authenticated ? '#/panel' : '#/kayit'
  return (
    <div className="app">
      <nav className="navbar">
        <a className="brand" href="#/" aria-label="RoomMate AI ana sayfa">
  <img
    src="/RoomMate-logo.png"
    alt="RoomMate"
    className="brand-logo"
  />
</a>
        <div className="nav-links">
          <a href="#/adaylar">Ev arkadaşı bul</a>
          <a href={page ? '#/' : '#nasil'}>{page ? 'Ana sayfa' : 'Nasıl çalışır?'}</a>
        </div>
        <div className="nav-actions">{session.authenticated ? <button className="mobile-logout" onClick={logout}>Çıkış yap</button> : <a className="login-link" href="#/giris">Giriş yap</a>}<a className="nav-button" href={accountHref}>{session.authenticated ? 'Hesabım ↗' : 'Hemen başla ↗'}</a></div>
      </nav>

      {notice && <div className="global-notice notice notice-error" role="alert">{notice}</div>}
      {session.offline && <div className="connection-banner" role="status">Sunucu bağlantısı kurulamadı. Hesap işlemleri için uygulama sunucusunun açık olması gerekiyor. <button onClick={() => readSession().then(setSession)}>Yeniden dene ↻</button></div>}
      {page ? (validPages.includes(page) ? <Workspace page={page} session={session} onSession={setSession} onLogout={logout} /> : <main className="workspace-content"><section className="surface empty-state"><h1>Bu sayfa bulunamadı.</h1><a className="primary-button" href="#/">Ana sayfaya dön →</a></section></main>) : <main>
        <section className="hero" id="basla">
          <div className="hero-copy">
            <span className="eyebrow">✦ YENİ NESİL EV ARKADAŞI PLATFORMU</span>
            <h1>Bir evden fazlası.<br /><span>Bir uyum meselesi.</span></h1>
            <p>
              Sadece aynı evi değil, aynı yaşam tarzını
              paylaşabileceğin kişiyi yapay zekâ ile keşfet.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href={accountHref}>Eşleşmeni keşfet <span>↗</span></a>
              <a className="text-button" href="#nasil">Nasıl çalışıyor? →</a>
            </div>
            <div className="hero-note">
              <span className="online-dot" />
              Konum, bütçe ve yaşam tarzına göre akıllı eşleşme
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
              alt="Modern ve sıcak bir oturma odası"
            />
            <div className="floating-card">
              <span className="sparkle">✦</span>
              <div>
                <strong>Senin yaşam tarzın</strong>
                <p>Sana uygun evi birlikte bulalım.</p>
              </div>
            </div>
            <div className="image-label">Birlikte yaşamak, uyumla başlar.</div>
          </div>
        </section>

        <section className="search-panel" id="kesfet">
          <div className="search-heading">
            <span className="search-icon">⌕</span>
            <div>
              <h2>Yeni evini keşfet</h2>
              <p>Aramana birkaç basit adımla başla.</p>
            </div>
          </div>
          <div className="search-fields">
            <label>
              <span>📍 Şehir / Bölge</span>
              <input placeholder="Örn. İstanbul" name="landing-city" maxLength={50} />
            </label>
            <label>
              <span>₺ Aylık bütçe</span>
              <select defaultValue="" name="landing-budget">
                <option value="" disabled>Bütçeni seç</option>
                <option value="0:10000">10.000 TL'ye kadar</option>
                <option value="10000:20000">10.000–20.000 TL</option>
                <option value="20000:">20.000 TL üzeri</option>
              </select>
            </label>
            <button onClick={() => {
              const city = document.querySelector('[name="landing-city"]').value.trim()
              const budget = document.querySelector('[name="landing-budget"]').value
              sessionStorage.setItem('roommate_search_draft', JSON.stringify({ city, budget }))
              window.location.hash = session.authenticated ? '/filtreler' : '/kayit'
            }}>
              Eşleşme yolculuğuna başla →
            </button>
          </div>
        </section>

        <section className="features" id="nasil">
          <div className="section-heading">
            <span className="eyebrow">SENİN İÇİN TASARLANDI</span>
            <h2>Birlikte yaşamanın <span>daha akıllı yolu.</span></h2>
            <p>Ev arkadaşı ararken yalnızca evi değil, uyumu da düşün.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <span className="card-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="bottom-banner">
          <div>
            <span className="eyebrow">ROOMMATE AI</span>
            <h2>Ev arkadaşı değil,<br />hayatına uyumlu biri.</h2>
          </div>
          <a className="light-button" href={accountHref}>Hemen başla ↗</a>
        </section>
      </main>}

      <footer>
       <a className="brand" href="#/">
  <img
    src="/RoomMate-logo.png"
    alt="RoomMate"
    className="brand-logo"
  />
</a>
        <p>Yapay zekâ ile daha uyumlu bir ev hayatı.</p>
      </footer>
    </div>
  )
}

export default App
