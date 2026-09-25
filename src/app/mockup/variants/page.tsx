'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, Folder, Grid2X2, Images, Search, X } from 'lucide-react'
import styles from './variants.module.css'
import JSZip from 'jszip'

const photos = [
  { image: '/ekranas-laisves-kelias.jpg', name: 'Laisvės kelias' },
  { image: '/ekranas-narbuto-ziedas.jpg', name: 'Narbuto žiedas' },
  { image: '/20260825Reklama1484.JPG', name: 'Justiniškės' },
  { image: '/DSC00127.jpg', name: 'Mada' },
]
const campaigns = [
  { client: 'IKEA', title: 'Šaltibarščiai 2026', date: '2026-09-25', image: 0, fresh: true },
  { client: 'IKEA', title: 'Ruduo prasideda namuose', date: '2026-09-23', image: 1, fresh: true },
  { client: 'Maxima', title: 'Daugiau kasdien', date: '2026-09-21', image: 2, fresh: false },
  { client: 'IF Draudimas', title: 'Ramiems jūsų planams', date: '2026-09-18', image: 3, fresh: false },
]
const options = [
  { name: '01 — Švarus', text: 'Balta, aiški tipografija ir kampanijų sąrašas.' },
  { name: '02 — Foto studija', text: 'Tamsus fonas, dideli vaizdai ir ryškus akcentas.' },
  { name: '03 — Darbo erdvė', text: 'Šoninė navigacija, kompaktiškos kortelės ir paieška.' },
]

const STORAGE_KEY = 'piksel-proof-demo-viewed-v1'
const photoKey = (campaignId: number, photoId: number) => `${campaignId}:${photoId}`
const filename = (index: number) => `PHOTO_${String(index + 1).padStart(3, '0')}.jpg`

export default function DesignVariants() {
  const [variant, setVariant] = useState(0)
  const [campaign, setCampaign] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [client, setClient] = useState<string | null>(null)
  const [onlyNew, setOnlyNew] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState<number[]>([])
  const [viewed, setViewed] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [download, setDownload] = useState<{ label: string; percent: number } | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const busy = useRef(false)
  const dialog = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const active = campaign === null ? null : campaigns[campaign]
  const isNew = (id: number, index: number) => campaigns[id].fresh && index < 2 && !viewed.includes(photoKey(id, index))
  const newIds = (id: number) => photos.map((_, index) => index).filter(index => isNew(id, index))
  const newCampaignCount = campaigns.filter((_, id) => newIds(id).length > 0).length
  const filtered = campaigns.map((item, id) => ({ ...item, id })).filter(item => (!client || client === item.client) && (!onlyNew || newIds(item.id).length > 0) && `${item.client} ${item.title}`.toLocaleLowerCase('lt').includes(query.toLocaleLowerCase('lt')))
  const clientNames = [...new Set(campaigns.map(item => item.client))]
  const visibleClients = clientNames.filter(name => filtered.some(item => item.client === name))

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(saved)) setViewed(saved.filter((key): key is string => typeof key === 'string'))
    } catch { /* Demo remains usable without browser storage. */ }
    setReady(true)
  }, [])
  useEffect(() => {
    if (ready) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed)) } catch { /* Session-only fallback. */ } }
  }, [viewed, ready])
  useEffect(() => {
    if (selected !== null && campaign !== null) setViewed(items => [...new Set([...items, photoKey(campaign, selected)])])
  }, [selected, campaign])
  const modalOpen = selected !== null
  useEffect(() => {
    if (!modalOpen) return
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    previousFocus.current = document.activeElement as HTMLElement
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        const step = event.key === 'ArrowRight' ? 1 : -1
        setSelected(value => value === null ? null : (value + photos.length + step) % photos.length)
      }
      if (event.key === 'Tab') {
        const nodes = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]') || [])
        const first = nodes[0], last = nodes[nodes.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    window.addEventListener('keydown', key)
    return () => { document.body.style.overflow = old; window.removeEventListener('keydown', key); previousFocus.current?.focus() }
  }, [modalOpen])
  const goClient = (name: string | null) => { setClient(name); setCampaign(null); setQuery(''); setChecked([]); setSelected(null) }
  const openCampaign = (id: number) => { setCampaign(id); setClient(campaigns[id].client); setChecked([]); setError(''); setNotice('') }
  const toggleChecked = (index: number) => setChecked(ids => ids.includes(index) ? ids.filter(id => id !== index) : [...ids, index])
  const downloadPhotos = async (ids: number[], zip = true) => {
    if (busy.current || campaign === null || !ids.length) return
    busy.current = true
    const campaignId = campaign
    const current = campaigns[campaignId]
    setError(''); setNotice(''); setDownload({ label: 'Ruošiamos nuotraukos', percent: 0 })
    try {
      const archive = new JSZip()
      let single: Blob | null = null
      for (let i = 0; i < ids.length; i++) {
        const response = await fetch(photos[ids[i]].image)
        if (!response.ok) throw new Error('Nepavyko gauti nuotraukos')
        const blob = await response.blob()
        archive.file(filename(ids[i]), blob)
        single = blob
        setDownload({ label: `Gautos nuotraukos: ${i + 1} / ${ids.length}`, percent: Math.round((i + 1) / ids.length * 75) })
      }
      const blob = zip ? await archive.generateAsync({ type: 'blob' }, metadata => setDownload({ label: 'Ruošiamas ZIP archyvas', percent: Math.round(75 + metadata.percent / 4) })) : single!
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = zip ? `${current.client}_${current.title}_${current.date}.zip`.replace(/[\\/:*?"<>|]/g, '-') : filename(ids[0])
      document.body.appendChild(anchor); anchor.click(); anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 30000)
      setViewed(items => [...new Set([...items, ...ids.map(id => photoKey(campaignId, id))])])
      setNotice(`Paruošta atsisiųsti: ${ids.length} ${ids.length === 1 ? 'nuotrauka' : 'nuotraukos'}.`)
    } catch {
      setError('Nepavyko paruošti atsisiuntimo. Bandykite dar kartą.')
    } finally { busy.current = false; setDownload(null) }
  }

  return (
    <div className={`${styles.root} ${[styles.clean, styles.studio, styles.workspace][variant]}`}>
      <div className={styles.previewBar}>
        <span className={styles.previewLabel}>VIETINĖ PERŽIŪRA</span>
        <div className={styles.variants} aria-label="Dizaino variantai">{options.map((option, i) => <button key={option.name} aria-pressed={variant === i} onClick={() => setVariant(i)}>{option.name}</button>)}</div>
        <span className={styles.demo}>Pavyzdiniai duomenys</span>
      </div>
      <div className={styles.shell}>
        <header className={styles.header}>
          <button className={styles.brand} onClick={() => goClient(null)} aria-label="Į klientų katalogus"><img src={variant === 1 ? '/Piksel-logo-baltas-2026.png' : '/Piksel-logo-juodas-2026.png'} alt="Piksel" /><span>PHOTO PROOF</span></button>
          <div className={styles.headerLinks}><span>Jūsų reklama. Realiame mieste.</span><div className={styles.account}><span>B</span>BPN agentūra</div></div>
        </header>
        {variant === 2 && <aside className={styles.sidebar}>
          <p>AGENTŪROS ERDVĖ</p><button className={!client ? styles.sideActive : ''} onClick={() => goClient(null)}><Grid2X2 size={17} />Klientų katalogai <small>{clientNames.length}</small></button>
          <p>KLIENTAI</p>{clientNames.map(name => <button key={name} className={client === name ? styles.sideActive : ''} onClick={() => goClient(name)}><Folder size={17} />{name}</button>)}
          <div className={styles.sidebarFoot}><span className={styles.dot} /> Paruošta peržiūrai<p>Kampanijų nuotraukos vienoje vietoje.</p></div>
        </aside>}
        <main className={styles.main}>
          <nav className={styles.breadcrumb} aria-label="Puslapio kelias"><button onClick={() => goClient(null)}>BPN</button><ChevronRight size={13} />{client ? <button onClick={() => goClient(client)}>{client}</button> : <span>Klientų katalogai</span>}{active && <><ChevronRight size={13} /><span>Nuotraukos</span></>}</nav>
          <section className={styles.intro}>
            <div><div className={styles.eyebrow}>{active ? 'KAMPANIJOS GALERIJA' : 'JŪSŲ KAMPANIJOS'}</div><h1>{active ? active.client : client || 'Klientų katalogai'}</h1><p>{active ? `${active.title} · ${photos.length} nuotraukos · ${active.date}` : client ? 'Pasirinkite kampaniją ir peržiūrėkite jos nuotraukas.' : 'Pasirinkite klientą. Jo kampanijas ir nuotraukas rasite katalogo viduje.'}</p></div>
            <div className={styles.introAside}>{active || client ? <button className={styles.back} onClick={() => goClient(active ? client : null)}><ArrowLeft size={16} />{active ? 'Kliento kampanijos' : 'Visi klientai'}</button> : <><strong>04<span>kampanijos</span></strong><strong>03<span>klientai</span></strong></>}</div>
          </section>
          {!active ? <>
            <div className={styles.updates}><div><strong>{ready ? newCampaignCount : '…'} kampanijos turi naujų nuotraukų</strong><p>Žyma dingsta peržiūrėjus arba atsisiuntus naujas nuotraukas.</p></div><button className={styles.back} onClick={() => { setOnlyNew(!onlyNew) }} aria-pressed={onlyNew}>{onlyNew ? 'Rodyti visas' : 'Tik su naujomis'}</button></div>
            <div className={styles.toolbar}><span className={styles.resultLabel}>{client ? 'Kampanijos' : 'Klientų katalogai'}{onlyNew ? ' · Tik su naujomis' : ''}</span><label className={styles.search}><Search size={16} /><input aria-label="Ieškoti kliento arba kampanijos" placeholder="Klientas arba kampanija…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
            <div className={styles.campaigns}>{!client ? visibleClients.map(name => {
              const items = campaigns.map((item, id) => ({ ...item, id })).filter(item => item.client === name)
              const freshCount = items.filter(item => newIds(item.id).length > 0).length
              return <button key={name} className={styles.card} onClick={() => goClient(name)}><div className={styles.cardImage}><img src={photos[items[0].image].image} alt="Kliento katalogo viršelis" />{ready && freshCount > 0 && <span className={styles.badge}><span />Yra naujų nuotraukų</span>}</div><div className={styles.cardBody}><span className={styles.client}>{name}</span><h2>Kampanijų: {items.length} · Nuotraukų: {items.length * photos.length}</h2><div className={styles.meta}><span>Atnaujinta {items[0].date}</span><span>Atidaryti katalogą →</span></div></div></button>
            }) : filtered.map(item => <button key={item.id} className={styles.card} onClick={() => openCampaign(item.id)}><div className={styles.cardImage}><img src={photos[item.image].image} alt="Kampanijos viršelis" />{ready && newIds(item.id).length > 0 && <span className={styles.badge}><span />Naujos: {newIds(item.id).length}</span>}<span className={styles.imageCount}><Images size={13} />{photos.length}</span></div><div className={styles.cardBody}><span className={styles.client}>{item.client}</span><h2>{item.title}</h2><div className={styles.meta}><span>{item.date}</span><span>{photos.length} nuotraukos</span></div></div><span className={styles.cardArrow}><ArrowRight size={20} /></span></button>)}</div>
            {!filtered.length && <div className={styles.empty}><Search size={28} /><h2>{onlyNew ? 'Naujų nuotraukų nerasta' : 'Rezultatų nerasta'}</h2><button className={styles.back} onClick={() => { setQuery(''); setOnlyNew(false) }}>Išvalyti filtrus</button></div>}
          </> : <>
            <div className={styles.downloadBar}>
              <div className={styles.selection}><label><input type="checkbox" checked={checked.length === photos.length} onChange={event => setChecked(event.target.checked ? photos.map((_, id) => id) : [])} />Pažymėti visas</label><span>Pasirinkta: {checked.length}</span></div>
              <div className={styles.downloadActions}><button disabled={!!download || !checked.length} onClick={() => downloadPhotos([...checked])}><Download size={16} />Pasirinktas ({checked.length})</button><button disabled={!!download || !ready || !newIds(campaign!).length} onClick={() => downloadPhotos(newIds(campaign!))}>Tik naujas ({ready ? newIds(campaign!).length : '…'})</button><button className={styles.primaryDownload} disabled={!!download} onClick={() => downloadPhotos(photos.map((_, id) => id))}>Visas ZIP ({photos.length})</button></div>
            </div>
            <div className={styles.photos}>{photos.map((photo, i) => <article key={photo.image} className={checked.includes(i) ? styles.selectedPhoto : ''}><div className={styles.photoControls}><label><input type="checkbox" checked={checked.includes(i)} onChange={() => toggleChecked(i)} aria-label={`Pasirinkti ${filename(i)}`} />Pasirinkti</label>{ready && isNew(campaign!, i) && <span className={styles.newLabel}>Nauja</span>}</div><button className={styles.photoOpen} onClick={() => setSelected(i)} aria-label={`Peržiūrėti ${filename(i)}`}><img src={photo.image} alt={filename(i)} /><span>Peržiūrėti <ArrowRight size={16} /></span></button><div className={styles.photoCaption}><div><h2>{filename(i)}</h2><span>Įkelta {active.date}</span></div><button disabled={!!download} onClick={() => downloadPhotos([i], false)} aria-label={`Atsisiųsti ${filename(i)}`}><Download size={18} /></button></div></article>)}</div>
          </>}
          <footer className={styles.footer}><span>PIKSEL / PHOTO PROOF</span><span>Pavyzdiniai katalogai ir nuotraukos</span><button className={styles.resetDemo} onClick={() => { setViewed([]); setOnlyNew(false); setNotice('Naujų nuotraukų pavyzdys atkurtas.') }}>Atkurti „nauja“ pavyzdį</button></footer>
        </main>
      </div>
      {(download || error || notice) && <div className={styles.downloadStatus} style={modalOpen ? { top: 20, bottom: 'auto' } : undefined} role="status" aria-live="polite">{download ? <><strong>{download.label}</strong><progress aria-label="Atsisiuntimo paruošimas" max={100} value={download.percent} /><span>{download.percent}%</span></> : <><span>{error || notice}</span><button aria-label="Paslėpti pranešimą" onClick={() => { setError(''); setNotice('') }}><X size={16} /></button></>}</div>}
      {selected !== null && <div ref={dialog} className={`${styles.lightbox} ${styles.enhancedLightbox}`} role="dialog" aria-modal="true" aria-label="Nuotraukos peržiūra">
        <button className={styles.close} onClick={() => setSelected(null)} aria-label="Uždaryti"><X /></button>
        <button className={styles.prev} onClick={() => setSelected((selected + photos.length - 1) % photos.length)} aria-label="Ankstesnė nuotrauka"><ChevronLeft /></button>
        <img src={photos[selected].image} alt={filename(selected)} onTouchStart={event => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }} onTouchEnd={event => { if (!touchStart.current) return; const dx = event.changedTouches[0].clientX - touchStart.current.x; const dy = event.changedTouches[0].clientY - touchStart.current.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) setSelected((selected + photos.length + (dx < 0 ? 1 : -1)) % photos.length); touchStart.current = null }} />
        <button className={styles.next} onClick={() => setSelected((selected + 1) % photos.length)} aria-label="Kita nuotrauka"><ChevronRight /></button>
        <div className={styles.viewerBottom}><div className={styles.viewerCaption}><span>{filename(selected)} · {selected + 1} / {photos.length}</span><button disabled={!!download} onClick={() => downloadPhotos([selected], false)}><Download size={16} />Atsisiųsti</button></div><div className={styles.thumbnails}>{photos.map((photo, i) => <button key={photo.image} aria-label={`Rodyti ${filename(i)}`} aria-pressed={i === selected} onClick={() => setSelected(i)}><img src={photo.image} alt="" /></button>)}</div></div>
      </div>}
    </div>
  )
}
