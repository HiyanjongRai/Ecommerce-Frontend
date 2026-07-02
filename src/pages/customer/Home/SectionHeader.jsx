import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Section Header Component
 * Displays section title with optional "View All" link
 * Used consistently across homepage sections
 * 
 * @param {string} title - Section title
 * @param {string} linkTo - URL for "View All" link (optional)
 * @param {string} linkLabel - Label for "View All" link (default: "View All")
 */
function SectionHeader({ title, linkTo, linkLabel = 'View All' }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        {title}
      </h2>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-sm font-semibold text-[#28a745] hover:text-[#218838] flex items-center gap-1 transition-colors"
        >
          {linkLabel}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;
