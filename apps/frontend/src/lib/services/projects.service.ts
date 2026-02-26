import { api } from '../api';
import type { IntakeData } from '@/components/chat/IntakeFlow';
import type { Application } from './applications.service';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  context?: Partial<IntakeData> | null;
  parent_project_id?: string | null;
  parent_project_name?: string | null;
  grant_count?: number;
  status: string;
  grants?: Application[];
  created_at: string;
  updated_at: string;
}

class ProjectsService {
  async getAll(): Promise<Project[]> {
    try {
      const res = await api.get<any>('/projects');
      return res?.data ?? res ?? [];
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<Project> {
    const res = await api.get<any>(`/projects/${id}`);
    return res?.data ?? res;
  }

  async create(data: { name: string; description?: string; context?: Partial<IntakeData> }): Promise<Project> {
    const res = await api.post<any>('/projects', data);
    return res?.data ?? res;
  }

  async update(id: string, data: { name?: string; description?: string; context?: Partial<IntakeData> }): Promise<Project> {
    const res = await api.put<any>(`/projects/${id}`, data);
    return res?.data ?? res;
  }

  async clone(id: string, data: { name: string; context?: Partial<IntakeData> }): Promise<Project> {
    const res = await api.post<any>(`/projects/${id}/clone`, data);
    return res?.data ?? res;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  }
}

export const projectsService = new ProjectsService();
