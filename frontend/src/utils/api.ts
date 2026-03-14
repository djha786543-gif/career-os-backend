import axios from 'axios';

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://career-os-portal-production.up.railway.app').replace(/\/$/, '');
const BASE = API_BASE;

// ── Job Hub ───────────────────────────────────────────────────────────────────
export interface FrontendJob {
  id:         string;
  title:      string;
  company:    string;
  location:   string;
  salary:     string;
  snippet:    string;
  applyUrl:   string;
  fitScore:   number;
  workMode:   string;
  isRemote:   boolean;
  source:     string;
  postedDate: string;
  keySkills:  string[];
  fitReason:  string;
  category?:  string;
  region:     string;
}

export interface JobsResponse {
  status:       string;
  candidate:    string;
  candidateId:  string;
  track:        string | null;
  regions:      string[];
  totalResults: number;
  source:       string;
  jobs:         FrontendJob[];
}

export async function fetchJobs(
  profileId: 'dj' | 'pj',
  track?: string,
  regions?: string[],
): Promise<JobsResponse> {
  const params: Record<string, string> = { profile: profileId };
  if (track)   params.track  = track;
  if (regions) params.region = regions.join(',');
  const { data } = await axios.get<JobsResponse>(`${BASE}/api/jobs`, { params });
  return data;
}

export async function refreshJobs(profileId: 'dj' | 'pj', track?: string): Promise<void> {
  const candidateId = profileId === 'dj' ? 'deobrat' : 'pooja';
  await axios.post(`${BASE}/api/jobs/refresh`, { candidate: candidateId, track });
}

// ── Kanban / Tracker ──────────────────────────────────────────────────────────
export interface KanbanCard {
  id?:         string;
  profile_id:  'dj' | 'pooja';
  job_id?:     string;
  title:       string;
  company:     string;
  apply_url?:  string;
  match_score?:number;
  stage:       'wishlist' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected' | 'archived';
  notes?:      string;
  next_action?:string;
  deadline?:   string;
  created_at?: string;
  updated_at?: string;
}

export async function saveToTracker(card: Omit<KanbanCard, 'id' | 'created_at' | 'updated_at'>): Promise<KanbanCard> {
  const { data } = await axios.post<KanbanCard>(`${BASE}/api/kanban`, card);
  return data;
}

export async function fetchKanbanCards(profileId: 'dj' | 'pj'): Promise<KanbanCard[]> {
  const dbProfileId = profileId === 'dj' ? 'dj' : 'pooja';
  const { data } = await axios.get<KanbanCard[]>(`${BASE}/api/kanban`, {
    params: { profile_id: dbProfileId },
  });
  return data;
}

export async function updateKanbanCard(
  id: string,
  patch: Partial<KanbanCard>,
): Promise<KanbanCard> {
  const { data } = await axios.patch<KanbanCard>(`${BASE}/api/kanban/${id}`, patch);
  return data;
}

export async function deleteKanbanCard(id: string): Promise<void> {
  await axios.delete(`${BASE}/api/kanban/${id}`);
}
