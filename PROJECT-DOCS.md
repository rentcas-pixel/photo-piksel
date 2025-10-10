# 📸 PIKSEL - Photo Proof Sistema

## Apie sistemą

**PIKSEL Photo Proof** - tai multi-tenant nuotraukų valdymo platforma, sukurta **reklamos agentūroms** ir jų klientams. Sistema leidžia Piksel administratoriams saugiai talpinti, organizuoti ir valdyti visų agentūrų klientų nuotraukas, o agentūros gali peržiūrėti ir atsisiųsti tik savo klientų nuotraukas.

---

## 🏗️ Architektūra

### Hierarchija:
```
Admin (Piksel darbuotojai)
  └── Agentūros (pvz., OPEN Agentūra)
      └── Klientai (pvz., IF Draudimas, Akropoolis, Maxima)
          └── Nuotraukos
```

### Duomenų bazės schema:
- **agencies** - Agentūros (susietos su auth.users)
- **clients** - Klientai (susieti su agentūromis)
- **photos** - Nuotraukos (susietos su klientais)

---

## 👥 Vartotojų rolės ir teisės

### 1. **ADMIN (Piksel darbuotojai)**

**Prisijungimas:** `admin@piksel.lt` / `Piksel2024!Admin`

**Teisės:**
- ✅ Kurti, redaguoti ir trinti agentūras
- ✅ Kurti, redaguoti ir trinti klientus
- ✅ **Įkelti nuotraukas** visiems klientams
- ✅ Trinti nuotraukas
- ✅ Matyti visą sistemos statistiką
- ✅ Pilnas prieigas prie visų duomenų

**Puslapiai:**
- `/admin` - Dashboard su statistika
- `/admin/agencies` - Agentūrų valdymas
- `/admin/photos` - Nuotraukų valdymas ir įkėlimas
- `/admin/clients/new` - Naujo kliento sukūrimas
- `/admin/clients/[id]/edit` - Kliento redagavimas

---

### 2. **AGENTŪROS (pvz., OPEN Agentūra)**

**Prisijungimas:** `demo@open.lt` / `demo123`

**Teisės:**
- ✅ Peržiūrėti **tik savo klientus**
- ✅ Peržiūrėti **tik savo klientų nuotraukas**
- ✅ Atsisiųsti nuotraukas
- ❌ **NEGALI įkelti** nuotraukų
- ❌ **NEGALI trinti** nuotraukų
- ❌ **NEGALI matyti kitų agentūrų** duomenų

**Puslapiai:**
- `/dashboard` - Pagrindinis (statistika)
- `/dashboard/clients` - Klientų sąrašas
- `/dashboard/clients/[id]` - Konkretaus kliento nuotraukos
- `/dashboard/photos` - Visų klientų nuotraukos (su filtru)

---

## 🔒 Row Level Security (RLS)

Sistema naudoja Supabase RLS politikas, užtikrinančias, kad:

1. **Agentūros mato tik savo duomenis:**
   - Klientai: `WHERE agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid())`
   - Nuotraukos: `WHERE client_id IN (SELECT id FROM clients WHERE agency_id IN ...)`

2. **Admin mato viską:**
   - Naudojama aplikacijos logika su `isAdmin()` funkcija

---

## 🚀 Paleidimas

### Reikalavimai:
- Node.js 18+
- npm arba yarn
- Supabase projektas (arba mock režimas)

### Paleidimo žingsniai:

1. **Įdiekite priklausomybes:**
```bash
cd photo-management-system
npm install
```

2. **Sukonfigūruokite Supabase (arba naudokite mock režimą):**

**Variantas A: Mock režimas (be tikro Supabase)**
- Sistema automatiškai veiks mock režimu, jei nėra `NEXT_PUBLIC_SUPABASE_URL`
- Naudoja `src/lib/mock-auth.ts` duomenis

**Variantas B: Tikras Supabase**
- Sukurkite `.env.local` failą:
```env
NEXT_PUBLIC_SUPABASE_URL=jūsų_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=jūsų_anon_key
SUPABASE_SERVICE_ROLE_KEY=jūsų_service_role_key
```
- Paleiskite schemą: `supabase-schema.sql` Supabase SQL Editor

3. **Paleiskite projektą:**
```bash
npm run dev
```

4. **Atidarykite naršyklėje:**
```
http://localhost:3000
```

---

## 📁 Projekto struktūra

```
photo-management-system/
├── src/
│   ├── app/
│   │   ├── admin/                    # Admin panelė
│   │   │   ├── page.tsx             # Dashboard
│   │   │   ├── agencies/            # Agentūrų valdymas
│   │   │   ├── clients/             # Klientų valdymas
│   │   │   └── photos/              # Nuotraukų įkėlimas
│   │   ├── dashboard/               # Agentūrų panelė
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── clients/            # Klientų peržiūra
│   │   │   └── photos/             # Nuotraukų peržiūra
│   │   ├── login/                  # Prisijungimo puslapis
│   │   └── page.tsx                # Pagrindinis puslapis
│   ├── components/
│   │   ├── AuthProvider.tsx        # Autentifikacijos kontekstas
│   │   └── ProtectedRoute.tsx      # Apsaugoti route'ai
│   ├── lib/
│   │   ├── supabase.ts            # Supabase klientas
│   │   ├── mock-auth.ts           # Mock autentifikacija
│   │   └── auth-utils.ts          # Admin teisių patikra
│   └── types/
│       └── database.ts            # TypeScript tipai
├── supabase-schema.sql            # Duomenų bazės schema
└── package.json
```

---

## 🔑 Prisijungimo duomenys

### Admin:
- **Email:** `admin@piksel.lt`
- **Password:** `Piksel2024!Admin`

### Demo agentūra (OPEN):
- **Email:** `demo@open.lt`
- **Password:** `demo123`

---

## 📊 Pagrindinės funkcijos

### Admin funkcijos:
1. **Agentūrų valdymas** - Kurti/redaguoti/trinti agentūras
2. **Klientų valdymas** - Kurti klientus ir priskirti agentūroms
3. **Nuotraukų įkėlimas** - Įkelti nuotraukas pasirinktiems klientams
4. **Statistika** - Matyti kiek agentūrų, klientų, nuotraukų

### Agentūrų funkcijos:
1. **Klientų peržiūra** - Matyti tik savo klientus
2. **Nuotraukų peržiūra** - Matyti ir filtruoti savo klientų nuotraukas
3. **Atsisiuntimas** - Atsisiųsti nuotraukas (po vieną arba visas)
4. **Paieška** - Ieškoti nuotraukų pagal pavadinimą ar klientą

---

## 🔧 Technologijos

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Duomenų bazė:** Supabase (PostgreSQL + RLS)
- **Autentifikacija:** Supabase Auth (arba Mock)
- **Saugojimas:** Supabase Storage
- **Ikonos:** Lucide React
- **TypeScript:** Pilnai tipizuotas kodas

---

## 🗄️ Duomenų bazės schema

### agencies
```sql
- id (UUID)
- user_id (UUID) → auth.users
- name (VARCHAR)
- email (VARCHAR)
- created_at, updated_at
```

### clients
```sql
- id (UUID)
- agency_id (UUID) → agencies
- name (VARCHAR)
- description (TEXT)
- created_at, updated_at
```

### photos
```sql
- id (UUID)
- client_id (UUID) → clients
- filename (VARCHAR)
- original_name (VARCHAR)
- file_size (BIGINT)
- mime_type (VARCHAR)
- url (TEXT)
- thumbnail_url (TEXT)
- created_at, updated_at
```

---

## 🚧 Būsimi patobulinimai

1. ✨ Nuotraukų patvirtinimo workflow
2. ✨ Masinis nuotraukų atsisiuntimas (ZIP)
3. ✨ Nuotraukų komentavimas
4. ✨ Email pranešimai apie naujas nuotraukas
5. ✨ Agentūrų aktyvumo ataskaitos
6. ✨ Nuotraukų kategorijos/tagos

---

## 📝 Pastabos

- Sistema šiuo metu veikia **mock režimu** demonstracijai
- Prijungus tikrą Supabase, reikia sukurti vartotojus per Supabase Auth
- RLS politikos užtikrina duomenų atskyrimą tarp agentūrų
- Admin teisės tikrinamos per `isAdmin()` funkciją pagal email

---

## 📧 Kontaktai

Klausimams ir pagalbai kreipkitės į Piksel komandą.



