
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveCampaigns } from '../api/homepageApi';
import { ChevronRight } from 'lucide-react';

/**
 * CampaignBanners Component
 * Displays dynamic campaigns fetched from API
 * Shows loading state and handles errors gracefully
 */
function CampaignBanners() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Background colors for campaigns (used as fallback)
  const backgroundColors = [
    'from-emerald-500 to-emerald-600',
    'from-blue-500 to-blue-600',
    'from-indigo-600 to-indigo-700',
    'from-purple-600 to-purple-700',
  ];

  // Fetch campaigns on mount
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
          setError(err.message);
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

  // Show only first 4 campaigns on homepage
  const displayedCampaigns = campaigns.slice(0, 4);
  const hasMoreCampaigns = campaigns.length > 4;

  // Loading skeleton
  const CampaignSkeleton = () => (
    <div className="group relative overflow-hidden rounded-2xl h-40 shadow-md bg-gray-200 animate-pulse"></div>
  );

  if (loading) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Campaigns</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CampaignSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error || displayedCampaigns.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Header with View All Link */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Campaigns</h2>
        {hasMoreCampaigns && (
          <Link
            to="/promo/campaign"
            className="inline-flex items-center gap-1 text-[#15803d] hover:text-[#166534] font-semibold text-sm transition-colors duration-200"
          >
            View All
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        )}
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedCampaigns.map((campaign, index) => {
          const campaignBg = campaign.backgroundColor || backgroundColors[index % backgroundColors.length];
          const campaignImage = campaign.image || campaign.imagePath || campaign.bannerImage;

          return (
            <Link
              key={campaign.id || campaign.campaignId || index}
              to="/promo/campaign"
              className="group relative overflow-hidden rounded-2xl h-40 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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
              <div className="relative inset-0 flex flex-col justify-between p-5 h-full">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                    {campaign.title || campaign.name || 'Campaign'}
                  </h3>
                  {(campaign.subtitle || campaign.description) && (
                    <p className="text-sm sm:text-base text-white/90 font-semibold line-clamp-1">
                      {campaign.subtitle || campaign.description}
                    </p>
                  )}
                </div>

                {/* Shop Now Button */}
                <button className="self-start inline-flex items-center px-3 py-1.5 bg-white text-gray-900 rounded-full text-xs sm:text-sm font-bold hover:bg-gray-100 transition-colors duration-200">
                  {campaign.buttonText || 'Shop Now'}
                </button>
              </div>

              {/* Hover Overlay Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          );
        })}
      </div>

      {/* View All Campaigns Section - Full Width Button */}
      {hasMoreCampaigns && (
        <div className="mt-8 flex justify-center">
          <Link
            to="/promo/campaign"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#15803d] hover:bg-[#166534] text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            View All Campaigns
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          </Link>
        </div>
      )}
    </section>
  );
}

export default CampaignBanners;
