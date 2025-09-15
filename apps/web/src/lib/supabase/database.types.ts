export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      portals: {
        Row: {
          id: string
          name: string
          url: string
          description: string | null
          status: 'active' | 'inactive' | 'maintenance' | 'error'
          environment: 'production' | 'staging' | 'development' | 'testing'
          response_time: number | null
          uptime_percentage: number | null
          last_checked: string
          health_endpoint: string | null
          is_favorite: boolean
          tags: string[] | null
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          url: string
          description?: string | null
          status?: 'active' | 'inactive' | 'maintenance' | 'error'
          environment?: 'production' | 'staging' | 'development' | 'testing'
          response_time?: number | null
          uptime_percentage?: number | null
          last_checked?: string
          health_endpoint?: string | null
          is_favorite?: boolean
          tags?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          url?: string
          description?: string | null
          status?: 'active' | 'inactive' | 'maintenance' | 'error'
          environment?: 'production' | 'staging' | 'development' | 'testing'
          response_time?: number | null
          uptime_percentage?: number | null
          last_checked?: string
          health_endpoint?: string | null
          is_favorite?: boolean
          tags?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      portal_metrics: {
        Row: {
          id: string
          portal_id: string
          response_time: number | null
          status_code: number | null
          is_healthy: boolean | null
          error_message: string | null
          checked_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          portal_id: string
          response_time?: number | null
          status_code?: number | null
          is_healthy?: boolean | null
          error_message?: string | null
          checked_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          portal_id?: string
          response_time?: number | null
          status_code?: number | null
          is_healthy?: boolean | null
          error_message?: string | null
          checked_at?: string
          metadata?: Json
        }
      }
      incidents: {
        Row: {
          id: string
          portal_id: string | null
          title: string
          description: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'investigating' | 'resolved' | 'closed'
          reported_by: string | null
          assigned_to: string | null
          resolved_at: string | null
          resolution_notes: string | null
          tags: string[] | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portal_id?: string | null
          title: string
          description?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'investigating' | 'resolved' | 'closed'
          reported_by?: string | null
          assigned_to?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          tags?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portal_id?: string | null
          title?: string
          description?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'investigating' | 'resolved' | 'closed'
          reported_by?: string | null
          assigned_to?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          tags?: string[] | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      incident_comments: {
        Row: {
          id: string
          incident_id: string
          user_id: string | null
          comment: string
          is_internal: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          incident_id: string
          user_id?: string | null
          comment: string
          is_internal?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          incident_id?: string
          user_id?: string | null
          comment?: string
          is_internal?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      statistics: {
        Row: {
          id: string
          stat_name: string
          stat_value: number | null
          stat_unit: string | null
          category: string | null
          metadata: Json
          recorded_at: string
        }
        Insert: {
          id?: string
          stat_name: string
          stat_value?: number | null
          stat_unit?: string | null
          category?: string | null
          metadata?: Json
          recorded_at?: string
        }
        Update: {
          id?: string
          stat_name?: string
          stat_value?: number | null
          stat_unit?: string | null
          category?: string | null
          metadata?: Json
          recorded_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      portal_status: 'active' | 'inactive' | 'maintenance' | 'error'
      portal_environment: 'production' | 'staging' | 'development' | 'testing'
      incident_severity: 'low' | 'medium' | 'high' | 'critical'
      incident_status: 'open' | 'investigating' | 'resolved' | 'closed'
    }
  }
}