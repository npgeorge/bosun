// src/lib/monitoring/slack.ts
// Slack webhook integration for admin alerts

export interface SlackMessageOptions {
  text: string
  channel?: string
  username?: string
  icon_emoji?: string
  attachments?: SlackAttachment[]
}

export interface SlackAttachment {
  color?: 'good' | 'warning' | 'danger' | string
  pretext?: string
  title?: string
  title_link?: string
  text?: string
  fields?: Array<{
    title: string
    value: string
    short?: boolean
  }>
  footer?: string
  footer_icon?: string
  ts?: number
}

/**
 * Send a message to Slack via webhook
 */
export async function sendSlackMessage(options: SlackMessageOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL

    if (!webhookUrl) {
      console.warn('⚠️ SLACK_WEBHOOK_URL not configured - skipping Slack notification')
      return { success: false, error: 'Slack webhook not configured' }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: options.username || 'Bosun Bot',
        icon_emoji: options.icon_emoji || ':ship:',
        text: options.text,
        attachments: options.attachments,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Slack webhook failed:', errorText)
      return { success: false, error: errorText }
    }

    console.log('✅ Slack notification sent successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ Error sending Slack message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Alert: Settlement completed successfully
 */
export async function alertSettlementComplete(params: {
  cycleId: string
  transactionsProcessed: number
  settlementsGenerated: number
  totalVolume: number
  savingsPercentage: number
  processingTime: number
}) {
  return sendSlackMessage({
    text: '✅ Settlement Completed',
    attachments: [
      {
        color: 'good',
        title: 'Settlement Cycle Complete',
        title_link: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
        fields: [
          {
            title: 'Cycle ID',
            value: params.cycleId,
            short: true,
          },
          {
            title: 'Transactions',
            value: params.transactionsProcessed.toString(),
            short: true,
          },
          {
            title: 'Settlements',
            value: params.settlementsGenerated.toString(),
            short: true,
          },
          {
            title: 'Total Volume',
            value: `$${params.totalVolume.toLocaleString()}`,
            short: true,
          },
          {
            title: 'Efficiency',
            value: `${params.savingsPercentage.toFixed(1)}%`,
            short: true,
          },
          {
            title: 'Processing Time',
            value: `${params.processingTime.toFixed(2)}s`,
            short: true,
          },
        ],
        footer: 'Bosun Platform',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}

/**
 * Alert: Settlement failed
 */
export async function alertSettlementFailed(params: {
  error: string
  stage?: string
  details?: any
}) {
  return sendSlackMessage({
    text: '🚨 Settlement Failed',
    attachments: [
      {
        color: 'danger',
        title: 'Settlement Processing Error',
        title_link: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
        fields: [
          {
            title: 'Error',
            value: params.error,
            short: false,
          },
          ...(params.stage ? [{
            title: 'Stage',
            value: params.stage,
            short: true,
          }] : []),
          ...(params.details ? [{
            title: 'Details',
            value: JSON.stringify(params.details, null, 2),
            short: false,
          }] : []),
        ],
        footer: 'Bosun Platform - IMMEDIATE ACTION REQUIRED',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}

/**
 * Alert: Circuit breaker triggered
 */
export async function alertCircuitBreakerTriggered(params: {
  violations: Array<{ message: string; value: number; limit: number }>
  totalVolume: number
  memberCount: number
}) {
  return sendSlackMessage({
    text: '⚠️ Circuit Breaker Triggered',
    attachments: [
      {
        color: 'warning',
        title: 'Settlement Halted - Safety Limits Exceeded',
        title_link: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
        text: 'One or more safety limits were exceeded. Settlement has been automatically halted.',
        fields: [
          {
            title: 'Total Volume',
            value: `$${params.totalVolume.toLocaleString()}`,
            short: true,
          },
          {
            title: 'Member Count',
            value: params.memberCount.toString(),
            short: true,
          },
          {
            title: 'Violations',
            value: params.violations.map(v => `• ${v.message} (${v.value} > ${v.limit})`).join('\n'),
            short: false,
          },
        ],
        footer: 'Bosun Platform - Review and adjust limits if needed',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}

/**
 * Alert: Application approved
 */
export async function alertApplicationApproved(params: {
  companyName: string
  email: string
  applicationId: string
}) {
  return sendSlackMessage({
    text: '✅ New Member Approved',
    attachments: [
      {
        color: 'good',
        title: 'Member Application Approved',
        fields: [
          {
            title: 'Company',
            value: params.companyName,
            short: true,
          },
          {
            title: 'Email',
            value: params.email,
            short: true,
          },
          {
            title: 'Application ID',
            value: params.applicationId,
            short: false,
          },
        ],
        footer: 'Bosun Platform',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}

/**
 * Alert: Application rejected
 */
export async function alertApplicationRejected(params: {
  companyName: string
  email: string
  reason?: string
}) {
  return sendSlackMessage({
    text: '❌ Application Rejected',
    attachments: [
      {
        color: '#808080',
        title: 'Member Application Rejected',
        fields: [
          {
            title: 'Company',
            value: params.companyName,
            short: true,
          },
          {
            title: 'Email',
            value: params.email,
            short: true,
          },
          ...(params.reason ? [{
            title: 'Reason',
            value: params.reason,
            short: false,
          }] : []),
        ],
        footer: 'Bosun Platform',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}

/**
 * Alert: High-value transaction
 */
export async function alertHighValueTransaction(params: {
  amount: number
  from: string
  to: string
  transactionId: string
}) {
  return sendSlackMessage({
    text: '💰 High-Value Transaction',
    attachments: [
      {
        color: '#FFA500',
        title: 'Large Transaction Detected',
        fields: [
          {
            title: 'Amount',
            value: `$${params.amount.toLocaleString()}`,
            short: false,
          },
          {
            title: 'From',
            value: params.from,
            short: true,
          },
          {
            title: 'To',
            value: params.to,
            short: true,
          },
          {
            title: 'Transaction ID',
            value: params.transactionId,
            short: false,
          },
        ],
        footer: 'Bosun Platform - Monitor for fraud',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}

/**
 * Daily summary alert
 */
export async function sendDailySummary(params: {
  date: string
  totalTransactions: number
  totalVolume: number
  settlementsCompleted: number
  newMembers: number
  pendingApplications: number
  errors: number
}) {
  return sendSlackMessage({
    text: '📊 Daily Summary',
    attachments: [
      {
        color: '#0066CC',
        title: `Daily Summary - ${params.date}`,
        title_link: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
        fields: [
          {
            title: 'Transactions',
            value: params.totalTransactions.toString(),
            short: true,
          },
          {
            title: 'Volume',
            value: `$${params.totalVolume.toLocaleString()}`,
            short: true,
          },
          {
            title: 'Settlements',
            value: params.settlementsCompleted.toString(),
            short: true,
          },
          {
            title: 'New Members',
            value: params.newMembers.toString(),
            short: true,
          },
          {
            title: 'Pending Apps',
            value: params.pendingApplications.toString(),
            short: true,
          },
          {
            title: 'Errors',
            value: params.errors.toString(),
            short: true,
          },
        ],
        footer: 'Bosun Platform - Daily Metrics',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  })
}
