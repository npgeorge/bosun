// src/lib/utils/audit-log.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface AuditLogData {
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(data: AuditLogData) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('Cannot log audit: No authenticated user')
      return null
    }

    const { data: auditLog, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        details: data.details,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
      })
      .select()
      .single()

    if (error) {
      console.error('Audit log error:', error)
      return null
    }

    return auditLog
  } catch (error) {
    console.error('Audit log exception:', error)
    return null
  }
}

export async function logOverride(
  overrideType: string,
  entityType: string,
  entityId: string,
  originalValue: any,
  newValue: any,
  reason: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data: override, error } = await supabase
      .from('admin_manual_overrides')
      .insert({
        user_id: user.id,
        override_type: overrideType,
        entity_type: entityType,
        entity_id: entityId,
        original_value: originalValue,
        new_value: newValue,
        reason: reason,
      })
      .select()
      .single()

    if (error) throw error

    // Also log to audit_logs
    await logAudit({
      action: `override.${overrideType}`,
      entityType: entityType,
      entityId: entityId,
      details: {
        original_value: originalValue,
        new_value: newValue,
        reason: reason,
      }
    })

    return override
  } catch (error) {
    console.error('Override log error:', error)
    throw error
  }
}