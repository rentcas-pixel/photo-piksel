import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase Service Role Key')
}

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('Missing Supabase Service Role Key. Check .env.local file.')
      return NextResponse.json(
        { error: 'Server configuration error: Missing Service Role Key. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const campaignId = formData.get('campaignId') as string

    if (!file || !campaignId) {
      return NextResponse.json(
        { error: 'Missing file or campaignId' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`

    // Upload to storage using service role key (bypasses RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}`, details: uploadError },
        { status: 400 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('photos')
      .getPublicUrl(fileName)

    // Insert into database using service role key (bypasses RLS)
    const { error: dbError, data: dbData } = await supabaseAdmin
      .from('photos')
      .insert({
        campaign_id: campaignId,
        filename: fileName,
        original_name: file.name,
        url: publicUrl,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: dbError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: dbData })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

