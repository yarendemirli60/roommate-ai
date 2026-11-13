import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api'
import './messages.css'

const maxLength = 1000
const timeFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' })

function useMessageList(load) {
  const [state, setState] = useState({ items: null, error: '', pending: true })
  const sequence = useRef(0)
  const refresh = useCallback(async () => {
    const requestId = ++sequence.current
    setState((previous) => ({ ...previous, pending: true, error: '' }))
    try {
      const items = await load()
      if (!Array.isArray(items)) throw new Error('Sunucudan geçerli bir liste alınamadı.')
      if (requestId === sequence.current) setState({ items, error: '', pending: false })
    } catch (error) {
      if (requestId === sequence.current) {
        setState((previous) => ({ ...previous, error: error.message, pending: false }))
      }
    }
  }, [load])

  useEffect(() => {
    refresh()
    return () => { sequence.current += 1 }
  }, [refresh])

  const append = (item) => setState((previous) => ({
    ...previous,
    items: [...(previous.items || []).filter((existing) => existing.id !== item.id), item],
  }))
  return { ...state, refresh, append }
}

function participantName(thread) {
  return [thread?.ad, thread?.soyad].filter(Boolean).join(' ') || 'Yeni konuşma'
}

function LiveConversation({ profileId, name, userId, onSent }) {
  const load = useCallback(() => api.getMessages(profileId), [profileId])
  const history = useMessageList(load)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [senderId, setSenderId] = useState(null)
  const historyRef = useRef(null)
  const count = history.items?.length
  const ownId = userId ?? senderId

  useEffect(() => {
    const region = historyRef.current
    if (region) region.scrollTop = region.scrollHeight
  }, [count])

  async function submit(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || text.length > maxLength || pending || history.pending || history.error) return
    setPending(true)
    setSendError('')
    try {
      const message = await api.sendMessage(profileId, text)
      history.append(message)
      setSenderId(message.gonderen)
      setDraft('')
      onSent()
    } catch (error) {
      setSendError(error.message)
    } finally {
      setPending(false)
    }
  }

  return <section className="messages-conversation" aria-labelledby="live-conversation-name">
    <header className="messages-thread-header">
      <div className="messages-avatar" aria-hidden="true">{name[0]}</div>
      <h2 id="live-conversation-name">{name}</h2>
      <button className="messages-refresh" type="button" disabled={history.pending || pending} onClick={history.refresh}>Geçmişi yenile</button>
    </header>
    <div className="messages-history" ref={historyRef} role="log" aria-label="Mesaj geçmişi" tabIndex={0}>
      {history.pending && <p className="messages-empty" role="status">Mesajlar yükleniyor…</p>}
      {history.error && <p className="notice notice-error" role="alert">{history.error}</p>}
      {count === 0 && !history.pending && !history.error && <p className="messages-empty">Henüz mesaj yok. İlk mesajını yazabilirsin.</p>}
      <ol>{history.items?.map((message) => {
        const isOwn = ownId != null && message.gonderen === ownId
        const date = new Date(message.gonderilme_tarihi)
        return <li key={message.id} className={isOwn ? 'message-outgoing' : 'message-incoming'}>
          <span className="messages-meta">
            {isOwn ? 'Sen' : ownId != null ? name : `Gönderen #${message.gonderen}`}
            {Number.isFinite(date.getTime()) && <time dateTime={date.toISOString()}>{timeFormat.format(date)}</time>}
          </span>
          <p>{message.icerik}</p>
        </li>
      })}</ol>
    </div>
    <form className="messages-compose" onSubmit={submit}>
      <label htmlFor="live-message-draft">Mesajın</label>
      {sendError && <p className="notice notice-error" role="alert">{sendError}</p>}
      <div>
        <textarea id="live-message-draft" rows={2} maxLength={maxLength} value={draft} onChange={(event) => setDraft(event.target.value)} disabled={pending} />
        <button className="primary-button" type="submit" disabled={pending || history.pending || Boolean(history.error) || !draft.trim()}>
          {pending ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </div>
    </form>
  </section>
}

function Inbox({ threadId, userId }) {
  const conversations = useMessageList(api.getConversations)
  const validThread = !threadId || (/^[1-9]\d*$/.test(threadId) && Number.isSafeInteger(Number(threadId)))
  const activeId = validThread ? threadId || String(conversations.items?.[0]?.aday_profil_id || '') : ''
  const active = conversations.items?.find((thread) => String(thread.aday_profil_id) === activeId)
  const [newRecipient, setNewRecipient] = useState(null)

  useEffect(() => {
    if (!activeId || active || conversations.items === null) return undefined
    let ignore = false
    api.getCandidates().then((candidates) => {
      if (!ignore && Array.isArray(candidates)) {
        const profile = candidates.find((candidate) => String(candidate.id) === activeId)
        if (profile) setNewRecipient({ id: activeId, name: profile.ad })
      }
    }).catch(() => { /* History has its own access and error handling. */ })
    return () => { ignore = true }
  }, [active, activeId, conversations.items])

  const name = active ? participantName(active) : (newRecipient?.id === activeId && newRecipient.name) || 'Yeni konuşma'

  return <div className="messages-panel">
    <aside className="messages-sidebar">
      <div className="messages-list-heading">
        <h2 id="live-conversation-list">Konuşmalar</h2>
        <button className="messages-refresh" type="button" onClick={conversations.refresh} disabled={conversations.pending}>Yenile</button>
      </div>
      {conversations.pending && <p className="messages-empty" role="status">Konuşmalar yükleniyor…</p>}
      {conversations.error && <p className="notice notice-error" role="alert">{conversations.error}</p>}
      {conversations.items?.length === 0 && <p className="messages-empty">Henüz konuşman yok.</p>}
      <nav aria-labelledby="live-conversation-list">
        {conversations.items?.map((thread) => <a key={thread.aday_profil_id} href={`#/mesajlar/${thread.aday_profil_id}`} aria-current={String(thread.aday_profil_id) === activeId ? 'page' : undefined}>
          <span className="messages-avatar" aria-hidden="true">{participantName(thread)[0]}</span>
          <span className="messages-thread-preview"><strong>{participantName(thread)}</strong><small>{thread.son_mesaj?.icerik}</small></span>
        </a>)}
      </nav>
    </aside>
    {activeId ? <LiveConversation key={activeId} profileId={activeId} userId={userId} name={name} onSent={conversations.refresh} /> : <section className="messages-missing">
      <h2>{validThread ? 'Bir konuşma seç' : 'Konuşma bulunamadı'}</h2>
      <p>Listeden bir konuşma açabilir veya bir adaya mesaj gönderebilirsin.</p>
      <a className="primary-button" href="#/adaylar">Adaylara git</a>
    </section>}
  </div>
}

export default function LiveMessagesPage({ threadId, session, onRetry }) {
  return <main className="messages-shell">
    <header className="page-heading"><h1>Mesajlarım</h1></header>
    {session.loading ? <p className="surface" role="status">Oturum kontrol ediliyor…</p>
      : session.authenticated ? <Inbox threadId={threadId} userId={session.user?.id} />
        : <section className="surface empty-state">
          <h2>{session.offline ? 'Sunucuya bağlanılamadı' : 'Mesajlarını görmek için giriş yap'}</h2>
          {session.offline ? <button className="primary-button" type="button" onClick={onRetry}>Yeniden dene</button>
            : <a className="primary-button" href="#/giris">Giriş yap</a>}
        </section>}
  </main>
}
