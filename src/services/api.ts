import {
  Lead,
  Campaign,
  DashboardStats,
  ActivityLog,
  UserProfile,
  CampaignReport,
  GoogleSheetsConfig,
} from '../types/index.js';

const API_BASE = '/api';

export const api = {
  // Auth
  async getMe(): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getActivities(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE}/dashboard/activities`);
    if (!res.ok) throw new Error('Failed to fetch activities');
    return res.json();
  },

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    const res = await fetch(`${API_BASE}/campaigns`);
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  },

  async getCampaign(id: string): Promise<Campaign> {
    const res = await fetch(`${API_BASE}/campaigns/${id}`);
    if (!res.ok) throw new Error('Failed to fetch campaign');
    return res.json();
  },

  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    const res = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create campaign');
    }
    return res.json();
  },

  async runCampaign(id: string): Promise<{ success: boolean; campaign: Campaign; leads: Lead[]; report?: CampaignReport; message?: string }> {
    const res = await fetch(`${API_BASE}/campaigns/${id}/run`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute campaign');
    }
    return res.json();
  },

  async deleteCampaign(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete campaign');
    return res.json();
  },

  async getCampaignReport(id: string): Promise<CampaignReport> {
    const res = await fetch(`${API_BASE}/campaigns/${id}/report`);
    if (!res.ok) throw new Error('Failed to fetch campaign report');
    return res.json();
  },

  // Leads
  async getLeads(filters?: {
    campaignId?: string;
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Lead[]> {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val) query.set(key, val);
      });
    }
    const res = await fetch(`${API_BASE}/leads?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },

  async getLead(id: string): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}`);
    if (!res.ok) throw new Error('Failed to fetch lead');
    return res.json();
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update lead');
    return res.json();
  },

  async deleteLead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete lead');
    return res.json();
  },

  async bulkDeleteLeads(leadIds: string[]): Promise<{ success: boolean; deletedCount: number }> {
    const res = await fetch(`${API_BASE}/leads/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds }),
    });
    if (!res.ok) throw new Error('Failed to bulk delete leads');
    return res.json();
  },

  async generateOutreach(id: string, customInstructions?: string): Promise<{ success: boolean; lead: Lead }> {
    const res = await fetch(`${API_BASE}/leads/${id}/generate-outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customInstructions }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate outreach');
    }
    return res.json();
  },

  async reResearchLead(id: string): Promise<{ success: boolean; lead: Lead }> {
    const res = await fetch(`${API_BASE}/leads/${id}/research`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to re-audit lead');
    }
    return res.json();
  },

  async exportCsv(leadIds?: string[]): Promise<void> {
    const res = await fetch(`${API_BASE}/leads/export-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds }),
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadpilot_leads_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Sheets & Settings
  async getSheetsConfig(): Promise<GoogleSheetsConfig> {
    const res = await fetch(`${API_BASE}/sheets/config`);
    if (!res.ok) throw new Error('Failed to fetch sheets config');
    return res.json();
  },

  async updateSheetsConfig(config: Partial<GoogleSheetsConfig>): Promise<GoogleSheetsConfig> {
    const res = await fetch(`${API_BASE}/sheets/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to save sheets config');
    return res.json();
  },

  async syncSheets(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/sheets/sync`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to sync sheets');
    return res.json();
  },
};
