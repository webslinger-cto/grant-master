'use client';

import React, { useEffect, useState } from 'react';

// Tooltip Component
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
    setShow(true);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
        className="cursor-help inline-block"
      >
        {children}
      </div>
      {show && (
        <div
          className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg w-64 pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {text}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{ marginTop: '-4px' }}
          >
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </>
  );
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  min_award_amount: number | null;
  max_award_amount: number | null;
  status: string;
  metadata: {
    maturity_needed?: string;
    key_requirements?: string;
    filing_effort?: string;
    timeline?: string;
    post_award_obligations?: string;
    financing_against_award?: string;
    current_status?: string;
    next_action?: string;
    owner?: string;
    additional_info?: string;
  };
}

interface Application {
  id: string;
  internal_name: string;
  amount_requested: number;
  current_stage: string;
  probability: number;
  submission_deadline: string;
}

type ViewMode = 'opportunities' | 'applications';

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('opportunities');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Mock opportunities from your Excel import
      const mockOpportunities: Opportunity[] = [
        {
          id: '1',
          title: 'NIH SBIR/STTR',
          description: 'AI clinical tools, AR surgery overlays, telemedicine workflows, wearables',
          min_award_amount: 150000,
          max_award_amount: 300000,
          status: 'open',
          metadata: {
            maturity_needed: 'Prototype or strong concept',
            key_requirements: 'Company registered, research plan, clinical partner, commercialization plan',
            filing_effort: 'High',
            timeline: '1–3 mo prep → 4–6 mo decision',
            post_award_obligations: 'Milestone reports, financial reports, IRB if applicable',
            financing_against_award: 'Sometimes (via receivables / bridge financing)',
            current_status: 'Idea / Scoping',
            next_action: 'Draft Specific Aims',
            owner: 'TBD',
          },
        },
        {
          id: '2',
          title: 'NSF Seed Fund (SBIR/STTR)',
          description: 'Digital health platforms, workflow automation, AI infra, wearables',
          min_award_amount: 275000,
          max_award_amount: 1000000,
          status: 'open',
          metadata: {
            filing_effort: 'High',
            timeline: '1–2 mo prep → 3–6 mo decision',
            current_status: 'Idea / Scoping',
            next_action: 'Market + tech 1-pager',
            owner: 'TBD',
          },
        },
        {
          id: '3',
          title: 'ARPA-H',
          description: 'High-risk / high-reward health tech (AR surgery, autonomy, radical care models)',
          min_award_amount: 1000000,
          max_award_amount: null,
          status: 'upcoming',
          metadata: {
            filing_effort: 'Very High',
            timeline: '1–3 mo prep → variable',
            current_status: 'Watchlist',
            next_action: 'Monitor SAM.gov topics',
            owner: 'TBD',
          },
        },
        {
          id: '4',
          title: 'BARDA DRIVe / EZ-BAA',
          description: 'Medical countermeasures, rapid response tech',
          min_award_amount: null,
          max_award_amount: null,
          status: 'open',
          metadata: {
            filing_effort: 'High',
            current_status: 'Watchlist',
            owner: 'TBD',
          },
        },
        {
          id: '5',
          title: 'AHRQ Digital Health',
          description: 'Health IT, quality improvement',
          min_award_amount: null,
          max_award_amount: null,
          status: 'open',
          metadata: {
            filing_effort: 'Medium',
            current_status: 'Idea / Scoping',
            owner: 'TBD',
          },
        },
        {
          id: '6',
          title: 'PCORI',
          description: 'Patient-centered outcomes research',
          min_award_amount: null,
          max_award_amount: null,
          status: 'open',
          metadata: {
            filing_effort: 'High',
            current_status: 'Watchlist',
            owner: 'TBD',
          },
        },
        {
          id: '7',
          title: 'HRSA Telehealth / Rural',
          description: 'Telehealth and rural healthcare programs',
          min_award_amount: null,
          max_award_amount: null,
          status: 'open',
          metadata: {
            filing_effort: 'Medium',
            current_status: 'Idea / Scoping',
            owner: 'TBD',
          },
        },
        {
          id: '8',
          title: 'FCC Connected Care',
          description: 'Connected care pilot programs',
          min_award_amount: null,
          max_award_amount: null,
          status: 'open',
          metadata: {
            filing_effort: 'Low',
            current_status: 'Idea / Scoping',
            owner: 'TBD',
          },
        },
        {
          id: '9',
          title: 'DoD CDMRP',
          description: 'Defense medical research programs',
          min_award_amount: null,
          max_award_amount: null,
          status: 'open',
          metadata: {
            filing_effort: 'High',
            current_status: 'Watchlist',
            owner: 'TBD',
          },
        },
      ];

      const mockApplications: Application[] = [
        {
          id: '70000001-0000-0000-0000-000000000001',
          internal_name: 'NIH R01 - CardioAI - Summer 2026',
          amount_requested: 450000,
          current_stage: 'drafting',
          probability: 20.0,
          submission_deadline: '2026-06-15',
        },
        {
          id: '70000001-0000-0000-0000-000000000002',
          internal_name: 'NIH SBIR - Remote Monitoring - Spring 2026',
          amount_requested: 250000,
          current_stage: 'planning',
          probability: 25.0,
          submission_deadline: '2026-05-01',
        },
      ];

      setOpportunities(mockOpportunities);
      setApplications(mockApplications);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  }

  async function enrichOpportunityData(opportunity: Opportunity) {
    setEnriching(true);
    setEnrichmentResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/enrichment/enrich-opportunity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grantName: opportunity.title,
        }),
      });

      const result = await response.json();
      setEnrichmentResult(result);

      if (result.success && result.data) {
        // Update the opportunity with enriched data
        setOpportunities((prev) =>
          prev.map((opp) =>
            opp.id === opportunity.id
              ? {
                  ...opp,
                  description: result.data.description || opp.description,
                  metadata: {
                    ...opp.metadata,
                    additional_info: result.data.additional_info,
                  },
                }
              : opp
          )
        );

        // Update selected opportunity
        if (selectedOpportunity && selectedOpportunity.id === opportunity.id) {
          setSelectedOpportunity({
            ...selectedOpportunity,
            description: result.data.description || selectedOpportunity.description,
            metadata: {
              ...selectedOpportunity.metadata,
              additional_info: result.data.additional_info,
            },
          });
        }
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
      setEnrichmentResult({
        success: false,
        error: 'Failed to enrich data. Please try again.',
      });
    } finally {
      setEnriching(false);
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Varies';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusExplanation = (status: string) => {
    const explanations: Record<string, string> = {
      open: 'This funding opportunity is currently accepting applications. You can start preparing your application now.',
      upcoming: 'This opportunity is announced but not yet accepting applications. Monitor for opening dates.',
      closed: 'This funding cycle has closed. Check for future opportunities or similar programs.',
    };
    return explanations[status] || 'Status information not available.';
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      qualification: 'bg-gray-100 text-gray-800',
      planning: 'bg-blue-100 text-blue-800',
      drafting: 'bg-yellow-100 text-yellow-800',
      review: 'bg-purple-100 text-purple-800',
      submitted: 'bg-green-100 text-green-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getEffortColor = (effort: string) => {
    const colors: Record<string, string> = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      'Very High': 'bg-red-100 text-red-800',
    };
    return colors[effort] || 'bg-gray-100 text-gray-800';
  };

  const getEffortExplanation = (effort: string) => {
    const explanations: Record<string, string> = {
      Low: 'Simple application with minimal documentation. Typically 1-2 weeks of prep time. Good for quick wins.',
      Medium: '3-4 weeks of preparation. Requires standard documentation like budgets, project plans, and organizational info.',
      High: '1-3 months of intensive work. Needs detailed research plans, budgets, letters of support, and multiple reviews.',
      'Very High': '3+ months of preparation. Extensive documentation, multi-institutional coordination, detailed technical plans, and rigorous review cycles.',
    };
    return explanations[effort] || 'Effort level information not available.';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GrantOps</h1>
              <p className="text-sm text-gray-500 mt-1">WebSlingerAI Grant Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode('opportunities')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'opportunities'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            All Grant Opportunities ({opportunities.length})
          </button>
          <button
            onClick={() => setViewMode('applications')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Active Applications ({applications.length})
          </button>
        </div>

        {/* Opportunities View */}
        {viewMode === 'opportunities' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Grant Opportunities Catalog
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Browse available grants and create applications
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {opp.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {opp.description}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-1">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            opp.status
                          )}`}
                        >
                          {opp.status}
                        </span>
                        <Tooltip text={getStatusExplanation(opp.status)}>
                          <span className="text-gray-400 hover:text-gray-600 text-sm">ⓘ</span>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Award Range</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(opp.min_award_amount)}
                          {opp.max_award_amount && ` - ${formatCurrency(opp.max_award_amount)}`}
                        </div>
                      </div>

                      {opp.metadata.filing_effort && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Filing Effort</div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEffortColor(
                                opp.metadata.filing_effort
                              )}`}
                            >
                              {opp.metadata.filing_effort}
                            </span>
                            <Tooltip text={getEffortExplanation(opp.metadata.filing_effort)}>
                              <span className="text-gray-400 hover:text-gray-600 text-xs">ⓘ</span>
                            </Tooltip>
                          </div>
                        </div>
                      )}

                      {opp.metadata.current_status && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Status</div>
                          <div className="text-sm text-gray-900">
                            {opp.metadata.current_status}
                          </div>
                        </div>
                      )}

                      {opp.metadata.owner && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Owner</div>
                          <div className="text-sm text-gray-900">{opp.metadata.owner}</div>
                        </div>
                      )}
                    </div>

                    {opp.metadata.timeline && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">Timeline</div>
                        <div className="text-sm text-gray-900">{opp.metadata.timeline}</div>
                      </div>
                    )}

                    {opp.metadata.next_action && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">Next Action</div>
                        <div className="text-sm font-medium text-blue-600">
                          {opp.metadata.next_action}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                        Create Application
                      </button>
                      <button
                        onClick={() => setSelectedOpportunity(opp)}
                        className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Applications View */}
        {viewMode === 'applications' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active Applications</h2>
              <p className="text-sm text-gray-500 mt-1">
                Grants you're currently working on
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.internal_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(app.amount_requested)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(
                            app.current_stage
                          )}`}
                        >
                          {app.current_stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{app.probability}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.submission_deadline)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedOpportunity.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Grant Opportunity Details</p>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Award Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Award Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Award Range</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">
                      {formatCurrency(selectedOpportunity.min_award_amount)}
                      {selectedOpportunity.max_award_amount &&
                        ` - ${formatCurrency(selectedOpportunity.max_award_amount)}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedOpportunity.status)}`}>
                        {selectedOpportunity.status}
                      </span>
                      <Tooltip text={getStatusExplanation(selectedOpportunity.status)}>
                        <span className="text-gray-400 hover:text-gray-600">ⓘ</span>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Fit Use Cases */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Fit Use Cases</h3>
                <p className="text-gray-700">{selectedOpportunity.description}</p>
              </div>

              {/* Requirements */}
              {selectedOpportunity.metadata.maturity_needed && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Maturity Needed</h3>
                  <p className="text-gray-700">{selectedOpportunity.metadata.maturity_needed}</p>
                </div>
              )}

              {selectedOpportunity.metadata.key_requirements && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Requirements</h3>
                  <p className="text-gray-700">{selectedOpportunity.metadata.key_requirements}</p>
                </div>
              )}

              {/* Timeline & Effort */}
              <div className="grid grid-cols-2 gap-4">
                {selectedOpportunity.metadata.filing_effort && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Filing Effort</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEffortColor(selectedOpportunity.metadata.filing_effort)}`}>
                        {selectedOpportunity.metadata.filing_effort}
                      </span>
                      <Tooltip text={getEffortExplanation(selectedOpportunity.metadata.filing_effort)}>
                        <span className="text-gray-400 hover:text-gray-600">ⓘ</span>
                      </Tooltip>
                    </div>
                  </div>
                )}

                {selectedOpportunity.metadata.timeline && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h3>
                    <p className="text-gray-700">{selectedOpportunity.metadata.timeline}</p>
                  </div>
                )}
              </div>

              {/* Post-Award */}
              {selectedOpportunity.metadata.post_award_obligations && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Post-Award Obligations</h3>
                  <p className="text-gray-700">{selectedOpportunity.metadata.post_award_obligations}</p>
                </div>
              )}

              {selectedOpportunity.metadata.financing_against_award && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Financing Against Award</h3>
                  <p className="text-gray-700">{selectedOpportunity.metadata.financing_against_award}</p>
                </div>
              )}

              {/* Current Status & Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedOpportunity.metadata.current_status && (
                    <div>
                      <div className="text-sm font-medium text-blue-900">Current Status</div>
                      <div className="text-blue-700 font-semibold mt-1">
                        {selectedOpportunity.metadata.current_status}
                      </div>
                    </div>
                  )}

                  {selectedOpportunity.metadata.next_action && (
                    <div>
                      <div className="text-sm font-medium text-blue-900">Next Action</div>
                      <div className="text-blue-700 font-semibold mt-1">
                        {selectedOpportunity.metadata.next_action}
                      </div>
                    </div>
                  )}

                  {selectedOpportunity.metadata.owner && (
                    <div>
                      <div className="text-sm font-medium text-blue-900">Owner</div>
                      <div className="text-blue-700 font-semibold mt-1">
                        {selectedOpportunity.metadata.owner}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enrichment Section */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-900">AI Web Enrichment</h3>
                    <p className="text-xs text-purple-700 mt-1">
                      Automatically scrape and extract detailed information from official grant websites
                    </p>
                  </div>
                  <button
                    onClick={() => enrichOpportunityData(selectedOpportunity)}
                    disabled={enriching}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                      enriching
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {enriching ? '🔄 Enriching...' : '🤖 Enrich Data'}
                  </button>
                </div>

                {enrichmentResult && (
                  <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                    {enrichmentResult.success ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-green-500 text-lg">✅</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">
                              Enrichment Successful!
                            </p>
                            {enrichmentResult.source_url && (
                              <a
                                href={enrichmentResult.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Source: {enrichmentResult.source_url}
                              </a>
                            )}
                          </div>
                        </div>
                        {enrichmentResult.data?.description && (
                          <div className="text-sm text-gray-700 border-t border-gray-200 pt-2">
                            <strong>Found:</strong> {enrichmentResult.data.description.substring(0, 200)}...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="text-red-500 text-lg">❌</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">Enrichment Failed</p>
                          <p className="text-xs text-red-700 mt-1">{enrichmentResult.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                  Create Application
                </button>
                <button
                  onClick={() => {
                    setSelectedOpportunity(null);
                    setEnrichmentResult(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
