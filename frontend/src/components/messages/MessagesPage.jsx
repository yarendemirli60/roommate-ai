import { useEffect, useRef, useState } from 'react'
import { demoListings } from '../../data/demoListings'
import './messages.css'

const storageKey = 'roommate-demo-messages-v1'
const maxLength = 4000
const participantNames = ['Deniz', 'Ece', 'Mert', 'Selin', 'Ada', 'Can']
const threads = demoListings.map((listing, index) => ({
  id: listing.id,
  listingTitle: listing.title,
  participant: participantNames[index] || 'Örnek ilan sahibi',
}))
const sampleHistory = {
  'ornek-1': [
    { id: 'sample-1', sender: 'you', text: 'Merhaba, oda hâlâ müsait mi?' },
    { id: 'sample-2', sender: 'owner', text: 'Merhaba! Evet, oda müsait. Aklına takılanları sorabilirsin.' },
  ],
  'ornek-2': [
    { id: 'sample-3', sender: 'owner', text: 'Merhaba! Evle ilgili sorularını burada yanıtlayabilirim.' },
  ],
}

function readDemoMessages() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey))
    return Object.fromEntries(threads.flatMap(({ id }) => {
      const messages = saved?.[id]
      if (!Array.isArray(messages)) return []
      return [[id, messages.filter((message) => (
        typeof message?.id === 'string' && typeof message.text === 'string' &&
        ['you', 'auto'].includes(message.sender) && Number.isFinite(message.sentAt)
      ))]]
    }))
  } catch {
    return {}
  }
}

const messageTime = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

function Conversation({ thread, messages, onSend }) {
  const [draft, setDraft] = useState('')
  const historyRef = useRef(null)
  useEffect(() => {
    const history = historyRef.current
    if (history) history.scrollTop = history.scrollHeight
  }, [messages.length])

  function submit(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || text.length > maxLength) return
    onSend(text)
    setDraft('')
  }

  return <section className="messages-conversation" aria-labelledby="conversation-name">
    <header className="messages-thread-header">
      <div className="messages-avatar" aria-hidden="true">{thread.participant[0]}</div>
      <div><h2 id="conversation-name">{thread.participant}</h2><a href={`#/ilanlar/${thread.id}`}>{thread.listingTitle} ↗</a></div>
    </header>
    <div className="messages-history" ref={historyRef} role="log" aria-label="Mesaj geçmişi" tabIndex={0}>
      {!messages.length && <p className="messages-empty">Henüz mesaj yok. İlk mesajını aşağıdan yazabilirsin.</p>}
      <ol>{messages.map((message) => <li key={message.id} className={message.sender === 'you' ? 'message-outgoing' : 'message-incoming'}>
        <span className="messages-meta">
          {message.sender === 'you' ? 'Sen' : message.sender === 'auto' ? 'Otomatik demo yanıtı' : thread.participant}
          {message.sentAt && <time dateTime={new Date(message.sentAt).toISOString()}>{messageTime.format(message.sentAt)}</time>}
        </span>
        <p>{message.text}</p>
      </li>)}</ol>
    </div>
    <form className="messages-compose" onSubmit={submit}>
      <label htmlFor="message-draft">Mesajın</label>
      <div>
        <textarea id="message-draft" rows={2} maxLength={maxLength} placeholder="İlan hakkında bir şey sor…" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button className="primary-button" type="submit" disabled={!draft.trim()}>Gönder <span aria-hidden="true">↗</span></button>
      </div>
    </form>
  </section>
}

export default function MessagesPage({ threadId }) {
  const [localMessages, setLocalMessages] = useState(readDemoMessages)
  const [storageWarning, setStorageWarning] = useState(false)
  const allThreads = threads.map((thread) => ({
    ...thread,
    messages: [...(sampleHistory[thread.id] || []), ...(localMessages[thread.id] || [])],
  }))
  const visibleThreads = allThreads
    .filter((thread) => thread.messages.length || thread.id === threadId)
    .sort((a, b) => (b.messages.at(-1)?.sentAt || 0) - (a.messages.at(-1)?.sentAt || 0))
  const active = threadId ? visibleThreads.find((thread) => thread.id === threadId) : visibleThreads[0]

  function send(text) {
    const previous = localMessages[active.id] || []
    const now = Date.now()
    const id = crypto.randomUUID()
    const nextMessages = [...previous, { id, sender: 'you', text, sentAt: now }]
    if (!previous.length) {
      nextMessages.push({
        id: `${id}-reply`,
        sender: 'auto',
        text: 'Merhaba! Bu, mesajın karşı tarafta nasıl görüneceğini canlandıran otomatik bir demo yanıtı.',
        sentAt: now,
      })
    }
    const next = { ...localMessages, [active.id]: nextMessages }
    setLocalMessages(next)
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next))
      setStorageWarning(false)
    } catch {
      setStorageWarning(true)
    }
  }

  return <main className="messages-shell">
    <header className="page-heading"><h1>Mesajlarım</h1></header>
    <p className="messages-demo"><strong>Mesajlaşma demosu.</strong> Mesajlar yalnızca bu tarayıcı sekmesinde saklanır. Karşı tarafa gönderilmez.</p>
    {storageWarning && <p className="notice notice-error" role="status">Tarayıcı mesajı saklayamadı. Bu mesaj sayfadan ayrıldığında kaybolabilir.</p>}
    <div className="messages-panel">
      <aside className="messages-sidebar">
        <h2 id="conversation-list">Konuşmalar</h2>
        <nav aria-labelledby="conversation-list">
          {visibleThreads.map((thread) => <a key={thread.id} href={`#/mesajlar/${thread.id}`} aria-current={active?.id === thread.id ? 'page' : undefined}>
            <span className="messages-avatar" aria-hidden="true">{thread.participant[0]}</span>
            <span className="messages-thread-preview">
              <strong>{thread.participant}</strong>
              <span>{thread.listingTitle}</span>
              <small>{thread.messages.at(-1)?.text || 'Yeni konuşma'}</small>
            </span>
          </a>)}
        </nav>
      </aside>
      {active ? <Conversation key={active.id} thread={active} messages={active.messages} onSend={send} /> : <section className="messages-missing">
        <h2>Konuşma bulunamadı</h2><p>Listeden bir konuşma seç veya bir örnek ilandan yeni mesaj yaz.</p>
        <a className="primary-button" href="#/ilanlar">İlanlara dön</a>
      </section>}
    </div>
  </main>
}
