/**
 * Sections Service - API calls for generated sections
 */

import { api } from '../api';
import { GeneratedSection, SectionTemplate } from './chat.service';

export interface UpdateSectionData {
  content?: string;
  status?: 'draft' | 'under_review' | 'approved' | 'rejected';
  reviewNotes?: string;
}

class SectionsService {
  /**
   * Get all generated sections for an application
   */
  async getByApplicationId(applicationId: string): Promise<GeneratedSection[]> {
    const response = await api.get<any>(`/generated-sections?applicationId=${applicationId}`);
    return response.data;
  }

  /**
   * Get a specific section by ID
   */
  async getById(id: string): Promise<GeneratedSection> {
    const response = await api.get<any>(`/generated-sections/${id}`);
    return response.data;
  }

  /**
   * Get version history for a section
   */
  async getVersionHistory(applicationId: string, sectionName: string): Promise<GeneratedSection[]> {
    const response = await api.get<any>(`/generated-sections/${applicationId}/history/${sectionName}`);
    return response.data;
  }

  /**
   * Update a section
   */
  async update(id: string, data: UpdateSectionData): Promise<GeneratedSection> {
    const response = await api.put<any>(`/generated-sections/${id}`, data);
    return response.data;
  }

  /**
   * Delete a section
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/generated-sections/${id}`);
  }

  /**
   * Set a specific version as current
   */
  async setCurrentVersion(id: string): Promise<GeneratedSection> {
    const response = await api.put<any>(`/generated-sections/${id}/set-current`, {});
    return response.data;
  }

  /**
   * Get available templates
   */
  async getTemplates(grantType: string = 'NIH_R01'): Promise<SectionTemplate[]> {
    const response = await api.get<any>(`/generated-sections/meta/templates?grantType=${grantType}`);
    return response.data;
  }

  /**
   * Export all sections as document
   */
  async exportApplication(applicationId: string): Promise<string> {
    const response = await api.get<any>(`/generated-sections/${applicationId}/export`);
    return response.data.document;
  }
}

export const sectionsService = new SectionsService();
