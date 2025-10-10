# 📸 PIKSEL - Photo Proof Sistema

Multi-tenant nuotraukų valdymo platforma reklamos agentūroms.

---

## 🎯 Kas tai?

**PIKSEL Photo Proof** sistema leidžia:
- **Administratoriams (Piksel)** - įkelti ir valdyti visų agentūrų klientų nuotraukas
- **Agentūroms** - peržiūrėti ir atsisiųsti tik savo klientų nuotraukas

---

## 🚀 Greitas startas

### 1. Instaliacija

```bash
npm install
```

### 2. Paleidimas (Dev režimas)

```bash
npm run dev
```

### 3. Atidarykite naršyklėje

```
http://localhost:3000
```

---

## 🔑 Demo prisijungimas

### Admin panelė:
- **Email:** `admin@piksel.lt`
- **Password:** `Piksel2024!Admin`
- **URL:** http://localhost:3000/admin

### Agentūra (OPEN):
- **Email:** `demo@open.lt`
- **Password:** `demo123`
- **URL:** http://localhost:3000/dashboard

---

## 📋 Funkcionalumas

### ✅ Admin gali:
- ➕ Kurti agentūras ir klientus
- 📤 Įkelti nuotraukas klientams
- ✏️ Redaguoti/trinti agentūras ir klientus
- 🗑️ Trinti nuotraukas
- 📊 Matyti visą sistemos statistiką

### ✅ Agentūros gali:
- 👀 Peržiūrėti tik savo klientus
- 📸 Peržiūrėti tik savo klientų nuotraukas
- ⬇️ Atsisiųsti nuotraukas
- 🔍 Ieškoti nuotraukų
- ❌ **NEGALI** įkelti ar trinti nuotraukų

---

## 🗂️ Projekto struktūra

```
Agentūra → Klientas → Nuotraukos
```

**Pavyzdys:**
```
OPEN Agentūra
  └── IF Draudimas → 6 nuotraukos
  └── Akropoolis → 5 nuotraukos
  └── Maxima → 4 nuotraukos
```

---

## 🛠️ Technologijos

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **TypeScript**
- **Supabase** (PostgreSQL + Auth + Storage)

---

## 📦 Skriptai

```bash
npm run dev      # Paleisti development serverį
npm run build    # Build production versijai
npm run start    # Paleisti production serverį
npm run lint     # Patikrinti kodo kokybę
```

---

## 🔧 Konfigūracija

### Mock režimas (numatytasis)
Sistema automatiškai veikia su mock duomenimis. Nereikia jokios konfigūracijos.

### Tikras Supabase
Sukurkite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Paleiskite `supabase-schema.sql` Supabase SQL Editor.

---

## 📖 Dokumentacija

Išsamią dokumentaciją rasite: **PROJECT-DOCS.md**

---

## 🎨 UI Funkcijos

- ✨ Moderni ir graži sąsaja
- 📱 Responsive dizainas
- 🎯 Intuityvus navigacija
- 🔍 Paieška ir filtravimas
- 📊 Statistikos kortelės
- 🖼️ Nuotraukų galerija su hover efektais

---

## 🔒 Saugumas

- Row Level Security (RLS) Supabase
- Kiekviena agentūra mato tik savo duomenis
- Admin teisės tikrinamos aplikacijos lygmenyje
- Apsaugoti route'ai su autentifikacija

---

## 📧 Pagalba

Kilus klausimams, kreipkitės į Piksel komandą.

---

**Sukurta su ❤️ Piksel komandos**
