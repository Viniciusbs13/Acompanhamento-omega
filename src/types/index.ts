/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BusinessType = 'SERVICE_BOOKING' | 'ECOMMERCE' | 'B2B_LEADS' | 'WHATSAPP';

export type StatusHealth = 'GOOD' | 'WARNING' | 'CRITICAL';

export interface SmartGoal {
  currentRevenue: number;
  targetRevenue: number;
  durationMonths: number;
  adSpend: number;
  funnelSteps: {
    name: string;
    rate: number;
  }[];
  ticket: number;
}

export interface Client {
  id: string;
  name: string;
  accountManager?: string;
  logo?: string;
  brandColor: string;
  businessType: BusinessType;
  smartGoal: SmartGoal;
  channels: string[];
  createdAt: string;
}

export interface MetricEntry {
  id: string;
  clientId: string;
  date: string; // ISO String (usually first day of month)
  
  // Input fields (common)
  investment: number;
  
  // Specific to SERVICE_BOOKING
  leads?: number;
  bookings?: number;
  shows?: number;
  sales?: number;
  revenue?: number;
  profit?: number; // New field
  cac?: number;    // New field for direct input if needed

  // Specific to ECOMMERCE
  sessions?: number;
  addCart?: number;
  checkouts?: number;
  purchases?: number;

  // Specific to B2B_LEADS
  mqls?: number;
  meetings?: number;
  proposals?: number;

  // Specific to WHATSAPP
  waClicks?: number;
  waConversations?: number;
  qualifiedLeads?: number;
}

export interface CalculatedMetrics {
  roas: number;
  cac: number;
  ticket: number;
  conversion: number;
  profit?: number;
  roi?: number;
  // Specifics
  cpl?: number;
  cpc?: number;
  bookingRate?: number;
  showRate?: number;
  closeRate?: number;
  mqlRate?: number;
  waResponseRate?: number;
  abandonRate?: number;
}

export interface UserSettings {
  managerName: string;
  theme: 'light' | 'dark';
}
