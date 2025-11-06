// src/lib/email/service.ts
import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Bosun <notifications@bosun.global>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@bosun.global',
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    // Validate API key
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured')
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
    })

    if (error) {
      console.error('❌ Error sending email:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('✅ Email sent successfully:', data?.id)
    return {
      success: true,
      id: data?.id
    }
  } catch (error) {
    console.error('❌ Exception sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send settlement completion notification
 */
export async function sendSettlementCompleteEmail(params: {
  to: string
  memberName: string
  settlementId: string
  netAmount: number
  netPosition: 'pay' | 'receive'
  settlementDate: string
  numTransactions: number
  grossAmount: number
  savings: number
}): Promise<{ success: boolean; error?: string }> {
  const { to, memberName, settlementId, netAmount, netPosition, settlementDate, numTransactions, grossAmount, savings } = params

  const subject = netPosition === 'pay'
    ? `Settlement Complete - Payment Required: $${Math.abs(netAmount).toLocaleString()}`
    : `Settlement Complete - Payment Incoming: $${Math.abs(netAmount).toLocaleString()}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 40px 30px; }
        .amount-box { background: ${netPosition === 'pay' ? '#fef2f2' : '#f0fdf4'}; border-left: 4px solid ${netPosition === 'pay' ? '#dc2626' : '#16a34a'}; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .amount-box .label { font-size: 14px; color: #666; margin-bottom: 5px; }
        .amount-box .amount { font-size: 32px; font-weight: 700; color: ${netPosition === 'pay' ? '#dc2626' : '#16a34a'}; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .stat { background: #f9fafb; padding: 15px; border-radius: 6px; }
        .stat .label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .stat .value { font-size: 20px; font-weight: 600; color: #333; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 13px; color: #666; }
        .footer a { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Settlement Complete</h1>
          <p>${settlementDate}</p>
        </div>

        <div class="content">
          <p>Hello ${memberName},</p>

          <p>Your settlement has been processed successfully.</p>

          <div class="amount-box">
            <div class="label">${netPosition === 'pay' ? 'Amount to Pay' : 'Amount to Receive'}</div>
            <div class="amount">$${Math.abs(netAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="label">Transactions Processed</div>
              <div class="value">${numTransactions}</div>
            </div>
            <div class="stat">
              <div class="label">Gross Volume</div>
              <div class="value">$${grossAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="stat">
              <div class="label">Network Efficiency</div>
              <div class="value">${((1 - Math.abs(netAmount) / grossAmount) * 100).toFixed(1)}%</div>
            </div>
            <div class="stat">
              <div class="label">Savings vs Wire Transfer</div>
              <div class="value">$${savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          ${netPosition === 'pay' ? `
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Payment due within 24 hours</li>
              <li>Wire transfer instructions will be sent separately</li>
              <li>Settlement ID: <code>${settlementId}</code></li>
            </ul>
          ` : `
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Payment will be received within 24 hours</li>
              <li>Check your dashboard for settlement details</li>
              <li>Settlement ID: <code>${settlementId}</code></li>
            </ul>
          `}

          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bosun.global'}/settlements" class="button">View Settlement Details</a>
          </center>
        </div>

        <div class="footer">
          <p>Questions? Contact us at <a href="mailto:support@bosun.global">support@bosun.global</a></p>
          <p style="margin-top: 20px; font-size: 11px; color: #999;">
            Bosun Settlement Platform<br>
            Powered by Bitcoin Settlement Rails
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}

/**
 * Send application approval notification
 */
export async function sendApplicationApprovedEmail(params: {
  to: string
  companyName: string
  loginUrl: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, companyName, loginUrl, password } = params

  const subject = 'Welcome to Bosun - Your Application is Approved!'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .credentials-box { background: #f0fdf4; border: 2px dashed #10b981; padding: 20px; margin: 20px 0; border-radius: 6px; }
        .credentials-box .label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .credentials-box .value { font-family: monospace; font-size: 14px; background: white; padding: 8px 12px; border-radius: 4px; margin-bottom: 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .features { margin: 30px 0; }
        .feature { display: flex; gap: 15px; margin: 15px 0; }
        .feature-icon { width: 24px; height: 24px; background: #10b981; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 13px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Bosun!</h1>
          <p>Your application has been approved</p>
        </div>

        <div class="content">
          <p>Congratulations ${companyName},</p>

          <p>Your application to join the Bosun settlement network has been approved! You can now start reducing your transaction costs by up to 85%.</p>

          <div class="credentials-box">
            <p><strong>Your Login Credentials:</strong></p>
            <div class="label">Email:</div>
            <div class="value">${to}</div>
            <div class="label">Temporary Password:</div>
            <div class="value">${password}</div>
            <p style="color: #dc2626; font-size: 13px; margin-top: 10px;">⚠️ Please change your password after first login</p>
          </div>

          <div class="features">
            <p><strong>What You Can Do Now:</strong></p>
            <div class="feature">
              <div class="feature-icon">1</div>
              <div>
                <strong>Submit Transactions</strong><br>
                <span style="color: #666; font-size: 14px;">Enter your trade obligations with other members</span>
              </div>
            </div>
            <div class="feature">
              <div class="feature-icon">2</div>
              <div>
                <strong>Daily Settlements</strong><br>
                <span style="color: #666; font-size: 14px;">Automatic netting at 5 PM Dubai time</span>
              </div>
            </div>
            <div class="feature">
              <div class="feature-icon">3</div>
              <div>
                <strong>Track Savings</strong><br>
                <span style="color: #666; font-size: 14px;">Monitor your cost savings vs traditional wire transfers</span>
              </div>
            </div>
          </div>

          <center>
            <a href="${loginUrl}" class="button">Login to Your Dashboard</a>
          </center>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>Need Help Getting Started?</strong><br>
            Our team is here to assist you. Contact us at <a href="mailto:support@bosun.global" style="color: #10b981;">support@bosun.global</a>
          </p>
        </div>

        <div class="footer">
          <p><strong>Transaction Fees:</strong> 0.8% on gross obligations (Year 1)</p>
          <p style="margin-top: 10px;">Settlement Time: Once daily at 5:00 PM Dubai time</p>
          <p style="margin-top: 20px; font-size: 11px; color: #999;">
            Bosun Settlement Platform<br>
            Powered by Bitcoin Settlement Rails
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}

/**
 * Send application rejection notification
 */
export async function sendApplicationRejectedEmail(params: {
  to: string
  companyName: string
  reason?: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, companyName, reason } = params

  const subject = 'Bosun Application Update'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #f3f4f6; color: #333; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 13px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Status Update</h1>
        </div>

        <div class="content">
          <p>Dear ${companyName},</p>

          <p>Thank you for your interest in joining the Bosun settlement network.</p>

          <p>After careful review, we are unable to approve your application at this time.</p>

          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

          <p>If you believe this decision was made in error or if you have additional information to provide, please contact our support team at <a href="mailto:support@bosun.global" style="color: #667eea;">support@bosun.global</a></p>

          <p>We appreciate your interest in Bosun.</p>
        </div>

        <div class="footer">
          <p>Questions? Contact us at <a href="mailto:support@bosun.global">support@bosun.global</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}

/**
 * Send transaction confirmation notification
 */
export async function sendTransactionConfirmationEmail(params: {
  to: string
  memberName: string
  transactionId: string
  counterpartyName: string
  amount: number
  type: 'sent' | 'received'
  reference?: string
  tradeDate: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, memberName, transactionId, counterpartyName, amount, type, reference, tradeDate } = params

  const subject = type === 'sent'
    ? `Transaction Recorded: You owe ${counterpartyName} $${amount.toLocaleString()}`
    : `Transaction Recorded: ${counterpartyName} owes you $${amount.toLocaleString()}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .transaction-box { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #667eea; }
        .transaction-box .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .transaction-box .row:last-child { border-bottom: none; }
        .transaction-box .label { color: #666; font-size: 14px; }
        .transaction-box .value { font-weight: 600; }
        .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 13px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Transaction Recorded</h1>
        </div>

        <div class="content">
          <p>Hello ${memberName},</p>

          <p>A new transaction has been recorded in your account.</p>

          <div class="transaction-box">
            <div class="row">
              <span class="label">Type</span>
              <span class="value">${type === 'sent' ? 'You Owe' : 'They Owe You'}</span>
            </div>
            <div class="row">
              <span class="label">Counterparty</span>
              <span class="value">${counterpartyName}</span>
            </div>
            <div class="row">
              <span class="label">Amount</span>
              <span class="value">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="row">
              <span class="label">Trade Date</span>
              <span class="value">${tradeDate}</span>
            </div>
            ${reference ? `
              <div class="row">
                <span class="label">Reference</span>
                <span class="value">${reference}</span>
              </div>
            ` : ''}
            <div class="row">
              <span class="label">Transaction ID</span>
              <span class="value"><code>${transactionId}</code></span>
            </div>
          </div>

          <p style="font-size: 14px; color: #666;">
            This transaction will be included in the next settlement cycle at 5:00 PM Dubai time.
          </p>
        </div>

        <div class="footer">
          <p>Questions? Contact us at <a href="mailto:support@bosun.global">support@bosun.global</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}
