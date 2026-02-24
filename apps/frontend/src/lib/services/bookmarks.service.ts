import type { NihOpportunity } from './nih.service';

export interface BookmarkedOpp {
  id: string;           // opportunityId
  opportunityNumber: string;
  title: string;
  agency: string;
  closeDate: string | null;
  awardCeiling: number | null;
  estimatedTotalProgramFunding: number | null;
  url: string | null;
  savedAt: number;
}

const BOOKMARKS_KEY = 'grantmaster:bookmarks';

function load(): BookmarkedOpp[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function persist(items: BookmarkedOpp[]) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('grantmaster:bookmarks-changed'));
  } catch { /* quota exceeded */ }
}

class BookmarksService {
  getAll(): BookmarkedOpp[] {
    return load();
  }

  isBookmarked(opportunityId: string): boolean {
    return load().some((b) => b.id === opportunityId);
  }

  add(opp: NihOpportunity): BookmarkedOpp[] {
    const existing = load().filter((b) => b.id !== opp.opportunityId);
    const item: BookmarkedOpp = {
      id: opp.opportunityId,
      opportunityNumber: opp.opportunityNumber,
      title: opp.title,
      agency: opp.agency,
      closeDate: opp.closeDate,
      awardCeiling: opp.awardCeiling ?? null,
      estimatedTotalProgramFunding: opp.estimatedTotalProgramFunding ?? null,
      url: opp.url,
      savedAt: Date.now(),
    };
    const updated = [item, ...existing];
    persist(updated);
    return updated;
  }

  remove(opportunityId: string): BookmarkedOpp[] {
    const updated = load().filter((b) => b.id !== opportunityId);
    persist(updated);
    return updated;
  }
}

export const bookmarksService = new BookmarksService();
