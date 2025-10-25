// src/lib/utils/audit-log.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DatabaseError, logError } from './errors'

export interface AuditLogData {
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  timestamp: string
}

/**
 * Log an audit event
 * @throws {DatabaseError} if the audit log cannot be written
 */
export async function logAudit(data: AuditLogData): Promise<AuditLog> {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new DatabaseError('Cannot log audit: No authenticated user', authError)
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
      throw new DatabaseError('Failed to write audit log', error)
    }

    return auditLog as AuditLog
  } catch (error) {
    logError(error, { action: 'audit_log_write', data })
    // Re-throw instead of silently failing
    if (error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError('Audit log exception', error)
  }
}

export interface AdminOverride {
  id: string
  user_id: string
  override_type: string
  entity_type: string
  entity_id: string
  original_value: unknown
  new_value: unknown
  reason: string
  created_at: string
}

/**
 * Log an admin override with full audit trail
 * @throws {DatabaseError} if the override cannot be logged
 */
export async function logOverride(
  overrideType: string,
  entityType: string,
  entityId: string,
  originalValue: unknown,
  newValue: unknown,
  reason: string
): Promise<AdminOverride> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new DatabaseError('No authenticated user for override', authError)
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

    if (error) {
      throw new DatabaseError('Failed to log override', error)
    }

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

    return override as AdminOverride
  } catch (error) {
    logError(error, { action: 'log_override', overrideType, entityType, entityId })
    if (error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError('Failed to log override', error)
  }
}