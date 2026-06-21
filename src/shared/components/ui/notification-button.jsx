import React from "react"
import { Bell } from "lucide-react"

export function NotificationButton({ count = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Notifications"
      className="relative w-12 h-12 flex items-center justify-center rounded-[14px] bg-white border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:bg-gray-50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer focus:outline-none"
    >
      <Bell size={20} className="text-gray-600" strokeWidth={2} aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#EF4444] text-white text-[11px] font-bold px-1 select-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  )
}
