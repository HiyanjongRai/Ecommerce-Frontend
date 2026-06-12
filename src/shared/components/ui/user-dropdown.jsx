// ─── All imports at the top (ESLint: import/first) ───────────────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { cn } from "../../utils/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

/** Resolve avatar URL from any backend field name; prepend BASE_URL for relative paths */
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

// ─── Role-based menu configurations ──────────────────────────────────────────
const CUSTOMER_MENU = {
  profile: [
    { icon: "solar:user-circle-line-duotone", label: "Your Profile",  path: "/customer/profile" },
    { icon: "solar:bag-3-line-duotone",       label: "My Orders",     path: "/customer/orders" },
    { icon: "solar:home-smile-line-duotone",  label: "Dashboard",     path: "/customer/dashboard" },
    { icon: "solar:heart-line-duotone",       label: "Wishlist",      path: "/customer/wishlist" },
    { icon: "solar:bell-line-duotone",        label: "Notifications", path: "/customer/notifications", showBadge: true },
    { icon: "solar:settings-line-duotone",    label: "Settings",      path: "/customer/profile" },
  ],
};

const SELLER_MENU = {
  profile: [
    { icon: "solar:chart-2-line-duotone",     label: "Seller Dashboard", path: "/seller/dashboard" },
    { icon: "solar:box-line-duotone",          label: "My Products",      path: "/seller/products" },
    { icon: "solar:bag-3-line-duotone",        label: "Orders",           path: "/seller/orders" },
    { icon: "solar:graph-new-up-line-duotone", label: "Analytics",        path: "/seller/analytics" },
    { icon: "solar:bell-line-duotone",         label: "Notifications",    path: "/seller/notifications", showBadge: true },
    { icon: "solar:settings-line-duotone",     label: "Settings",         path: "/seller/settings" },
  ],
};

const ADMIN_MENU = {
  profile: [
    { icon: "solar:pie-chart-2-line-duotone",        label: "Admin Dashboard", path: "/admin/dashboard" },
    { icon: "solar:users-group-rounded-line-duotone", label: "Manage Users",   path: "/admin/users" },
    { icon: "solar:shop-line-duotone",                label: "Sellers",         path: "/admin/sellers" },
    { icon: "solar:box-line-duotone",                 label: "Products",        path: "/admin/products" },
    { icon: "solar:bag-3-line-duotone",               label: "Orders",          path: "/admin/orders" },
    { icon: "solar:shield-warning-line-duotone",      label: "Disputes",        path: "/admin/disputes" },
    { icon: "solar:settings-line-duotone",            label: "Settings",        path: "/admin/inbox" },
  ],
};

const STATUS_ITEMS = [
  { value: "focus",   icon: "solar:emoji-funny-circle-line-duotone", label: "Focus" },
  { value: "offline", icon: "solar:moon-sleep-line-duotone",          label: "Appear Offline" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getMenuByRole = (role) => {
  switch ((role || "").toUpperCase()) {
    case "SELLER": return SELLER_MENU;
    case "ADMIN":  return ADMIN_MENU;
    default:       return CUSTOMER_MENU;
  }
};

const getRoleBadgeClass = (role) => {
  switch ((role || "").toUpperCase()) {
    case "SELLER": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/50";
    case "ADMIN":  return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-500/50";
    default:       return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/50";
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export function UserDropdown({ user, unreadNotifs = 0, onLogout, onRequireLogin }) {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState("online");

  // Derive display values from the app's user object
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user?.fullName || user?.username || "My Account";
  const handle    = user?.username
    ? `@${user?.username}`
    : user?.email ? `@${user?.email.split("@")[0]}` : "";
  const avatarUrl = resolveAvatarUrl(user);
  const initials  = displayName.slice(0, 2).toUpperCase();
  const role      = user?.role || "CUSTOMER";
  const menu      = getMenuByRole(role);

  // ── Not logged in ──
  if (!user) {
    return (
      <button
        onClick={onRequireLogin}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-800">
          <Icon icon="solar:user-circle-line-duotone" className="size-6 text-gray-500" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[8px] uppercase font-bold text-gray-500">Namaste, Sign In</span>
          <span className="text-[10px] font-bold text-gray-900">My Account</span>
        </div>
      </button>
    );
  }

  // ── Logged in ──
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Wrapper keeps the green dot positioned relative to the avatar */}
        <div className="relative cursor-pointer group">
          <Avatar className="size-10 border-2 border-white dark:border-gray-700 shadow-sm ring-offset-1 group-hover:ring-2 group-hover:ring-emerald-400 transition-all">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback
              style={{ background: "linear-gradient(135deg,#28c76f 0%,#0ea5e9 100%)" }}
              className="text-white font-bold text-sm"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator dot */}
          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 shadow" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="no-scrollbar w-[310px] rounded-2xl bg-gray-50 dark:bg-black/90 p-0 border border-gray-200 dark:border-gray-700/30"
        align="end"
        sideOffset={8}
      >
        {/* ── Header card ── */}
        <section className="bg-white dark:bg-gray-100/10 backdrop-blur-lg rounded-2xl p-1 shadow border border-gray-200 dark:border-gray-700/20">
          {/* User info row */}
          <div className="flex items-center p-2">
            <div className="flex-1 flex items-center gap-2">
              <Avatar className="size-10 border border-white dark:border-gray-700">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback
                  style={{ background: "linear-gradient(135deg,#28c76f 0%,#0ea5e9 100%)" }}
                  className="text-white font-bold text-sm"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{displayName}</h3>
                {handle && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{handle}</p>}
              </div>
            </div>
            <Badge className={`${getRoleBadgeClass(role)} border-[0.5px] text-[11px] rounded-sm capitalize shrink-0`}>
              {role.toLowerCase()}
            </Badge>
          </div>

          {/* ── Status sub-menu ── */}
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer p-2 rounded-lg">
                <span className="flex items-center gap-1.5 font-medium text-gray-500 dark:text-gray-400">
                  <Icon icon="solar:smile-circle-line-duotone" className="size-5" />
                  Update status
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-700/30">
                  <DropdownMenuRadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
                    {STATUS_ITEMS.map((s) => (
                      <DropdownMenuRadioItem className="gap-2 cursor-pointer" key={s.value} value={s.value}>
                        <Icon icon={s.icon} className="size-5 text-gray-500 dark:text-gray-400" />
                        {s.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* ── Role-specific links ── */}
          <DropdownMenuGroup>
            {menu.profile.map((item) => (
              <DropdownMenuItem
                key={item.path}
                className={cn("justify-between p-2 rounded-lg cursor-pointer")}
                onSelect={() => navigate(item.path)}
              >
                <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                  <Icon icon={item.icon} className="size-5 text-gray-500 dark:text-gray-400" />
                  {item.label}
                </span>
                {item.showBadge && unreadNotifs > 0 && (
                  <Badge className="bg-emerald-600 text-white text-[11px] border-transparent">
                    {unreadNotifs}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </section>

        {/* ── Logout section ── */}
        <section className="mt-1 p-1 rounded-2xl">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="p-2 rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
              onSelect={onLogout}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Icon icon="solar:logout-2-bold-duotone" className="size-5" />
                Log out
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </section>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;

