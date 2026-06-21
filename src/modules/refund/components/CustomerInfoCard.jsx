import React from 'react';
import { User } from 'lucide-react';
import { toast } from '../../../shared/contexts/ToastContext';

const money = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : '—';

export default function CustomerInfoCard({
  customerName = 'Customer',
  customerEmail = 'customer@email.com',
  customerProfile = {},
  isDark = false
}) {
  return (
    <div className={`border rounded-2xl p-5 space-y-4 transition-colors shadow-2xs ${
      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${
        isDark ? 'text-white border-white/10' : 'text-gray-800 border-gray-150'
      }`}>
        <User size={14} className="text-[#16A34A]" /> Customer Information
      </h3>
      
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${
          isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
        }`}>
          <User size={22} />
        </div>
        <div className="space-y-0.5 leading-tight">
          <span className={`font-black text-xs block ${isDark ? 'text-white' : 'text-gray-900'}`}>{customerName}</span>
          <span className="text-[10px] text-gray-400 block break-all">{customerEmail}</span>
          <span className="text-[10px] text-gray-400 block">+977 9843928489</span>
        </div>
      </div>
      
      <button 
        onClick={() => toast('Customer profile loaded...', 'success')}
        className="w-full text-center py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest text-[#16A34A] border-[#16A34A] bg-transparent hover:bg-[#16A34A]/10 transition-all cursor-pointer font-bold"
      >
        View Profile ↗
      </button>

      <div className="grid grid-cols-2 gap-4 border-t pt-3.5 border-dashed border-gray-200 dark:border-white/10 text-center text-xs font-semibold">
        <div>
          <span className="text-[8.5px] font-black text-gray-400 block uppercase tracking-wider">Total Orders</span>
          <span className={`text-sm font-black mt-1 block ${isDark ? 'text-white' : 'text-gray-900'}`}>{customerProfile.orders || 0}</span>
        </div>
        <div>
          <span className="text-[8.5px] font-black text-gray-400 block uppercase tracking-wider">Total Spent</span>
          <span className={`text-sm font-black mt-1 block ${isDark ? 'text-white' : 'text-gray-900'}`}>{money(customerProfile.spent)}</span>
        </div>
      </div>
    </div>
  );
}
