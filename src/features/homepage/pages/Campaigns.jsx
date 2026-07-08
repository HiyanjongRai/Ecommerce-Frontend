import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveCampaigns } from '../api/homepageApi';
import { ChevronLeft } from 'lucide-react';

/**
 * Campaigns Page
 * Displays all active campaigns from API
 * Responsive grid layout with proper error handling
 */
function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Background colors for campaigns (used as fallback)
  const backgroundColors = [
    'from-emerald-500 to-emerald-600',
    'from-blue-500 to-blue-600',
    'from-indigo-600 to-indigo-700',
    'from-purple-600 to-purple-700',
    'from-pink-500 to-pink-600',
    'from-orange-500 to-orange-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const data = await getActiveCampaigns();
        if (isMounted) {
          const campaignList = Array.isArray(data) ? data : data?.data || [];
          setCampaigns(campaignList);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch campaigns:', err);
          setError(err.message || 'Failed to load campaigns');
          setCampaigns([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCampaigns();

    return () => {
      isMounted = false;
    };
  }, []);

  // Loading skeleton
  const CampaignSkeleton = () => (
    <div className="group relative overflow-hidden rounded-2xl h-56 shadow-md bg-gray-200 animate-pulse"></div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              aria-label="Go back"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">All Campaigns</h1>
          </div>
          {campaigns.length > 0 && !loading && (
            <p className="text-gray-600 text-sm">
              Showing {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CampaignSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-4">Unable to load campaigns</p>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-semibold transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">No campaigns available</p>
              <p className="text-gray-400 text-sm mb-6">Check back soon for new campaigns!</p>
              <Link
                to="/"
                className="px-6 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-semibold transition-colors duration-200"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => {
              const campaignLink = campaign.link || `/campaigns/${campaign.campaignId || campaign.id}`;
              const campaignBg = campaign.backgroundColor || backgroundColors[index % backgroundColors.length];
              const campaignImage = campaign.image || campaign.imagePath || campaign.bannerImage;

              return (
                <Link
                  key={campaign.id || campaign.campaignId || index}
                  to={campaignLink}
                  className="group relative overflow-hidden rounded-2xl h-56 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${campaignBg} opacity-70`}></div>

                  {/* Background Image */}
                  {campaignImage && (
                    <img
                      src={campaignImage}
                      alt={campaign.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-300"
                      loading="lazy"
                    />
                  )}

                  {/* Content Overlay */}
                  <div className="relative inset-0 flex flex-col justify-between p-6 h-full">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {campaign.title || campaign.name || 'Campaign'}
                      </h3>
                      {(campaign.subtitle || campaign.description) && (
                        <p className="text-base text-white/90 font-semibold line-clamp-2">
                          {campaign.subtitle || campaign.description}
                        </p>
                      )}
                      {campaign.startDate && (
                        <p className="text-xs text-white/70 mt-3">
                          {new Date(campaign.startDate).toLocaleDateString()} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}
                        </p>
                      )}
                    </div>

                    {/* Shop Now Button */}
                    <button className="self-start inline-flex items-center px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors duration-200">
                      {campaign.buttonText || 'Shop Now'}
                    </button>
                  </div>

                  {/* Hover Overlay Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignsPage;
