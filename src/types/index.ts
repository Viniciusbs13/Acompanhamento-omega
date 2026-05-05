/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BusinessType = 'SERVICE_BOOKING' | 'ECOMMERCE' | 'B2B_LEADS' | 'WHATSAPP' | 'REAL_ESTATE' | 'INFO_PRODUCTS' | 'LOCAL_BUSINESS' | 'VIDEO_PRODUCTION' | 'CONTENT_EDITING' | 'LAUNCH';

export type BillingModel = 'RECURRING' | 'ONE_OFF';

export type StatusHealth = 'GOOD' | 'WARNING' | 'CRITICAL';

export type ManagementFlag = 'GREEN' | 'YELLOW' | 'RED';

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

export interface FunnelStep {
  id: string;
  label: string;
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
  customFunnelSteps?: FunnelStep[];
  // Management fields
  ownerNames?: string;
  planValue?: number;
  planScope?: string;
  contractUrl?: string;
  managementStatus?: ManagementFlag;
  billingModel?: BillingModel;
  performanceMode?: 'LEADS' | 'SALES';
  strategyUrl?: string;
  contentPlan?: {
    total: number;
    items: {
      id: string;
      targetDate: string;
      status: 'PLANNED' | 'POSTED';
    }[];
  };
  captures?: {
    id: string;
    date: string;
    title: string;
    status: 'PLANNED' | 'DONE';
  }[];
}

export interface MetricEntry {
  id: string;
  clientId: string;
  date: string; // ISO String (start or exact day)
  endDate?: string; // For date ranges
  
  // Input fields (common)
  investment: number;
  revenue?: number;
  profit?: number;
  leads?: number;
  sales?: number;
  clicks?: number;
  cpm?: number;
  
  // Specific to SERVICE_BOOKING
  bookings?: number;
  shows?: number;
  cac?: number;

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
  // Specific to creative types
  delivered?: number;
  projects?: number;
  raw?: number;
  customData?: Record<string, number>;
}

export interface CalculatedMetrics {
  roas: number;
  cac: number;
  ticket: number;
  conversion: number;
  profit?: number;
  roi?: number;
  delivered?: number;
  projects?: number;
  leads?: number;
  sales?: number;
  // Specifics
  cpl?: number;
  cpc?: number;
  cpm?: number;
  clicks?: number;
  ctr?: number;
  bookingRate?: number;
  showRate?: number;
  closeRate?: number;
  mqlRate?: number;
  waResponseRate?: number;
  abandonRate?: number;
  customRates?: Record<string, number>;
}

export interface UserSettings {
  managerName: string;
  theme: 'light' | 'dark';
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  service: string;
  value: number;
  date: string; // ISO Date
  status: 'PAID' | 'PENDING';
  origin: string; // Instagram, Indication, etc.
  billingModel?: BillingModel;
  ownerId?: string;
}

export interface CommercialGoal {
  id: string; // e.g. "2026-05"
  month: number;
  year: number;
  target: number;
  ownerId?: string;
}

export interface CommercialMetrics {
  totalRevenue: number;
  target: number;
  salesCount: number;
  averageTicket: number;
  monthYear: string; // "MM/YYYY"
}
