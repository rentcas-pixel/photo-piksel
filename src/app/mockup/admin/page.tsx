'use client'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChevronRight, Plus, Search, Upload, Pencil, X, Folder, ExternalLink } from 'lucide-react'
import shared from '../variants/variants.module.css'
import s from './admin.module.css'

type Entry = { id: number; name: string; parent?: number; description?: string }
const pictures = ['/ekranas-laisves-kelias.jpg', '/ekranas-narbuto-ziedas.jpg', '/20260825Reklama1484.JPG', '/DSC00127.jpg']
export default function AdminMockup() {
  const [agencies, setAgencies] = useState<Entry[]>([{ id: 1, name: 'BPN' }, { id: 2, name: 'Open' }, { id: 3, name: 'Media House' }])
  const [clients, setClients] = useState<Entry[]>([{ id: 11, name: 'IKEA', parent: 1 }, { id: 12, name: 'Maxima', parent: 1 }, { id: 13, name: 'IF Draudimas', parent: 2 }])
  const [campaigns, setCampaigns] = useState<Entry[]>([{ id: 21, name: 'Šaltibarščiai 2026', parent: 11 }, { id: 22, name: 'Ruduo prasideda namuose', parent: 11 }, { id: 23, name: 'Daugiau kasdien', parent: 12 }])
  const [agencyId, setAgencyId] = useState<number | null>(null)
  const [clientId, setClientId] = useState<number | null>(null)
  const [campaignId, setCampaignId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<{ kind: 'agency' | 'client' | 'campaign'; edit?: number } | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [uploads, setUploads] = useState<Record<number, { url: string; name: string }[]>>({})
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const urls = useRef<string[]>([])
  useEffect(() => () => urls.current.forEach(url => URL.revokeObjectURL(url)), [])
  const agency = agencies.find(item => item.id === agencyId)
  const client = clients.find(item => item.id === clientId)
  const campaign = campaigns.find(item => item.id === campaignId)
  const kind = client ? 'campaign' : agency ? 'client' : 'agency'
  const entries = (client ? campaigns.filter(item => item.parent === client.id) : agency ? clients.filter(item => item.parent === agency.id) : agencies).filter(item => item.name.toLocaleLowerCase('lt').includes(query.toLocaleLowerCase('lt')))
  const gallery = campaign ? [...(campaign.id <= 23 ? pictures.map((url, i) => ({ url, name: `PHOTO_00${i + 1}.jpg` })) : []), ...(uploads[campaign.id] || [])] : []
  const reset = () => { setQuery(''); setMessage('') }
  const home = () => { setAgencyId(null); setClientId(null); setCampaignId(null); reset() }
  const goAgency = (id: number) => { setAgencyId(id); setClientId(null); setCampaignId(null); reset() }
  const goClient = (id: number) => { setClientId(id); setCampaignId(null); reset() }
  const startForm = (type: 'agency' | 'client' | 'campaign', entry?: Entry) => { setForm({ kind: type, edit: entry?.id }); setName(entry?.name || ''); setDescription(entry?.description || '') }
  const save = () => {
    if (!form || !name.trim()) return
    const setter = form.kind === 'agency' ? setAgencies : form.kind === 'client' ? setClients : setCampaigns
    const item = { id: form.edit || Date.now(), name: name.trim(), parent: form.kind === 'client' ? agencyId! : form.kind === 'campaign' ? clientId! : undefined, description }
    setter(items => form.edit ? items.map(previous => previous.id === form.edit ? item : previous) : [...items, item])
    setForm(null); setMessage('Išsaugota tik šiame makete. Perkrovus puslapį pakeitimai dings.')
  }
  const addFiles = (files: FileList | null) => {
    if (!files || !campaign) return
    const images = Array.from(files).filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    const items = images.map(file => { const url = URL.createObjectURL(file); urls.current.push(url); return { url, name: file.name } })
    setUploads(previous => ({ ...previous, [campaign.id]: [...(previous[campaign.id] || []), ...items] }))
    setMessage(items.length ? `Pridėta vietinei peržiūrai: ${items.length}. Failai į serverį nesiunčiami.` : 'Pasirinkite JPG, PNG arba WebP nuotraukas.')
  }
  return <div className={`${shared.root} ${shared.clean} ${s.admin}`}>
    <div className={shared.previewBar}><span className={shared.previewLabel}>ADMINISTRATORIAUS MAKETAS</span><span className={shared.demo}>Pavyzdiniai duomenys · pakeitimai tik šioje peržiūroje</span><Link href="/mockup/variants">Agentūros puslapis <ExternalLink size={14} /></Link></div>
    <header className={shared.header}><button className={shared.brand} onClick={home}><img src="/Piksel-logo-juodas-2026.png" alt="Piksel" /><span>PHOTO PROOF</span></button><div className={s.adminTag}><span />PIKSEL ADMIN</div></header>
    <main className={shared.main}>
      <nav className={shared.breadcrumb}><button onClick={home}>Administravimas</button>{agency && <><ChevronRight size={14} /><button onClick={() => goAgency(agency.id)}>{agency.name}</button></>}{client && <><ChevronRight size={14} /><button onClick={() => goClient(client.id)}>{client.name}</button></>}{campaign && <><ChevronRight size={14} /><span>Kampanija</span></>}</nav>
      <section className={shared.intro}><div><div className={shared.eyebrow}>{campaign ? 'KAMPANIJOS VALDYMAS' : client ? `${agency?.name} / KAMPANIJOS` : agency ? 'AGENTŪROS KATALOGAI' : 'JŪSŲ DARBO ERDVĖ'}</div><h1>{client?.name || agency?.name || 'Agentūros.'}</h1><p>{campaign ? campaign.name : client ? 'Kampanijų nuotraukos, informacija ir dalinimasis.' : agency ? 'Visi agentūros klientai vienoje vietoje.' : 'Tvarkykite agentūras, klientų katalogus ir kampanijų nuotraukas.'}</p></div><div className={s.headerActions}>{agency && <button className={shared.back} onClick={() => campaign ? goClient(client!.id) : client ? goAgency(agency.id) : home()}><ArrowLeft size={16} />Atgal</button>}<button className={s.primary} onClick={() => campaign ? input.current?.click() : startForm(kind)}>{campaign ? <Upload size={17} /> : <Plus size={17} />}{campaign ? 'Įkelti nuotraukas' : client ? 'Nauja kampanija' : agency ? 'Naujas klientas' : 'Nauja agentūra'}</button></div></section>
      {!agency && <div className={s.stats}><div><strong>{agencies.length}</strong><span>Agentūros</span></div><div><strong>{clients.length}</strong><span>Klientų katalogai</span></div><div><strong>{campaigns.length}</strong><span>Kampanijos</span></div><div><strong>{campaigns.filter(item => item.id <= 23).length * 4 + Object.values(uploads).flat().length}</strong><span>Nuotraukos</span></div></div>}
      {message && <div className={s.notice} role="status">{message}<button onClick={() => setMessage('')} aria-label="Uždaryti pranešimą"><X size={16} /></button></div>}
      {campaign ? <>
        <section className={s.campaignInfo}><div><span>KAMPANIJA</span><h2>{campaign.name}</h2><p>{campaign.description || 'Aprašymas nepridėtas.'}</p></div><button className={shared.back} onClick={() => startForm('campaign', campaign)}><Pencil size={15} />Redaguoti</button></section>
        <div className={s.dropzone} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files) }}><Upload size={27} /><h2>Nutempkite nuotraukas čia</h2><p>JPG, PNG, WebP · Makete failai lieka tik naršyklėje</p><button className={shared.back} onClick={() => input.current?.click()}>Pasirinkti failus</button><input ref={input} hidden type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => { addFiles(event.target.files); event.target.value = '' }} /></div>
        <div className={s.sectionTitle}><h2>Nuotraukos <span>{gallery.length}</span></h2><Link href="/mockup/variants">Agentūros peržiūros maketas <ArrowRight size={16} /></Link></div><div className={s.gallery}>{gallery.map((photo, i) => <article key={`${photo.url}-${i}`}><img src={photo.url} alt={photo.name} /><p>{photo.name}</p><span>{i < 4 && campaign.id <= 23 ? 'Pavyzdinė nuotrauka' : 'Pridėta vietinei peržiūrai'}</span></article>)}</div>
      </> : <>
        <div className={shared.toolbar}><div className={s.sectionTitle}><h2>{client ? 'Kampanijos' : agency ? 'Klientų katalogai' : 'Visos agentūros'} <span>{entries.length}</span></h2></div><label className={shared.search}><Search size={17} /><input aria-label="Ieškoti" placeholder={client ? 'Ieškoti kampanijos…' : agency ? 'Ieškoti kliento…' : 'Ieškoti agentūros…'} value={query} onChange={event => setQuery(event.target.value)} /></label></div>
        <div className={s.rows}>{entries.map(entry => <div className={s.row} key={entry.id}><button className={s.entry} onClick={() => client ? (setCampaignId(entry.id), reset()) : agency ? goClient(entry.id) : goAgency(entry.id)}><div className={s.folder}><Folder size={25} /></div><div><h2>{client ? client.name : entry.name}</h2><p>{client ? entry.name : agency ? `Kampanijų: ${campaigns.filter(item => item.parent === entry.id).length}` : `Klientų katalogų: ${clients.filter(item => item.parent === entry.id).length}`}</p></div><ArrowRight size={20} /></button><button className={s.edit} onClick={() => startForm(kind, entry)} aria-label={`Redaguoti ${entry.name}`}><Pencil size={17} /><span>Redaguoti</span></button></div>)}</div>
        {!entries.length && <div className={shared.empty}><Folder size={30} /><h2>{query ? 'Rezultatų nerasta' : 'Čia dar nieko nėra'}</h2><p>{query ? 'Pabandykite kitą pavadinimą.' : 'Pridėkite pirmą įrašą viršuje esančiu mygtuku.'}</p></div>}
      </>}
      <footer className={shared.footer}><span>PIKSEL / PHOTO PROOF</span><span>Administratoriaus dizaino peržiūra · 01 — Švarus</span></footer>
    </main>
    {form && <div className={s.formBackdrop}><section className={s.formPanel} aria-label="Įrašo redagavimas"><button className={s.formClose} onClick={() => setForm(null)} aria-label="Uždaryti"><X /></button><span className={shared.eyebrow}>VIETINIS MAKETAS</span><h2>{form.edit ? 'Redaguoti' : 'Sukurti'} {form.kind === 'agency' ? 'agentūrą' : form.kind === 'client' ? 'klientą' : 'kampaniją'}</h2><form onSubmit={event => { event.preventDefault(); save() }}><label>Pavadinimas<input autoFocus required value={name} onChange={event => setName(event.target.value)} /></label>{form.kind === 'campaign' && <label>Aprašymas<textarea rows={4} value={description} onChange={event => setDescription(event.target.value)} /></label>}<p>Ši forma keičia tik maketo duomenis.</p><button className={s.primary} type="submit">Išsaugoti makete</button></form></section></div>}
  </div>
}
