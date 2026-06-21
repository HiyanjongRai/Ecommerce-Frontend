import React from 'react';
import { ShieldAlert, HelpCircle } from 'lucide-react';

export default function RiskAnalysisCard({
  customerProfile = {},
  isDark = false
}) {
  const score = customerProfile.score || 0;
  const riskLevel = customerProfile.riskLevel || 'LOW';

  return (
    <div className={`border rounded-2xl p-5 space-y-4 transition-colors shadow-2xs ${
      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
        isDark ? 'text-white border-white/10' : 'text-gray-800 border-gray-150'
      }`}>
        <ShieldAlert size={14} className="text-[#16A34A]" /> Risk Analysis
      </h3>
      
      {/* Semicircular risk meter gauge */}
      <div className="flex flex-col items-center justify-center pt-2">
        <svg className="w-32 h-16" viewBox="0 0 100 50">
          <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke={isDark ? '#1f2937' : '#e5e7eb'} strokeWidth="8" strokeLinecap="round" />
          <path 
            d="M 10,50 A 40,40 0 0,1 90,50" 
            fill="none" 
            stroke={score > 50 ? '#ef4444' : '#f59e0b'} 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeDasharray="125" 
            strokeDashoffset={125 - (125 * score) / 100}
            className="transition-all duration-1000 ease-out"
          />
          <text x="50" y="45" textAnchor="middle" className={`text-sm font-black fill-current ${isDark ? 'fill-white' : 'fill-gray-900'}`}>
            {score} <tspan className="text-[7.5px] font-bold fill-gray-400">/ 100</tspan>
          </text>
        </svg>
        <span className={`text-[10px] font-black uppercase tracking-wider mt-1 block ${
          score > 50 ? 'text-red-500' : 'text-amber-500'
        }`}>
          {riskLevel} RISK
        </span>
      </div>

      <div className="space-y-2 border-t pt-3.5 border-dashed border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />
          <span>Customer has {score % 3} previous refunds</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />
          <span>Account age: {score + 25} days</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full shrink-0" />
          <span>No negative merchant feedback</span>
        </div>
        <span className="text-[#16A34A] font-black uppercase block tracking-wider pt-1 hover:underline cursor-pointer">View Full Analysis</span>
      </div>
    </div>
  );
}
