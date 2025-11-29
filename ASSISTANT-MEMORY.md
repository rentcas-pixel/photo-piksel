# PIKSEL Photo Proof Sistema - Asistento Atmintis

## 📋 Projekto Apžvalga

**PIKSEL Photo Proof** - Multi-tenant nuotraukų valdymo platforma reklamos agentūroms.

### Technologijos
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + Auth + Storage)
- **JSZip** (bulk download)

---

## 🔑 Svarbiausi Vartotojai

### Admin Vartotojai
1. **admin@piksel.lt** / `Piksel2024!Admin`
2. **renatas@piksel.lt** / `sauletekis`

**Svarbu:** Abu vartotojai turi admin teises tiek aplikacijos lygmenyje, tiek Supabase RLS policies.

### Demo Vartotojas
- **demo@open.lt** / `demo123`

---

## 🎯 Pagrindinės Funkcijos

### Admin Funkcijos
- ✅ Kurti agentūras (katalogus)
- ✅ Kurti klientus
- ✅ Kurti kampanijas
- ✅ Įkelti nuotraukas (naudojant API route su Service Role Key)
- ✅ Valdyti visas agentūras, klientus, kampanijas

### Kliento Funkcijos (Public Pages)
- ✅ Peržiūrėti nuotraukas pagal agentūrą → klientą → kampaniją
- ✅ Atsisiųsti nuotraukas (po vieną arba visas ZIP)
- ✅ Klaviatūros navigacija (ArrowLeft/ArrowRight, ESC)
- ✅ Foto skaitiklis "X / Y" lightbox modale
- ✅ "NEW" badge indikatoriai naujoms nuotraukoms

---

## 🔧 Svarbūs Techniniai Detalai

### Foto Įkėlimas
- **API Route:** `/api/upload-photo/route.ts`
- **Metodas:** Naudoja Supabase Service Role Key (bypasses RLS)
- **Reikalingas:** `SUPABASE_SERVICE_ROLE_KEY` environment variable
- **Problema:** Jei neveikia, patikrinti:
  1. Ar `SUPABASE_SERVICE_ROLE_KEY` yra nustatytas (lokaliai `.env.local`, production Vercel)
  2. Ar Storage policies leidžia INSERT (bet API route naudoja Service Role, tai neturėtų būti problema)

### Admin Teisių Tikrinimas
- **Failai:** 
  - `src/app/admin/layout.tsx` (lines 68, 247)
  - `src/app/login/page.tsx` (line 34)
- **Admin emails:** `['admin@piksel.lt', 'renatas@piksel.lt']`
- **RLS Policies:** SQL failuose naudojama `auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt')`

### Klaviatūros Navigacija
- **Failas:** `src/app/[slug]/[clientId]/[campaignId]/page.tsx`
- **Funkcijos:**
  - `ArrowLeft` - ankstesnė nuotrauka (su loop)
  - `ArrowRight` - kita nuotrauka (su loop)
  - `Escape` - uždaryti lightbox
- **Foto skaitiklis:** Rodo "X / Y" viršutiniame kairiajame kampe lightbox modalo

### "NEW" Badge Sistema
- **Kampanijų puslapyje:** Rodo kiek naujų nuotraukų kiekvienoje kampanijoje
- **Nuotraukų puslapyje:** Rodo "NEW" badge ant thumbnails, kurie išnyksta tik kai nuotrauka atidaroma
- **Storage:** Naudoja `localStorage` su keys:
  - `last_visits_${clientId}` - paskutinio apsilankymo datos
  - `viewed_photos_${clientId}_${campaignId}` - peržiūrėtų nuotraukų ID sąrašas

---

## 📁 Svarbūs Failai

### Konfigūracija
- `src/lib/supabase.ts` - Supabase client inicializacija
- `.env.local` - Lokalūs environment variables (NE commit'inti)

### Admin Funkcionalumas
- `src/app/admin/layout.tsx` - Admin layout su modals
- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/api/upload-photo/route.ts` - Foto įkėlimo API route

### Public Pages
- `src/app/[slug]/page.tsx` - Agentūros puslapis (klientų sąrašas)
- `src/app/[slug]/[clientId]/page.tsx` - Kliento puslapis (kampanijų sąrašas)
- `src/app/[slug]/[clientId]/[campaignId]/page.tsx` - Kampanijos puslapis (nuotraukos su lightbox)

### SQL Failai
- `supabase-schema.sql` - Pagrindinė schema su RLS policies
- `add-renatas-admin.sql` - SQL skriptas pridėti `renatas@piksel.lt` kaip admin

### Helper Skriptai
- `reset-admin-password.js` - Atnaujinti admin slaptažodį
- `setup-supabase.js` - Pilnas Supabase setup

---

## 🐛 Troubleshooting

### Problema: Foto įkėlimas neveikia
**Klaida:** `StorageApiError: new row violates row-level security policy`

**Sprendimas:**
1. Patikrinti, ar `SUPABASE_SERVICE_ROLE_KEY` yra nustatytas
2. API route `/api/upload-photo/route.ts` naudoja Service Role Key, kuris bypass'ina RLS
3. Jei vis dar neveikia, patikrinti Storage policies Supabase Dashboard

### Problema: Admin negali prisijungti
**Sprendimas:**
1. Patikrinti, ar vartotojas egzistuoja Supabase Auth
2. Patikrinti, ar email yra patvirtintas (`email_confirmed_at` turi būti nustatyta)
3. Patikrinti, ar vartotojas yra admin sąraše (`admin@piksel.lt` arba `renatas@piksel.lt`)
4. Patikrinti RLS policies - ar jie leidžia admin vartotojams

### Problema: Lokaliai veikia, bet production neveikia
**Sprendimas:**
1. Patikrinti Vercel Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (svarbu!)
2. Redeploy projektą po environment variables pridėjimo

### Problema: Klaviatūros navigacija neveikia
**Sprendimas:**
1. Patikrinti, ar lightbox modalas atidarytas (`selectedPhoto !== null`)
2. Patikrinti browser console ar yra JavaScript klaidų
3. Patikrinti, ar event listener'ai yra teisingai pridėti (lines 101-131)

---

## 🔄 Deployment

### Vercel Deployment
- **Auto-deploy:** Įjungtas (push į `main` branch automatiškai deploy'ina)
- **Environment Variables:** Reikia nustatyti Vercel Dashboard → Settings → Environment Variables
- **Build Command:** `npm run build` (numatytasis Next.js)
- **Output Directory:** `.next` (numatytasis Next.js)

### Svarbu Deployment'e:
1. **Environment Variables** - visi trys Supabase kintamieji turi būti nustatyti
2. **Service Role Key** - ypač svarbus foto įkėlimui
3. **RLS Policies** - turi būti atnaujintos Supabase (ne Vercel)

---

## 📝 Pastabos

### Local Development
- Naudoja `.env.local` failą (ne commit'inamas)
- Development serveris: `npm run dev`
- Port: `http://localhost:3000`

### Production
- Naudoja Vercel environment variables
- URL: (priklauso nuo Vercel projekto)

### Supabase
- **Project URL:** `jttsqyxzzbcrnxgekuzd.supabase.co`
- **RLS:** Įjungtas visoms lentelėms
- **Storage Bucket:** `photos` (public)

---

## 🎨 UI Funkcijos

### Lightbox Modal
- Juodi mygtukai su baltomis ikonėmis (50% mažesni nei originaliai)
- Navigacijos mygtukai (ChevronLeft, ChevronRight)
- Download mygtukas
- Close mygtukas (X)
- Foto skaitiklis viršutiniame kairiajame kampe

### "NEW" Badge
- Raudonas badge su "NEW" tekstu
- Ant kampanijų: rodo skaičių "X naujos"
- Ant nuotraukų: rodo "NEW" badge, kuris išnyksta tik kai nuotrauka atidaroma

---

## 🔐 Saugumas

### Row Level Security (RLS)
- Visos lentelės turi RLS įjungtą
- Admin policies naudoja email tikrinimą: `auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt')`
- Storage policies leidžia authenticated users įkelti (bet API route naudoja Service Role, kuris bypass'ina)

### Authentication
- Supabase Auth naudojamas prisijungimui
- Admin teisės tikrinamos aplikacijos lygmenyje (ne tik RLS)
- Mock mode palaikomas (bet ne naudojamas production)

---

## 📚 Naudingi Komandos

```bash
# Development
cd photo-management-system
npm run dev

# Build
npm run build

# Git
git add .
git commit -m "Message"
git push

# Supabase SQL
# Paleisti SQL failus Supabase Dashboard → SQL Editor
```

---

## 🆘 Greitas Troubleshooting Checklist

1. ✅ Ar environment variables nustatyti? (lokaliai `.env.local`, production Vercel)
2. ✅ Ar vartotojas egzistuoja Supabase Auth?
3. ✅ Ar vartotojas yra admin sąraše?
4. ✅ Ar RLS policies atnaujintos?
5. ✅ Ar Service Role Key yra nustatytas?
6. ✅ Ar Storage policies leidžia INSERT?
7. ✅ Ar yra JavaScript klaidų browser console?
8. ✅ Ar network requests baigiasi sėkmingai?

---

**Paskutinis atnaujinimas:** 2025-01-01
**Projektas:** PIKSEL Photo Proof Sistema
**Versija:** Production Ready

