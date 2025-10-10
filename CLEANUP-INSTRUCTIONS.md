# 🧹 Sistemos Valymo Instrukcijos

Sistema išvalyta. Pašalinti visi nereikalingi elementai.

---

## ✅ Kas buvo pašalinta iš kodo:

1. **`/dashboard` direktorija** - senasis agency dashboard su autentifikacija
2. **`/api` direktorija** - senasis API route'as agentūrų kūrimui
3. **TypeScript tipai** - pašalinti `email`, `user_id`, `description`, `file_size`, `mime_type`, `thumbnail_url`
4. **Middleware** - pašalintas `/dashboard/:path*` matcher

---

## 📋 Ką reikia padaryti Supabase:

### 1️⃣ Paleiskite SQL komaną:

Eikite į **Supabase Dashboard → SQL Editor** ir paleiskite šį SQL failą:

**Failas:** `cleanup-migration.sql`

```sql
-- Kopijavimas nereikalingas - failas jau sukurtas projekte
```

Arba nukopijuokite ir paleiskite šį kodą:

```sql
-- 1. Pašalinti nereikalingus stulpelius
ALTER TABLE agencies DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE agencies DROP COLUMN IF EXISTS email CASCADE;
ALTER TABLE clients DROP COLUMN IF EXISTS description CASCADE;
ALTER TABLE photos DROP COLUMN IF EXISTS thumbnail_url CASCADE;
ALTER TABLE photos DROP COLUMN IF EXISTS file_size CASCADE;
ALTER TABLE photos DROP COLUMN IF EXISTS mime_type CASCADE;
```

### 2️⃣ Patikrinkite RLS policies:

Įsitikinkite, kad sukurti teisingi RLS policies. Failas `cleanup-migration.sql` juos automatiškai atnaujins.

---

## ✅ Sistema dabar:

### **Admin panelė (`/admin`)**
- Kuria agentūras su `unique_slug`
- Kuria klientus
- Įkelia fotos
- Trina viską

### **Viešos agentūrų nuorodos (`/{slug}`)**
- Agentūros gauna viešą nuorodą be prisijungimo
- Mato tik savo klientus ir fotos
- Gali atsisiųsti fotos

### **Duomenų struktūra:**

**agencies**
- `id` (UUID)
- `name` (VARCHAR)
- `unique_slug` (TEXT, UNIQUE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**clients**
- `id` (UUID)
- `agency_id` (UUID → agencies)
- `name` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**photos**
- `id` (UUID)
- `client_id` (UUID → clients)
- `filename` (VARCHAR)
- `original_name` (VARCHAR)
- `url` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## 🚀 Testavimas:

1. Eikite į `http://localhost:3000/admin`
2. Prisijunkite su `admin@piksel.lt`
3. Sukurkite naują agentūrą
4. Nukopijuokite jos viešą nuorodą
5. Atidarykite tą nuorodą naujame lange
6. Patikrinkite, ar matote klientus ir fotos

---

## 📦 Nauji failai:

- `supabase-schema-clean.sql` - nauja, švarių schemų versija (naudoti naujiems projektams)
- `cleanup-migration.sql` - migracija esamai duomenų bazei
- `CLEANUP-INSTRUCTIONS.md` - šios instrukcijos

---

## ⚠️ Pastaba:

Visi duomenys (agentūros, klientai, fotos) **išlieka** Supabase. Pašalinami tik nereikalingi stulpeliai ir RLS policies.

