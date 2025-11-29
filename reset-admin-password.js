const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Trūksta Supabase konfigūracijos .env.local faile')
  console.error('Reikia: NEXT_PUBLIC_SUPABASE_URL ir SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAdminPassword() {
  console.log('🔐 Atnaujinu admin vartotojo slaptažodį...\n')

  try {
    const email = 'admin@piksel.lt'
    const password = 'Piksel2024!Admin'

    // Pirmiausia patikrinkime, ar vartotojas egzistuoja
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Klaida gaunant vartotojų sąrašą:', listError.message)
      return
    }

    const existingUser = users.users.find(u => u.email === email)

    if (existingUser) {
      // Vartotojas egzistuoja - atnaujinkime slaptažodį
      console.log(`✅ Radau vartotoją: ${email}`)
      console.log('🔄 Atnaujinu slaptažodį...')
      
      const { data, error } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      )

      if (error) {
        console.error('❌ Klaida atnaujinant slaptažodį:', error.message)
      } else {
        console.log('✅ Slaptažodis sėkmingai atnaujintas!')
        console.log(`\n📋 Prisijungimo duomenys:`)
        console.log(`   Email: ${email}`)
        console.log(`   Password: ${password}\n`)
      }
    } else {
      // Vartotojas neegzistuoja - sukurkime naują
      console.log(`⚠️  Vartotojas ${email} neegzistuoja`)
      console.log('➕ Kuriu naują vartotoją...')
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
      })

      if (error) {
        console.error('❌ Klaida kuriant vartotoją:', error.message)
      } else {
        console.log('✅ Vartotojas sėkmingai sukurtas!')
        console.log(`\n📋 Prisijungimo duomenys:`)
        console.log(`   Email: ${email}`)
        console.log(`   Password: ${password}\n`)
      }
    }
  } catch (error) {
    console.error('❌ Klaida:', error.message)
  }
}

resetAdminPassword()

