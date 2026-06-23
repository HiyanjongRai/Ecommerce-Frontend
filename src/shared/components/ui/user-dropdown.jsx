import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Bell, 
  CreditCard, 
  HelpCircle, 
  PhoneCall, 
  Store, 
  BookOpen, 
  Globe, 
  Coins, 
  LogOut, 
  LayoutDashboard, 
  ShoppingBag, 
  Box, 
  PlusCircle, 
  Warehouse, 
  Star, 
  BarChart3, 
  Wallet, 
  Settings, 
  ShieldCheck, 
  Users, 
  Receipt, 
  Ticket, 
  FileText, 
  Key, 
  ChevronRight,
  LogIn,
  UserPlus,
  Sparkles,
  ShieldAlert,
  ShoppingCart
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { cn } from "../../utils/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const resolveAvatarUrl = (user) => {
  const raw =
    user?.profileImagePath ||
    user?.profileImage ||
    user?.image ||
    user?.avatar ||
    null;
  if (!raw) return "";
  return raw.startsWith("http")
    ? raw
    : `${BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

export function UserDropdown({ 
  user, 
  unreadNotifs = 0, 
  wishlistCount = 0, 
  cartCount = 0,
  onLogout, 
  onRequireLogin 
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };
  const isLoggedIn = Boolean(user?.id || user?.email || user?.username);
  
  const displayName = isLoggedIn 
    ? (user?.fullName || user?.username || user?.email?.split("@")?.[0] || "User")
    : "Guest";
  const email = user?.email || "";
  const avatarUrl = isLoggedIn ? resolveAvatarUrl(user) : "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const role = (user?.role || "CUSTOMER").toUpperCase();

  // Role details configuration
  const roleConfig = {
    CUSTOMER: {
      label: "Customer",
      badgeClass: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
      avatarGradient: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
    },
    SELLER: {
      label: "Verified Seller",
      badgeClass: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
      avatarGradient: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
    },
    ADMIN: {
      label: "System Admin",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50",
      avatarGradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    }
  };

  const currentRole = roleConfig[role] || roleConfig.CUSTOMER;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center justify-center relative focus:outline-none group rounded-full transition-all focus:ring-2 focus:ring-green-500/20"
          title={isLoggedIn ? `Account: ${displayName}` : "Sign In"}
        >
          <div className="size-9 rounded-full border border-slate-200 hover:border-green-500 flex items-center justify-center overflow-hidden bg-white shadow-xs transition-all duration-200 group-hover:scale-105">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="size-4.5 text-slate-650 group-hover:text-green-600 transition-colors" />
            )}
          </div>
          {isLoggedIn && (
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow-xs" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[320px] rounded-2xl bg-white dark:bg-slate-900 p-0 border border-slate-150 dark:border-slate-800 shadow-xl overflow-hidden font-inter text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-3 duration-250 z-[100]"
        align="end"
        sideOffset={10}
      >
        {/* =====================================================================
           1. GUEST DROPDOWN VIEW
           ===================================================================== */}
        {!isLoggedIn && (
          <div className="flex flex-col">
            {/* Header section */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="size-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Welcome to Jhapcham</h3>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-normal">
                Sign in to manage orders, track delivery, and access custom deals.
              </p>
              
              {/* Primary Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setOpen(false); onRequireLogin("login"); }}
                  className="flex-1 py-2 px-3 bg-[#16A34A] hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  <LogIn className="size-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => { setOpen(false); onRequireLogin("register"); }}
                  className="flex-1 py-2 px-3 border border-slate-200 hover:border-green-500 dark:border-slate-700 dark:hover:border-green-500 text-slate-700 dark:text-slate-350 hover:text-green-600 hover:bg-green-50/10 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <UserPlus className="size-3.5" />
                  Register
                </button>
              </div>
            </div>

            {/* Links Lists */}
            <div className="py-2.5 px-3 flex flex-col gap-0.5">
              <DropdownMenuItem 
                onClick={() => handleNavigate("/customer/orders")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-705 dark:text-slate-350 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Package className="size-4.5 text-slate-400" />
                  Track Order
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/help")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-350 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <HelpCircle className="size-4.5 text-slate-400" />
                  Help Center
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/help")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-350 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <PhoneCall className="size-4.5 text-slate-400" />
                  Contact Support
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

            {/* Become a Seller Banner */}
            <div className="p-3">
              <div 
                onClick={() => handleNavigate("/register")}
                className="p-3 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-105 dark:border-amber-900/30 rounded-xl cursor-pointer hover:border-amber-300 transition-all group/seller"
              >
                <div className="flex items-center gap-2 text-[13px] font-bold text-amber-850 dark:text-amber-450 mb-0.5">
                  <Store className="size-4.5 text-amber-500" />
                  <span>Become a Seller</span>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-500/80 mb-2 leading-relaxed">
                  Start selling across Nepal with zero upfront fees.
                </p>
                <span className="text-[11px] font-bold text-amber-850 dark:text-amber-450 flex items-center gap-1 group-hover/seller:text-amber-600 transition-colors">
                  Learn About Selling <ChevronRight className="size-3.5" />
                </span>
              </div>
            </div>

            {/* Currency settings footer row */}
            <div className="bg-slate-50/80 dark:bg-slate-950/40 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-slate-400" />
                English
              </span>
              <span className="flex items-center gap-1.5">
                <Coins className="size-3.5 text-slate-400" />
                NPR (रू)
              </span>
            </div>
          </div>
        )}

        {/* =====================================================================
           2. LOGGED IN CUSTOMER VIEW
           ===================================================================== */}
        {isLoggedIn && role === "CUSTOMER" && (
          <div className="flex flex-col">
            {/* Header profile info */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3 items-center">
              <Avatar className="size-11 border border-slate-200/50 shadow-xs">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback 
                  style={{ background: currentRole.avatarGradient }}
                  className="text-white font-extrabold text-[13px]"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate leading-tight">{displayName}</h4>
                </div>
                {email && <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-none">{email}</p>}
                <Badge className={cn("mt-1.5 border-[0.5px] text-[10px] rounded-md py-0.5 px-2 font-bold capitalize shadow-xs border-transparent pointer-events-none", currentRole.badgeClass)}>
                  {currentRole.label}
                </Badge>
              </div>
            </div>

            {/* Links Block */}
            <div className="py-2 px-3 flex flex-col gap-0.5 max-h-[320px] overflow-y-auto no-scrollbar">
              <DropdownMenuItem 
                onClick={() => handleNavigate("/customer/profile")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <User className="size-4.5 text-slate-400" />
                  My Profile
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/customer/orders")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Package className="size-4.5 text-slate-400" />
                  My Orders
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/customer/wishlist")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Heart className="size-4.5 text-slate-400" />
                  Wishlist
                </span>
                {wishlistCount > 0 && (
                  <Badge className="bg-green-600 text-white text-[10px] border-transparent font-bold">
                    {wishlistCount}
                  </Badge>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/customer/profile")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <MapPin className="size-4.5 text-slate-400" />
                  Saved Addresses
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/customer/notifications")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Bell className="size-4.5 text-slate-400" />
                  Notifications
                </span>
                {unreadNotifs > 0 && (
                  <Badge className="bg-rose-500 text-white text-[10px] border-transparent font-bold">
                    {unreadNotifs}
                  </Badge>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/customer/profile")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <CreditCard className="size-4.5 text-slate-400" />
                  Payment Methods
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />

              <DropdownMenuItem 
                onClick={() => handleNavigate("/help")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <HelpCircle className="size-4.5 text-slate-400" />
                  Help Center
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/help")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <PhoneCall className="size-4.5 text-slate-400" />
                  Contact Support
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>
            </div>

            {/* Logout Footer Button */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <DropdownMenuItem 
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs"
              >
                <LogOut className="size-4" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </div>
        )}

        {/* =====================================================================
           3. LOGGED IN SELLER VIEW
           ===================================================================== */}
        {isLoggedIn && role === "SELLER" && (
          <div className="flex flex-col">
            {/* Header profile info */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3 items-center">
              <Avatar className="size-11 border border-slate-250/50 shadow-xs">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback 
                  style={{ background: currentRole.avatarGradient }}
                  className="text-white font-extrabold text-[13px]"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate leading-tight">{displayName}</h4>
                {email && <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-none">{email}</p>}
                <Badge className={cn("mt-1.5 border-[0.5px] text-[10px] rounded-md py-0.5 px-2 font-bold capitalize shadow-xs border-transparent pointer-events-none", currentRole.badgeClass)}>
                  {currentRole.label}
                </Badge>
              </div>
            </div>

            {/* Links Block */}
            <div className="py-2 px-3 flex flex-col gap-0.5 max-h-[360px] overflow-y-auto no-scrollbar">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-2.5 pt-1.5 pb-1">Business Management</div>
              
              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/dashboard")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <LayoutDashboard className="size-4.5 text-slate-400" />
                  Seller Dashboard
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/orders")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <ShoppingBag className="size-4.5 text-slate-400" />
                  Manage Orders
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/products")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Box className="size-4.5 text-slate-400" />
                  My Products
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/add-product")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <PlusCircle className="size-4.5 text-slate-400" />
                  Add Product
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/products")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Warehouse className="size-4.5 text-slate-400" />
                  Inventory
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/dashboard")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Star className="size-4.5 text-slate-400" />
                  Customer Reviews
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/analytics")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <BarChart3 className="size-4.5 text-slate-400" />
                  Business Analytics
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/dashboard")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Wallet className="size-4.5 text-slate-400" />
                  Store Earnings
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-2.5 pt-1.5 pb-1">Settings</div>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/profile")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <User className="size-4.5 text-slate-400" />
                  Seller Profile
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/seller/settings")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Settings className="size-4.5 text-slate-400" />
                  Store Settings
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>
            </div>

            {/* Logout Footer Button */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <DropdownMenuItem 
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs"
              >
                <LogOut className="size-4" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </div>
        )}

        {/* =====================================================================
           4. LOGGED IN ADMIN VIEW
           ===================================================================== */}
        {isLoggedIn && role === "ADMIN" && (
          <div className="flex flex-col">
            {/* Header profile info */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3 items-center">
              <Avatar className="size-11 border border-slate-200/50 shadow-xs">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback 
                  style={{ background: currentRole.avatarGradient }}
                  className="text-white font-extrabold text-[13px]"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate leading-tight">{displayName}</h4>
                {email && <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-none">{email}</p>}
                <Badge className={cn("mt-1.5 border-[0.5px] text-[10px] rounded-md py-0.5 px-2 font-bold capitalize shadow-xs border-transparent pointer-events-none", currentRole.badgeClass)}>
                  {currentRole.label}
                </Badge>
              </div>
            </div>

            {/* Links Block */}
            <div className="py-2 px-3 flex flex-col gap-0.5 max-h-[360px] overflow-y-auto no-scrollbar">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-2.5 pt-1.5 pb-1">System Management</div>
              
              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/dashboard")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <ShieldCheck className="size-4.5 text-slate-400" />
                  Admin Dashboard
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/users")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Users className="size-4.5 text-slate-400" />
                  Manage Users
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/sellers")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Store className="size-4.5 text-slate-400" />
                  Manage Sellers
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/products")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Box className="size-4.5 text-slate-400" />
                  Manage Products
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/orders")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <ShoppingCart className="size-4.5 text-slate-400" />
                  Manage Orders
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/payments")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Receipt className="size-4.5 text-slate-400" />
                  Transactions
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/promos")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Ticket className="size-4.5 text-slate-400" />
                  Manage Coupons
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-2.5 pt-1.5 pb-1">Administration</div>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/reports")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <FileText className="size-4.5 text-slate-400" />
                  System Reports
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/settings")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Settings className="size-4.5 text-slate-400" />
                  Site Settings
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleNavigate("/admin/audit-logs")}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors focus:bg-slate-50 outline-none"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <Key className="size-4.5 text-slate-400" />
                  Security Settings
                </span>
                <ChevronRight className="size-4 text-slate-350" />
              </DropdownMenuItem>
            </div>

            {/* Logout Footer Button */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <DropdownMenuItem 
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs"
              >
                <LogOut className="size-4" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;
