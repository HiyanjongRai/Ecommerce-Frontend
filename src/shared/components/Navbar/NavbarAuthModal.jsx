import React from 'react';
import LoginModal from '../../../features/auth/components/LoginModal';

export default function NavbarAuthModal({ isOpen, onClose, initialTab, initialRole }) {
  return (
    <LoginModal
      isOpen={isOpen}
      onClose={onClose}
      initialTab={initialTab}
      initialRole={initialRole}
    />
  );
}
