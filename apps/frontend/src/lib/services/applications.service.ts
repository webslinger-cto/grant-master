import { api } from '../api';

export interface Application {
  id: string;
  internal_name: string;
  amount_requested: number;
  current_stage: string;
  probability: number;
  submission_deadline: string;
  internal_deadline?: string;
  opportunity_id?: string;
  opportunity_title?: string;
  opportunity_description?: string;
  outcome_notes?: string;
  metadata?: Record<string, any>;
}

const MOCK_APPLICATIONS: Application[] = [
  {
    id: '70000001-0000-0000-0000-000000000001',
    internal_name: 'NIH R01 — Intraoperative AR Imaging 2026',
    amount_requested: 450000,
    current_stage: 'drafting',
    probability: 35,
    submission_deadline: '2026-06-15',
    opportunity_title: 'PA-25-303 Research Project Grant',
    outcome_notes: 'Focusing claims on real-time MRI overlay during neurosurgery. Reviewer feedback from pre-submission inquiry was positive.',
  },
  {
    id: '70000001-0000-0000-0000-000000000002',
    internal_name: 'NCI R01 — Tumor Margin Detection via HUD',
    amount_requested: 500000,
    current_stage: 'drafting',
    probability: 28,
    submission_deadline: '2026-07-05',
    opportunity_title: 'PAR-25-043 Cancer Research',
    outcome_notes: "Targeting NCI's imaging & informatics portfolio. Partnering with Johns Hopkins surgical oncology.",
  },
  {
    id: '70000001-0000-0000-0000-000000000003',
    internal_name: 'DoD USAMRAA — Tactical Surgical AR 2026',
    amount_requested: 750000,
    current_stage: 'review',
    probability: 45,
    submission_deadline: '2026-04-30',
    opportunity_title: 'HT9425-23-S-SOC1 DoD BAA',
    outcome_notes: 'Strong fit for battlefield surgery triage use case. Collaborating with Walter Reed surgical team.',
  },
  {
    id: '70000001-0000-0000-0000-000000000004',
    internal_name: 'NSF STTR — Real-time MRI Overlay Platform',
    amount_requested: 300000,
    current_stage: 'review',
    probability: 40,
    submission_deadline: '2026-05-15',
    opportunity_title: 'NSF 24-566 STTR Phase I',
    outcome_notes: 'Phase I proof-of-concept for operating room integration. University partner: Stanford Radiological Sciences.',
  },
  {
    id: '70000001-0000-0000-0000-000000000005',
    internal_name: 'NIH SBIR — Wireless HUD for Minimally Invasive Surgery',
    amount_requested: 250000,
    current_stage: 'planning',
    probability: 30,
    submission_deadline: '2026-09-01',
    opportunity_title: 'NIH SBIR Phase I',
    outcome_notes: 'Scoping laparoscopic use case. Need to finalize power consumption benchmarks before writing specific aims.',
  },
  {
    id: '70000001-0000-0000-0000-000000000006',
    internal_name: 'NIH K99 — AR Navigation Systems Research',
    amount_requested: 180000,
    current_stage: 'planning',
    probability: 22,
    submission_deadline: '2026-08-12',
    opportunity_title: 'K99/R00 Pathway to Independence',
    outcome_notes: 'Mentorship from Dr. Patel (Mayo Clinic). Career dev plan drafted; awaiting institutional sign-off.',
  },
  {
    id: '70000001-0000-0000-0000-000000000007',
    internal_name: 'DARPA — Mixed Reality Surgical Systems',
    amount_requested: 1200000,
    current_stage: 'qualification',
    probability: 15,
    submission_deadline: '2026-10-01',
    opportunity_title: 'DARPA BAA — Biological Technologies Office',
    outcome_notes: 'High ceiling but very competitive. Evaluating feasibility of submission given current team size.',
  },
  {
    id: '70000001-0000-0000-0000-000000000008',
    internal_name: 'NIH R21 — Pilot Study: AR-Guided Spinal Surgery',
    amount_requested: 275000,
    current_stage: 'submitted',
    probability: 55,
    submission_deadline: '2025-12-01',
    opportunity_title: 'PAR-24-123 Exploratory Grant',
    outcome_notes: 'Submitted Dec 2025. Study section review scheduled Feb 2026. Score pending.',
  },
];

class ApplicationsService {
  async getAll(): Promise<Application[]> {
    try {
      const res = await api.get<any>('/pipeline/applications');
      const data: Application[] = res?.data ?? res ?? [];
      return data.length ? data : MOCK_APPLICATIONS;
    } catch {
      return MOCK_APPLICATIONS;
    }
  }

  async getById(id: string): Promise<Application> {
    try {
      const res = await api.get<any>(`/pipeline/applications/${id}`);
      return res?.data ?? res;
    } catch {
      return MOCK_APPLICATIONS.find((a) => a.id === id) ?? MOCK_APPLICATIONS[0];
    }
  }

  async create(data: {
    internal_name: string;
    amount_requested?: number;
    submission_deadline?: string | null;
    current_stage?: string;
    probability?: number;
    outcome_notes?: string | null;
  }): Promise<Application> {
    const res = await api.post<any>('/pipeline/applications', data);
    const created: Application = res?.data ?? res;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('grantmaster:pipeline-changed'));
    }
    return created;
  }

  async update(id: string, data: Partial<Application>): Promise<Application> {
    try {
      const res = await api.put<any>(`/pipeline/applications/${id}`, data);
      return res?.data ?? res;
    } catch {
      // Return optimistic update
      const existing = MOCK_APPLICATIONS.find((a) => a.id === id);
      return { ...existing!, ...data };
    }
  }
}

export const applicationsService = new ApplicationsService();
