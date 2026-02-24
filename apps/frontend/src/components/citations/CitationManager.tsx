'use client';

import { useState, useEffect } from 'react';
import { citationsService, Citation } from '@/lib/services/citations.service';

interface CitationManagerProps {
  applicationId: string;
}

export default function CitationManager({ applicationId }: CitationManagerProps) {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBibliography, setShowBibliography] = useState(false);
  const [bibliographyFormat, setBibliographyFormat] = useState<'nih' | 'apa' | 'mla' | 'chicago'>('nih');
  const [bibliography, setBibliography] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New citation form state
  const [newCitation, setNewCitation] = useState({
    doi: '',
    pmid: '',
    inputMode: 'doi' as 'doi' | 'pmid' | 'manual',
  });

  useEffect(() => {
    loadCitations();
  }, [applicationId]);

  const loadCitations = async () => {
    try {
      setLoading(true);
      const data = await citationsService.getCitations(applicationId);
      setCitations(data);
    } catch (error) {
      console.error('Failed to load citations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCitation = async () => {
    try {
      if (newCitation.inputMode === 'doi' && newCitation.doi) {
        await citationsService.createCitation({
          applicationId,
          doi: newCitation.doi,
        });
      } else if (newCitation.inputMode === 'pmid' && newCitation.pmid) {
        await citationsService.createCitation({
          applicationId,
          pmid: newCitation.pmid,
        });
      }

      // Reset form and reload
      setNewCitation({ doi: '', pmid: '', inputMode: 'doi' });
      setShowAddModal(false);
      await loadCitations();
    } catch (error) {
      console.error('Failed to add citation:', error);
      alert('Failed to add citation. Please check the DOI/PMID and try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this citation?')) return;

    try {
      await citationsService.deleteCitation(id);
      await loadCitations();
    } catch (error) {
      console.error('Failed to delete citation:', error);
      alert('Failed to delete citation.');
    }
  };

  const handleGenerateBibliography = async () => {
    try {
      const result = await citationsService.generateBibliography(applicationId, bibliographyFormat);
      setBibliography(result.bibliography);
      setShowBibliography(true);
    } catch (error) {
      console.error('Failed to generate bibliography:', error);
      alert('Failed to generate bibliography.');
    }
  };

  const handleCopyBibliography = () => {
    navigator.clipboard.writeText(bibliography);
    alert('Bibliography copied to clipboard!');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCitations();
      return;
    }

    try {
      const results = await citationsService.searchCitations(applicationId, searchQuery);
      setCitations(results);
    } catch (error) {
      console.error('Failed to search citations:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading citations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Citations</h2>
          <p className="text-sm text-gray-500 mt-1">{citations.length} citations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark transition-colors"
          >
            + Add Citation
          </button>
          <button
            onClick={handleGenerateBibliography}
            disabled={citations.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
          >
            Generate Bibliography
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search citations by title, author, or journal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gm-cyan focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              loadCitations();
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Citations List */}
      <div className="space-y-4">
        {citations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No citations yet. Add your first citation to get started!</p>
          </div>
        ) : (
          citations.map((citation) => (
            <div
              key={citation.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{citation.title}</h3>

                  {/* Authors */}
                  <p className="text-sm text-gray-600 mb-2">
                    {citation.authors.map((a) => `${a.firstName} ${a.lastName}`).join(', ')}
                  </p>

                  {/* Journal & Year */}
                  <p className="text-sm text-gray-500 mb-3">
                    {citation.journal && <span className="italic">{citation.journal}</span>}
                    {citation.year && <span> ({citation.year})</span>}
                    {citation.volume && <span> {citation.volume}</span>}
                    {citation.issue && <span>({citation.issue})</span>}
                    {citation.pages && <span>: {citation.pages}</span>}
                  </p>

                  {/* Identifiers */}
                  <div className="flex gap-3 text-xs text-gray-500">
                    {citation.doi && (
                      <a
                        href={`https://doi.org/${citation.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gm-navy"
                      >
                        DOI: {citation.doi}
                      </a>
                    )}
                    {citation.pmid && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gm-navy"
                      >
                        PMID: {citation.pmid}
                      </a>
                    )}
                  </div>

                  {/* Formatted Citation (NIH style) */}
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700 font-mono">
                    {citation.formatted.nih}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleDelete(citation.id)}
                  className="ml-4 text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Citation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Citation</h3>

            {/* Input Mode Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setNewCitation({ ...newCitation, inputMode: 'doi' })}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  newCitation.inputMode === 'doi'
                    ? 'bg-gm-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                DOI
              </button>
              <button
                onClick={() => setNewCitation({ ...newCitation, inputMode: 'pmid' })}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  newCitation.inputMode === 'pmid'
                    ? 'bg-gm-navy text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                PMID
              </button>
            </div>

            {/* Input Fields */}
            {newCitation.inputMode === 'doi' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DOI (e.g., 10.1234/example or https://doi.org/10.1234/example)
                </label>
                <input
                  type="text"
                  value={newCitation.doi}
                  onChange={(e) => setNewCitation({ ...newCitation, doi: e.target.value })}
                  placeholder="10.1234/example"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gm-cyan focus:border-transparent"
                />
              </div>
            )}

            {newCitation.inputMode === 'pmid' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PubMed ID (e.g., 12345678)
                </label>
                <input
                  type="text"
                  value={newCitation.pmid}
                  onChange={(e) => setNewCitation({ ...newCitation, pmid: e.target.value })}
                  placeholder="12345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gm-cyan focus:border-transparent"
                />
              </div>
            )}

            <div className="bg-gm-cyan-soft border border-gm-cyan-soft rounded-lg p-4 mb-4">
              <p className="text-sm text-gm-navy-dark">
                Enter a DOI or PMID, and we'll automatically fetch the citation details from Crossref or PubMed.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCitation({ doi: '', pmid: '', inputMode: 'doi' });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCitation}
                disabled={
                  (newCitation.inputMode === 'doi' && !newCitation.doi) ||
                  (newCitation.inputMode === 'pmid' && !newCitation.pmid)
                }
                className="px-4 py-2 bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark transition-colors disabled:bg-gray-300"
              >
                Add Citation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bibliography Modal */}
      {showBibliography && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bibliography</h3>

              {/* Format Selector */}
              <div className="flex gap-2">
                {(['nih', 'apa', 'mla', 'chicago'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => {
                      setBibliographyFormat(format);
                      handleGenerateBibliography();
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      bibliographyFormat === format
                        ? 'bg-gm-navy text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900">
                {bibliography}
              </pre>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowBibliography(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCopyBibliography}
                className="px-4 py-2 bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
