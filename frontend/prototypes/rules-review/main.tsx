import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createSampleDraft } from './sample-data'
import type { ReviewItem } from './sample-data'
import './style.css'

type Tab = 'rules' | 'tiles'
function App() {
  const [game, setGame] = useState(createSampleDraft)
  const [tab, setTab] = useState<Tab>('rules')
  const [editing, setEditing] = useState<ReviewItem | null>(null)
  const [notice, setNotice] = useState('')
  const [started, setStarted] = useState(false)
  const [resetting, setResetting] = useState(false)
  const modalOpen = editing !== null || resetting
  useEffect(() => {
    if (!modalOpen) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    dialog?.querySelector<HTMLElement>('input, button')?.focus()
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setEditing(null); setResetting(false) }
      if (event.key !== 'Tab' || !dialog) return
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea'))
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [modalOpen])
  const all = [...game.rules, ...game.tiles]
  const reviewed = all.filter(item => item.reviewed).length
  const ready = reviewed === all.length && all.length > 0
  function update(item: ReviewItem) {
    setGame(previous => ({ ...previous, [tab]: previous[tab].map(old => old.id === item.id ? item : old) }))
    setStarted(false)
  }
  function changeTab(next: Tab) { setTab(next); setNotice('') }
  return <div className="workshop">
    <header><a className="brand" href="#">✳ <span>pixies<span className="brand-dot">.</span></span></a><span className="prototype">LOCAL PROTOTYPE</span><span className="room">Your game workshop</span></header>
    <main>
      <div className="eyebrow">MAKE IT YOUR GAME <span> / </span> STEP 02 OF 03</div>
      <div className="heading"><div><h1>A little magic.<br/>Your rules.</h1><p>Review the draft, shape the adventure, and get everyone ready to play.</p></div><div className="stamp" aria-hidden="true">✧<small>IMAGINE<br/>EDIT · PLAY</small></div></div>
      <div className="sample-banner"><span>✦</span><div><strong>A starting point for your imagination</strong><p>Sample AI-style content · Edits stay in this tab and reset on refresh.</p></div><button className="text-button" onClick={() => setResetting(true)}>Reset sample</button></div>
      <div className="layout"><section className="editor" aria-label="Game draft">
        <div className="draft-heading"><div><span className="eyebrow">THE ADVENTURE</span><h2>{game.title}</h2></div><span className="pill">2–4 players · sample</span></div>
        <div className="tabs" role="tablist" aria-label="Draft sections">{(['rules', 'tiles'] as Tab[]).map(value => <button key={value} role="tab" id={`${value}-tab`} aria-controls="draft-panel" aria-selected={tab === value} onClick={() => changeTab(value)}>{value === 'rules' ? '01  Game rules' : '02  Board tiles'} <span>{game[value].length}</span></button>)}</div>
        <div role="tabpanel" id="draft-panel" aria-labelledby={`${tab}-tab`}>
          <div className="section-intro"><h3>{tab === 'rules' ? 'How the adventure unfolds' : 'Every space tells a story'}</h3><p>{tab === 'rules' ? 'Read each section, adjust anything, then mark it reviewed.' : 'Tiles run in the order below. Edit their effects or add a new space.'}</p></div>
          {tab === 'tiles' && <div className="board-preview" aria-label="Sample board order">{game.tiles.map((tile, index) => <div key={tile.id}><span>{index + 1}</span><small>{tile.title}</small></div>)}</div>}
          <div className="cards">{game[tab].map((item, index) => <article className={item.reviewed ? 'card reviewed' : 'card'} key={item.id}>
            <div className="card-top"><span className="number">{String(index + 1).padStart(2, '0')}</span><div className="card-title"><span className="eyebrow">{item.kind}</span><h3>{item.title}</h3></div><button className="edit-button" onClick={() => setEditing(structuredClone(item))} aria-label={`Edit ${item.title}`}>Edit ↗</button></div>
            <div className="fields">{item.fields.map(field => <div key={field.id}>{(tab === 'tiles' || item.fields.length > 1) && <strong>{field.label}</strong>}<p>{field.value}</p></div>)}</div>
            <label className="review-toggle"><input type="checkbox" checked={item.reviewed} onChange={event => update({ ...item, reviewed: event.target.checked })}/><span>{item.reviewed ? 'Reviewed & ready' : 'Mark as reviewed'}</span></label>
          </article>)}</div>
          {tab === 'tiles' && <button className="add-tile" onClick={() => setEditing({ id: crypto.randomUUID(), title: '', kind: 'Custom', reviewed: false, fields: [{ id: crypto.randomUUID(), label: 'Action', value: '' }] })}>＋ Add a board tile</button>}
        </div>
      </section><aside><div className="summary"><span className="eyebrow">BEFORE THE FIRST ROLL</span><h2>Make it a shared<br/>adventure.</h2><p>Give every rule and tile a look before you begin.</p><div className="progress-label"><strong>{reviewed} of {all.length} reviewed</strong><span>{Math.round(reviewed / all.length * 100)}%</span></div><progress max={all.length} value={reviewed}/>{(['rules', 'tiles'] as Tab[]).map(value => <div className="summary-row" key={value}><span>{value === 'rules' ? 'Game rules' : 'Board tiles'}</span><strong>{game[value].filter(item => item.reviewed).length}/{game[value].length}</strong></div>)}<button className="primary" disabled={!ready || started} onClick={() => { setStarted(true); setNotice('Rules confirmed! This is a simulated start; no multiplayer game has been created.') }}>{started ? 'Adventure confirmed ✓' : 'Confirm rules & start →'}</button><small className="hint">{ready ? 'Everything is reviewed. Ready when you are.' : 'Review all rules and tiles to unlock.'}</small><p className="notice" role="status">{notice}</p></div><div className="tip"><span>✧</span><p><strong>Your table, your imagination.</strong><br/>Change a challenge, soften a penalty, or invent a whole new tile.</p></div><p className="local-note">Demo only · No live AI or multiplayer connection</p></aside></div>
    </main><footer>Made for a little friendly adventure.<span>PIXIES / GAME WORKSHOP</span></footer>
    {editing && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title" onKeyDown={event => { if (event.key === 'Escape') setEditing(null) }}><form onSubmit={event => {
      event.preventDefault()
      const item = { ...editing, title: editing.title.trim(), reviewed: false }
      if (game[tab].some(old => old.id === item.id)) update(item)
      else { setGame(old => ({ ...old, [tab]: [...old[tab], item] })); setStarted(false) }
      setEditing(null); setNotice('Draft saved. Review the updated item before starting.')
    }}><div className="modal-heading"><h2 id="edit-title">{tab === 'tiles' ? 'Shape this tile' : 'Edit this rule'}</h2><button type="button" aria-label="Close editor" onClick={() => setEditing(null)}>✕</button></div><p className="hint">Saving clears this item’s review status.</p><label>Title<input autoFocus required value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })}/></label><label>{tab === 'tiles' ? 'Tile type' : 'Category'}<input required value={editing.kind} onChange={event => setEditing({ ...editing, kind: event.target.value })}/></label>{editing.fields.map((field, index) => <fieldset key={field.id}><legend>Detail {index + 1}</legend><label>Label<input required value={field.label} onChange={event => setEditing({ ...editing, fields: editing.fields.map(old => old.id === field.id ? { ...old, label: event.target.value } : old) })}/></label><label>Content<textarea required rows={3} value={field.value} onChange={event => setEditing({ ...editing, fields: editing.fields.map(old => old.id === field.id ? { ...old, value: event.target.value } : old) })}/></label><button className="text-button" type="button" disabled={editing.fields.length === 1} onClick={() => setEditing({ ...editing, fields: editing.fields.filter(old => old.id !== field.id) })}>Remove detail</button></fieldset>)}<button className="text-button" type="button" onClick={() => setEditing({ ...editing, fields: [...editing.fields, { id: crypto.randomUUID(), label: '', value: '' }] })}>＋ Add detail</button><div className="modal-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className="primary" type="submit">Save changes</button></div></form></section></div>}
    {resetting && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title"><h2 id="reset-title">Restore the sample?</h2><p>This clears your edits, added tiles, and review progress.</p><div className="modal-actions"><button autoFocus onClick={() => setResetting(false)}>Keep editing</button><button className="primary" onClick={() => { setGame(createSampleDraft()); setResetting(false); setStarted(false); setNotice('Sample restored.') }}>Restore sample</button></div></section></div>}
  </div>
}

createRoot(document.getElementById('root')!).render(<App/>)
