export interface Agency {
  id: string
  name: string
  unique_slug: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  agency_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  client_id: string
  filename: string
  original_name: string
  url: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: Agency
        Insert: Omit<Agency, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Agency, 'id' | 'created_at' | 'updated_at'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>
      }
      photos: {
        Row: Photo
        Insert: Omit<Photo, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Photo, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

