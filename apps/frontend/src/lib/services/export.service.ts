import { api } from '../api';

export interface ExportToDocsResult {
  docUrl: string;
  docId: string;
  title: string;
  sharedWith: number;
  sectionCount: number;
}

export const exportService = {
  async getDriveStatus(): Promise<{ connected: boolean }> {
    const body = await api.get<any>('/export/drive-status');
    return body?.data ?? body;
  },

  async exportToGoogleDocs(
    applicationId: string,
    shareEmails: string[],
    emailMessage?: string,
  ): Promise<ExportToDocsResult> {
    const body = await api.post<any>('/export/google-docs', {
      applicationId,
      shareEmails,
      emailMessage,
    });
    return body?.data ?? body;
  },
};
