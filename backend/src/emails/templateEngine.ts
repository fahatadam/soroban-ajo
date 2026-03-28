/**
 * Email template engine
 * Issue #378: MJML-based email template system
 *
 * Compiles MJML templates to responsive HTML and injects
 * typed variables using a simple {{variable}} syntax.
 */
import mjml2html from 'mjml'
import fs from 'fs'
import path from 'path'
import { createModuleLogger } from '../utils/logger'

const logger = createModuleLogger('EmailTemplateEngine')

const TEMPLATES_DIR = path.join(__dirname)

// ── Template variable types ────────────────────────────────────────────────

export interface WelcomeVars {
  name: string
  dashboardUrl: string
  unsubscribeUrl: string
}

export interface ContributionReminderVars {
  groupName: string
  amount: string
  dueDate: string
  cycleNumber: string | number
  groupUrl: string
  unsubscribeUrl: string
}

export interface PayoutNotificationVars {
  groupName: string
  amount: string
  cycleNumber: string | number
  date: string
  txHash: string
  txUrl: string
  unsubscribeUrl: string
}

export interface GroupInvitationVars {
  groupName: string
  inviterName: string
  contributionAmount: string
  cycleDuration: string
  currentMembers: string | number
  maxMembers: string | number
  inviteLink: string
  unsubscribeUrl: string
}

export interface TransactionReceiptVars {
  groupName: string
  amount: string
  cycleNumber: string | number
  date: string
  txHash: string
  txUrl: string
  unsubscribeUrl: string
}

export interface WeeklySummaryVars {
  weekOf: string
  activeGroups: string | number
  totalSaved: string
  contributionCount: string | number
  /** Pre-rendered HTML rows for each group */
  groupRows: string
  dashboardUrl: string
  unsubscribeUrl: string
}

export interface EmailVerificationVars {
  verifyLink: string
}

export interface MonthlyReportVars {
  monthOf: string
  totalContributed: string
  totalReceived: string
  groupsJoined: string | number
  groupsCompleted: string | number
  contributionCount: string | number
  /** Pre-rendered HTML rows for each group */
  groupRows: string
  dashboardUrl: string
  unsubscribeUrl: string
}

export type TemplateVars =
  | WelcomeVars
  | ContributionReminderVars
  | PayoutNotificationVars
  | GroupInvitationVars
  | TransactionReceiptVars
  | WeeklySummaryVars
  | EmailVerificationVars
  | MonthlyReportVars

// ── Template names ─────────────────────────────────────────────────────────

export type TemplateName =
  | 'welcome'
  | 'contributionReminder'
  | 'payoutNotification'
  | 'groupInvitation'
  | 'transactionReceipt'
  | 'weeklySummary'
  | 'emailVerification'
  | 'monthlyReport'

const TEMPLATE_FILES: Record<TemplateName, string> = {
  welcome: 'welcome.mjml',
  contributionReminder: 'contributionReminder.mjml',
  payoutNotification: 'payoutNotification.mjml',
  groupInvitation: 'groupInvitation.mjml',
  transactionReceipt: 'transactionReceipt.mjml',
  weeklySummary: 'weeklySummary.mjml',
  emailVerification: 'emailVerification.mjml',
  monthlyReport: 'monthlyReport.mjml',
}

// In-memory cache of compiled HTML (keyed by template name)
const compiledCache = new Map<TemplateName, string>()

// ── Core functions ─────────────────────────────────────────────────────────

/**
 * Read and compile an MJML template to HTML.
 * Results are cached in memory after the first compile.
 */
function compileTemplate(name: TemplateName): string {
  if (compiledCache.has(name)) {
    return compiledCache.get(name)!
  }

  const filePath = path.join(TEMPLATES_DIR, TEMPLATE_FILES[name])

  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template not found: ${filePath}`)
  }

  const mjmlSource = fs.readFileSync(filePath, 'utf-8')

  const { html, errors } = mjml2html(mjmlSource, {
    validationLevel: 'soft',
    filePath,
  })

  if (errors.length > 0) {
    logger.warn(`MJML warnings in template "${name}"`, { errors })
  }

  compiledCache.set(name, html)
  return html
}

/**
 * Inject variables into a compiled HTML template.
 * Replaces all {{variableName}} placeholders with their values.
 * Unknown placeholders are left as-is.
 */
function injectVars(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in vars ? vars[key] : match
  })
}

/**
 * Render a named template with the provided variables.
 * Returns the final HTML string ready to send.
 */
export function renderTemplate(name: TemplateName, vars: TemplateVars): string {
  const html = compileTemplate(name)
  return injectVars(html, vars as unknown as Record<string, string>)
}

/**
 * Generate a plain-text fallback by stripping HTML tags.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Clear the compiled template cache (useful in tests or after template edits).
 */
export function clearTemplateCache(): void {
  compiledCache.clear()
}

// ── Convenience helpers ────────────────────────────────────────────────────

/** Build the weekly summary group rows HTML snippet */
export function buildGroupRows(
  groups: Array<{ name: string; contributions: number; balance: string; status: string }>
): string {
  if (groups.length === 0) {
    return '<p style="color:#94a3b8;font-size:14px;">No group activity this week.</p>'
  }

  return groups
    .map(
      (g) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;background:#f8fafc;">
          <strong style="color:#0f172a;font-size:14px;">${escapeHtml(g.name)}</strong>
          <span style="float:right;font-size:12px;color:${g.status === 'active' ? '#10b981' : '#f59e0b'};font-weight:600;text-transform:uppercase;">${escapeHtml(g.status)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;background:#ffffff;">
          <span style="color:#64748b;font-size:13px;">Contributions: </span>
          <strong style="color:#1e293b;font-size:13px;">${g.contributions}</strong>
          &nbsp;&nbsp;
          <span style="color:#64748b;font-size:13px;">Balance: </span>
          <strong style="color:#1e293b;font-size:13px;">${escapeHtml(g.balance)}</strong>
        </td>
      </tr>
    </table>`
    )
    .join('')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
