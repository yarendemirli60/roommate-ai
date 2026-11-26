import { useEffect, useState } from 'react'
import { api } from '../api'
import './candidates.css'

const number = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 })
const purposes = {
  ev_ariyorum: 'Ev arıyor',
  evime_arkadas: 'Evine arkadaş arıyor',
  birlikte_ev: 'Birlikte ev aramak istiyor',
}

function formatBudget(min, max) {
  if (min != null && max != null) return `${number.format(min)}–${number.format(max)} TL`
  if (min != null) return `En az ${number.format(min)} TL`
  if (max != null) return `En çok ${number.format(max)} TL`
  return null
}

function CandidateCard({ candidate, detail = false }) {
  const [calculation, setCalculation] = useState({ pending: false, result: null, error: '' })
  const budget = formatBudget(candidate.kira_butcesi_min, candidate.kira_butcesi_max)
  const location = [candidate.ilce, candidate.sehir].filter(Boolean).join(', ')
  const details = [candidate.yas && `${candidate.yas} yaş`, candidate.meslek, location].filter(Boolean)

  async function calculate() {
    setCalculation({ pending: true, result: null, error: '' })
    try {
      const result = await api.calculateCompatibility(candidate.id)
      if (!Number.isFinite(result?.skor) || !Array.isArray(result.aciklamalar) ||
          !result.aciklamalar.every((item) => typeof item === 'string')) {
        throw new Error('Sunucudan geçerli bir uyum sonucu alınamadı.')
      }
      setCalculation({ pending: false, result, error: '' })
    } catch (error) {
      setCalculation({ pending: false, result: null, error: error.message })
    }
  }

  return <article className="surface candidate-card" aria-labelledby={`candidate-${candidate.id}`}>
    <header>
      <div className="avatar candidate-avatar" aria-hidden="true">{candidate.ad?.trim().slice(0, 1).toLocaleUpperCase('tr-TR') || '?'}</div>
      <div>
        <h2 id={`candidate-${candidate.id}`}>{detail ? candidate.ad : <a className="inline-link" href={`#/adaylar/${candidate.id}`}>{candidate.ad || 'Ev arkadaşı adayı'}</a>}</h2>
        {details.length > 0 && <p>{details.join(' · ')}</p>}
      </div>
    </header>
    {purposes[candidate.kullanim_amaci] && <span className="pill">{purposes[candidate.kullanim_amaci]}</span>}
    {(candidate.aranan_sehir || budget) && <dl>
      {candidate.aranan_sehir && <div><dt>Aradığı şehir</dt><dd>{candidate.aranan_sehir}</dd></div>}
      {budget && <div><dt>Kişi başı aylık bütçe</dt><dd>{budget}</dd></div>}
    </dl>}
    {candidate.hakkimda && <p className="candidate-bio">{candidate.hakkimda}</p>}
    <button className="primary-button" type="button" onClick={calculate} disabled={calculation.pending}>
      {calculation.pending ? 'Hesaplanıyor…' : 'Uyumu Hesapla'}
    </button>
    <a className="inline-link" href={`#/mesajlar/${candidate.id}`}>Mesaj Gönder</a>
    {calculation.error && <div className="notice notice-error" role="alert">{calculation.error}</div>}
    {calculation.result && <section className="candidate-result" role="status" aria-label="Uyum sonucu">
      <h3>Uyum skoru <strong>{number.format(calculation.result.skor)}</strong></h3>
      {calculation.result.aciklamalar.length > 0 && <ul>
        {calculation.result.aciklamalar.map((text, index) => <li key={index}>{text}</li>)}
      </ul>}
    </section>}
  </article>
}

export function CandidateDetail({ id }) {
  const [state, setState] = useState({ candidate: null, error: null })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    api.getCandidate(id).then(
      (candidate) => { if (active) setState({ candidate, error: null }) },
      (error) => { if (active) setState({ candidate: null, error }) },
    )
    return () => { active = false }
  }, [id, attempt])
  return <>
    <a className="back-link" href="#/adaylar">← Adaylara dön</a>
    <header className="page-heading"><h1>Aday profili</h1></header>
    {state.candidate ? <CandidateCard candidate={state.candidate} detail /> : state.error ?
      <div className="surface" role="alert">
        <p>{state.error.status === 404 ? 'Aday bulunamadı.' : state.error.message}</p>
        {state.error.status !== 404 && <button type="button" className="primary-button" onClick={() => { setState({ candidate: null, error: null }); setAttempt(attempt + 1) }}>Yeniden dene</button>}
      </div> : <p role="status">Aday profili yükleniyor…</p>}
  </>
}

export default function CandidatesPage({ analysis, hasProfile }) {
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(1)
  const [list, setList] = useState({ candidates: null, error: null })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { results: candidates, next, previous } = await api.getCandidates(page)
        if (!Array.isArray(candidates) || !candidates.every((candidate) => Number.isInteger(candidate?.id) && candidate.id > 0)) {
          throw new Error('Sunucudan geçerli bir aday listesi alınamadı.')
        }
        if (active) setList({ candidates, next, previous, error: null })
      } catch (error) {
        if (active) setList({ candidates: null, error })
      }
    }
    load()
    return () => { active = false }
  }, [attempt, page])

  function retry() {
    setList({ candidates: null, error: null })
    setAttempt((previous) => previous + 1)
  }

  function goToPage(nextPage) {
    setList({ candidates: null, error: null })
    setPage(nextPage)
  }

  return <>
    <header className="page-heading">
      <h1>{analysis ? 'Uyumluluk sonuçların' : 'Ev arkadaşı adayların'}</h1>
      <p>Bir aday seçerek uyum skorunu ve açıklamalarını görüntüle.</p>
    </header>
    {!hasProfile && <div className="notice notice-soft">Uyum hesaplaması için profilini tamamla. <a className="inline-link" href="#/profil">Profilime git</a></div>}
    {list.error ? <div className="surface empty-state">
      <h2>Adaylar yüklenemedi</h2>
      <p role="alert">{list.error.message}</p>
      {list.error.status === 401 || list.error.status === 403
        ? <a className="primary-button" href="#/giris">Giriş yap</a>
        : <button className="primary-button" type="button" onClick={retry}>Yeniden dene</button>}
    </div> : list.candidates === null ? <div className="surface" role="status">Adaylar yükleniyor…</div>
      : list.candidates.length === 0 ? <div className="surface empty-state"><h2>Henüz aday bulunmuyor</h2></div>
        : <div className="candidate-grid">{list.candidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}</div>}
    {(list.previous || list.next) && <nav className="listing-pagination" aria-label="Aday sayfaları">
      {list.previous && <button type="button" className="text-button" onClick={() => goToPage(page - 1)}>Önceki sayfa</button>}
      {list.next && <button type="button" className="text-button" onClick={() => goToPage(page + 1)}>Sonraki sayfa</button>}
    </nav>}
  </>
}
