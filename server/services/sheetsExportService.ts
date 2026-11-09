import { Lead } from '../../src/types/index.js';

export const SHEETS_COLUMNS = [
  'Lead ID',
  'Date',
  'Campaign Name',
  'Business Name',
  'Country',
  'City',
  'Business Niche',
  'Website',
  'Email',
  'Phone',
  'Website Problems',
  'Branding Problems',
  'Marketing Opportunity',
  'Recommended Service',
  'Lead Score',
  'Priority',
  'Outreach Subject',
  'Outreach Message',
  'Lead Status',
  'Interested Status',
  'Deal Status',
  'Deal Value',
  'Follow-up Date',
  'Notes',
  'Research Source',
] as const;

export function formatLeadRow(lead: Lead): string[] {
  const interestedStatus = ['Interested', 'Negotiation', 'Deal Won'].includes(lead.status) ? 'Yes' : 'No';
  const dealStatus = lead.status === 'Deal Won' ? 'Won' : lead.status === 'Deal Lost' ? 'Lost' : lead.dealValue ? 'Active' : 'Unspecified';

  return [
    lead.id,
    lead.createdAt ? lead.createdAt.split('T')[0] : '',
    lead.campaignName || '',
    lead.businessName || '',
    lead.country || '',
    lead.city || '',
    lead.businessCategory || '',
    lead.website || 'Not Available',
    lead.email || 'Not Available',
    lead.phone || 'Not Available',
    (lead.identifiedProblems || []).join('; '),
    lead.brandingAssessment || '',
    lead.marketingOpportunity || '',
    lead.recommendedService || '',
    lead.leadScore?.toString() || '0',
    lead.priority || 'Medium',
    lead.outreach?.emailSubject || '',
    lead.outreach?.emailBody ? lead.outreach.emailBody.replace(/\r?\n/g, ' ') : '',
    lead.status || 'New',
    interestedStatus,
    dealStatus,
    lead.dealValue ? `$${lead.dealValue}` : '$0',
    lead.followUpDate || '',
    lead.notes ? lead.notes.replace(/\r?\n/g, ' ') : '',
    lead.researchSource || '',
  ];
}

export function generateCsv(leads: Lead[]): string {
  const escapeCsv = (val: string) => {
    const stringified = String(val ?? '');
    if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  const headerRow = SHEETS_COLUMNS.map(escapeCsv).join(',');
  const rows = leads.map((lead) => formatLeadRow(lead).map(escapeCsv).join(','));

  return [headerRow, ...rows].join('\n');
}

export interface SheetsSyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
  spreadsheetUrl?: string;
}

export async function syncToGoogleSheets(
  leads: Lead[],
  config: { spreadsheetId?: string; webhookUrl?: string }
): Promise<SheetsSyncResult> {
  // If the user configured an Apps Script / Webhook URL or Google Sheets API
  if (config.webhookUrl) {
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: SHEETS_COLUMNS,
          rows: leads.map(formatLeadRow),
          syncedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Sheets Webhook returned HTTP ${response.status}`);
      }

      return {
        success: true,
        syncedCount: leads.length,
        message: `Successfully synchronized ${leads.length} leads to Google Sheets via Webhook.`,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        message: `Google Sheets sync error: ${err.message || 'Failed to reach webhook URL'}`,
      };
    }
  }

  // If no automated remote credentials, report clear status and offer CSV export
  return {
    success: false,
    syncedCount: 0,
    message:
      'Google Sheets direct API / Webhook not yet connected. You can export directly as CSV with all 25 standard columns or configure your Google Sheets webhook in Settings.',
  };
}
