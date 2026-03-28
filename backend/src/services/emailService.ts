/**
 * Email service
 * Issue #378: MJML-based email template system
 *
 * Sends transactional emails via SendGrid using compiled MJML templates.
 * All template rendering is delegated to the templateEngine module.
 */
import sgMail from '@sendgrid/mail'
import { createModuleLogger } from '../utils/logger'
import {
  renderTemplate,
  htmlToText,
  buildGroupRows,
} from '../emails/templateEngine'

const logger = createModuleLogger('EmailService')

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// ── Service class ──────────────────────────────────────────────────────────

export class EmailService {
  private readonly fromEmail: string
  private readonly isEnabled: boolean
  private readonly frontendUrl: string
  private readonly unsubscribeBase: string

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@ajo.app'
    this.isEnabled = !!process.env.SENDGRID_API_KEY
    this.frontendUrl = process.env.FRONTEND_URL || 'https://ajo.app'
    this.unsubscribeBase = `${this.frontendUrl}/unsubscribe`
  }

  // ── Low-level send ───────────────────────────────────────────────────────

  /**
   * Sends a generic email using the configured SendGrid provider.
   * Automatically handles template rendering (if needed) and error logging.
   * 
   * @param options - Structured email details (to, subject, content)
   * @returns Promise resolving to true if sent successfully, false otherwise
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEnabled) {
      logger.debug('Email service disabled — SENDGRID_API_KEY not set', {
        to: options.to,
        subject: options.subject,
      })
      return false
    }

    try {
      await sgMail.send({
        to: options.to,
        from: this.fromEmail,
        subject: options.subject,
        html: options.html,
        text: options.text ?? htmlToText(options.html),
      })
      logger.info('Email sent', { to: options.to, subject: options.subject })
      return true
    } catch (error) {
      logger.error('Email send failed', { error, to: options.to, subject: options.subject })
      return false
    }
  }

  // ── Typed send methods ───────────────────────────────────────────────────

  /**
   * Sends a welcome email to a newly registered user.
   * 
   * @param to - Recipient's email address
   * @param name - Display name of the user
   * @returns Promise resolving to true if sent successfully
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const html = renderTemplate('welcome', {
      name,
      dashboardUrl: `${this.frontendUrl}/dashboard`,
      unsubscribeUrl: this.unsubscribeBase,
    })
    return this.sendEmail({ to, subject: 'Welcome to Ajo!', html })
  }

  /**
   * Sends a reminder email to a group member for an upcoming contribution.
   * 
   * @param to - Recipient's email address
   * @param groupName - Name of the savings group
   * @param amount - Contribution amount as a display string
   * @param dueDate - Formatted due date string
   * @param cycleNumber - The current round/cycle number
   * @param groupId - The unique ID of the group
   * @returns Promise resolving to true if sent successfully
   */
  async sendContributionReminder(
    to: string,
    groupName: string,
    amount: string,
    dueDate: string,
    cycleNumber: number,
    groupId: string
  ): Promise<boolean> {
    const html = renderTemplate('contributionReminder', {
      groupName,
      amount,
      dueDate,
      cycleNumber,
      groupUrl: `${this.frontendUrl}/groups/${groupId}`,
      unsubscribeUrl: this.unsubscribeBase,
    })
    return this.sendEmail({
      to,
      subject: `Contribution Reminder: ${groupName}`,
      html,
    })
  }

  async sendPayoutNotification(
    to: string,
    groupName: string,
    amount: string,
    txHash: string,
    cycleNumber: number,
    date: string
  ): Promise<boolean> {
    const html = renderTemplate('payoutNotification', {
      groupName,
      amount,
      cycleNumber,
      date,
      txHash,
      txUrl: `${this.frontendUrl}/transactions/${txHash}`,
      unsubscribeUrl: this.unsubscribeBase,
    })
    return this.sendEmail({
      to,
      subject: `Payout Received: ${groupName}`,
      html,
    })
  }

  async sendGroupInvitation(
    to: string,
    groupName: string,
    inviterName: string,
    inviteLink: string,
    groupDetails: {
      contributionAmount: string
      cycleDuration: string
      currentMembers: number
      maxMembers: number
    }
  ): Promise<boolean> {
    const html = renderTemplate('groupInvitation', {
      groupName,
      inviterName,
      inviteLink,
      contributionAmount: groupDetails.contributionAmount,
      cycleDuration: groupDetails.cycleDuration,
      currentMembers: groupDetails.currentMembers,
      maxMembers: groupDetails.maxMembers,
      unsubscribeUrl: this.unsubscribeBase,
    })
    return this.sendEmail({
      to,
      subject: `You're invited to join ${groupName}`,
      html,
    })
  }

  async sendTransactionReceipt(
    to: string,
    data: {
      groupName: string
      amount: string
      txHash: string
      date: string
      cycleNumber: number
    }
  ): Promise<boolean> {
    const html = renderTemplate('transactionReceipt', {
      groupName: data.groupName,
      amount: data.amount,
      cycleNumber: data.cycleNumber,
      date: data.date,
      txHash: data.txHash,
      txUrl: `${this.frontendUrl}/transactions/${data.txHash}`,
      unsubscribeUrl: this.unsubscribeBase,
    })
    return this.sendEmail({ to, subject: 'Transaction Receipt', html })
  }

  async sendWeeklySummary(
    to: string,
    data: {
      weekOf: string
      activeGroups: number
      totalSaved: string
      contributionCount: number
      groups: Array<{ name: string; contributions: number; balance: string; status: string }>
    }
  ): Promise<boolean> {
    const html = renderTemplate('weeklySummary', {
      weekOf: data.weekOf,
      activeGroups: data.activeGroups,
      totalSaved: data.totalSaved,
      contributionCount: data.contributionCount,
      groupRows: buildGroupRows(data.groups),
      dashboardUrl: `${this.frontendUrl}/dashboard`,
      unsubscribeUrl: this.unsubscribeBase,
    })
    return this.sendEmail({ to, subject: 'Your Weekly Ajo Summary', html })
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verifyLink = `${this.frontendUrl}/verify-email?token=${token}`
    const html = renderTemplate('emailVerification', { verifyLink })
    return this.sendEmail({ to, subject: 'Verify Your Email', html })
  }

  async sendMonthlyReport(
    to: string,
    data: {
      monthOf: string
      totalContributed: string
      totalReceived: string
      groupsJoined: number
      groupsCompleted: number
      contributionCount: number
      groups: Array<{ name: string; contributions: number; balance: string; status: string }>
    }
  ): Promise<boolean> {
    const html = renderTemplate('monthlyReport', {
      monthOf: data.monthOf,
      totalContributed: data.totalContributed,
      totalReceived: data.totalReceived,
      groupsJoined: data.groupsJoined,
      groupsCompleted: data.groupsCompleted,
      contributionCount: data.contributionCount,
      groupRows: buildGroupRows(data.groups),
      dashboardUrl: `${this.frontendUrl}/dashboard`,
      unsubscribeUrl: this.unsubscribeBase,
    })
    return this.sendEmail({ to, subject: `Your Monthly Ajo Report — ${data.monthOf}`, html })
  }
}

export const emailService = new EmailService()
