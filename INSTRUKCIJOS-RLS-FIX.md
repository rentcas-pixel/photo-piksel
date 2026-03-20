# 🔧 Instrukcijos: RLS Politikų Taisymas

## ❌ Problema
Kampanijų (ir galbūt kitų lentelių) RLS politikos neleidžia `renatas@piksel.lt` ir `admin@piksel.lt` kurti/redaguoti/trinti duomenų.

## ✅ Sprendimas
Reikia atnaujinti visas RLS politikas Supabase duomenų bazėje.

---

## 📋 Žingsniai

### 1️⃣ Atidarykite Supabase Dashboard
- Eikite į: https://supabase.com/dashboard
- Prisijunkite su savo paskyra
- Pasirinkite savo projektą

### 2️⃣ Atidarykite SQL Editor
- Kairėje pusėje spustelėkite **"SQL Editor"** (arba **"SQL"**)
- Spustelėkite **"New query"** (arba **"+"** mygtuką)

### 3️⃣ Nukopijuokite SQL kodą
- Atidarykite failą: `fix-campaigns-rls-policies.sql`
- Nukopijuokite **VISĄ** SQL kodą (Ctrl+A, Ctrl+C arba Cmd+A, Cmd+C)

### 4️⃣ Įklijuokite ir vykdykite
- Supabase SQL Editor lange įklijuokite kodą (Ctrl+V arba Cmd+V)
- Spustelėkite **"Run"** mygtuką (arba paspauskite Ctrl+Enter / Cmd+Enter)
- Palaukite, kol užklausa bus įvykdyta

### 5️⃣ Patikrinkite rezultatą
- Turėtumėte matyti pranešimą: `✅ Visos RLS politikos sėkmingai atnaujintos!`
- Jei yra klaidų, patikrinkite, ar visi failai nukopijuoti teisingai

### 6️⃣ Patikrinkite aplikacijoje
- Grįžkite į aplikaciją
- Bandykite sukurti kampaniją
- Dabar turėtų veikti be 403 klaidos! ✅

---

## 📝 Ką daro šis SQL kodas?

Atnaujina RLS politikas šioms lentelėms:
- ✅ **agencies** (Agentūros)
- ✅ **clients** (Klientai)
- ✅ **campaigns** (Kampanijos) - **PAGRINDINĖ PROBLEMA**
- ✅ **photos** (Nuotraukos)

Kiekvienai lentelei nustato, kad abu admin vartotojai gali:
- ➕ INSERT (kurti)
- 👀 SELECT (peržiūrėti)
- ✏️ UPDATE (redaguoti)
- 🗑️ DELETE (trinti)

---

## ⚠️ Svarbu

- Šis kodas **saugus** - jis tik atnaujina politikas, nekeičia duomenų
- Jei kyla klaidų, patikrinkite, ar visos lentelės egzistuoja
- Po vykdymo abu admin vartotojai (`admin@piksel.lt` ir `renatas@piksel.lt`) turės pilnas teises

---

## 🆘 Jei kyla problemų

1. Patikrinkite, ar esate prisijungę teisingu Supabase projektu
2. Patikrinkite, ar visos lentelės (agencies, clients, campaigns, photos) egzistuoja
3. Patikrinkite, ar nėra sintaksės klaidų SQL kode
4. Jei vis dar neveikia, patikrinkite browser console, ar yra kitų klaidų

