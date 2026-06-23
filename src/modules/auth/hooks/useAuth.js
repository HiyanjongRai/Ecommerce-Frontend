import { useMemo } from 'react';
import { useCustomer } from '../../customer/contexts/CustomerContext';

export default function useAuth() {
  const customer = useCustomer();
  return useMemo(() => ({
    ...customer,
    isAuthenticated: Boolean(customer.user?.id),
    role: customer.user?.role || customer.user?.roles?.[0] || '',
  }), [customer]);
}
