import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getCart, getNotifications, getWishlist, logout } from '../services/customerApi';
import { getAccessToken, clearAuthStorage } from '../utils/storage';

const EMPTY_CUSTOMER = {
  id: null,
  username: '',
  fullName: '',
  email: '',
  role: '',
  roles: [],
};

const CustomerContext = createContext({
  user: EMPTY_CUSTOMER,
  setUser: () => {},
  cartCount: 0,
  unreadNotifs: 0,
  wishlistIds: new Set(),
  loading: true,
  refreshCart: () => {},
  refreshNotifs: () => {},
  refreshWishlist: () => {},
  refreshUser: () => {},
  logoutUser: () => {},
});

export const CustomerProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(EMPTY_CUSTOMER);
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading]     = useState(true);

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await getCurrentUser();
      setUser(res.data || EMPTY_CUSTOMER);
    } catch { /* token expired or bad */ }
    setLoading(false);
  }, []);

  const loadCart = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;
    try {
      const res = await getCart(userId);
      const items = res.data?.items || res.data || [];
      setCartCount(Array.isArray(items) ? items.length : 0);
    } catch { setCartCount(0); }
  }, [user?.id]);

  const loadNotifs = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getNotifications();
      const notifs = res.data || [];
      setUnreadNotifs(notifs.filter(n => !n.isRead).length);
    } catch { setUnreadNotifs(0); }
  }, [user]);

  const loadWishlist = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;
    try {
      const res = await getWishlist(userId);
      const items = Array.isArray(res.data) ? res.data : [];
      const ids = new Set(items.map(item => item.product?.id || item.productId || item.id));
      setWishlistIds(ids);
    } catch { setWishlistIds(new Set()); }
  }, [user?.id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user?.id) { loadCart(); loadNotifs(); loadWishlist(); }
  }, [user, loadCart, loadNotifs, loadWishlist]);

  const refreshCart = () => loadCart();
  const refreshNotifs = () => loadNotifs();
  const refreshWishlist = () => loadWishlist();

  const logoutUser = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout backend request failed", err);
    }
    clearAuthStorage();
    setUser(EMPTY_CUSTOMER);
    setCartCount(0);
    setUnreadNotifs(0);
    navigate('/');
  };

  return (
    <CustomerContext.Provider value={{
      user, setUser, cartCount, unreadNotifs, wishlistIds,
      loading, refreshCart, refreshNotifs, refreshWishlist,
      refreshUser: loadUser,
      logoutUser
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => useContext(CustomerContext);
