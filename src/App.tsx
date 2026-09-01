import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FooterNav } from './components/FooterNav';
import { BrutalistToast, type ToastMessage } from './components/BrutalistToast';
import { ReachPage } from './pages/ReachPage';
import { ChatPage } from './pages/ChatPage';
import { PremiumPage } from './pages/PremiumPage';
import { OwnerPage } from './pages/OwnerPage';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { AppealPage } from './pages/AppealPage';
import { 
  getAuthSession, 
  saveAuthSession, 
  clearAuthSession, 
  type UserProfile,
  type UserRole
} from './utils/storage';
import { soundFx } from './utils/audio';
import { subscribeUserProfile, fetchUserProfileFromFirestore } from './services/firebaseService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('reach');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getAuthSession());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundFx.isEnabled());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Permanently enforce Dark Mode across all environments
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Real-time synchronization of user limits, role (VIP), block status from Firestore
  useEffect(() => {
    if (!userProfile?.username) return;

    const unsubscribe = subscribeUserProfile(userProfile.username, (firestoreUser) => {
      if (firestoreUser) {
        setUserProfile((prev) => {
          if (!prev) return null;
          const isUserBlocked = firestoreUser.role === 'blocked' || !!firestoreUser.isBlocked || firestoreUser.customDailyLimit === 0;
          const newRole: UserRole = isUserBlocked ? 'blocked' : (firestoreUser.role || prev.role);
          const effectiveLimit = isUserBlocked
            ? 0
            : (typeof firestoreUser.customDailyLimit === 'number' ? firestoreUser.customDailyLimit : (newRole === 'premium' ? 9999 : (prev.customDailyLimit ?? 10)));

          const updated: UserProfile = {
            ...prev,
            role: newRole,
            avatarColor: firestoreUser.avatarColor || prev.avatarColor,
            nickname: firestoreUser.nickname || prev.nickname,
            premiumExpiresAt: firestoreUser.premiumExpiresAt !== undefined ? firestoreUser.premiumExpiresAt : prev.premiumExpiresAt,
            isBlocked: isUserBlocked,
            blockedReason: firestoreUser.blockedReason !== undefined ? firestoreUser.blockedReason : prev.blockedReason,
            customDailyLimit: effectiveLimit,
            customRoleName: firestoreUser.customRoleName !== undefined ? (firestoreUser.customRoleName || undefined) : prev.customRoleName,
            customRoleExpiresAt: firestoreUser.customRoleExpiresAt !== undefined ? (firestoreUser.customRoleExpiresAt || undefined) : prev.customRoleExpiresAt,
            customRoleBaseTier: firestoreUser.customRoleBaseTier !== undefined ? (firestoreUser.customRoleBaseTier || undefined) : prev.customRoleBaseTier,
          };
          saveAuthSession(updated);
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, [userProfile?.username]);

  const handleToggleSound = () => {
    const nextState = soundFx.toggleSound();
    setSoundEnabled(nextState);
    showToast(
      'info',
      nextState ? 'Suara Aktif' : 'Suara Dimatikan',
      nextState ? 'Efek audio tombol telah dinyalakan.' : 'Efek audio tombol telah dimatikan.'
    );
  };

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTabChange = (newTab: string) => {
    if (newTab === 'admin' && userProfile?.role !== 'admin') {
      showToast('error', 'Akses Terbatas', 'Halaman Admin hanya dapat diakses oleh akun Administrator.');
      return;
    }
    setCurrentTab(newTab);
    if (newTab === 'chat') {
      setUnreadChatCount(0);
    }
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    saveAuthSession(updated);
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    saveAuthSession(profile);
    setCurrentTab('reach');
  };

  const handleLogout = () => {
    clearAuthSession();
    setUserProfile(null);
    showToast('info', 'Logged Out', 'Anda telah keluar dari akun.');
  };

  // If user is not authenticated, show ONLY the Username & Password AuthPage
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#080b13] text-slate-100 dark">
        <BrutalistToast toasts={toasts} onDismiss={handleDismissToast} />
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onShowToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080b13] text-slate-100 transition-colors duration-300 relative overflow-x-hidden dark">
      {/* Ambient Liquid Glowing Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-emerald-600/15 to-teal-700/5  " />
        <div className="absolute top-[30%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-cyan-600/15 to-blue-700/5  " />
        <div className="absolute -bottom-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-amber-600/10 to-rose-700/5  " />
      </div>

      {/* Floating Liquid Glass Toasts */}
      <BrutalistToast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Compact Floating Glass Header */}
      <div className="relative z-20">
        <Header
          currentTab={currentTab}
          onTabChange={handleTabChange}
          userProfile={userProfile}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onLogout={handleLogout}
        />
      </div>

      {/* Main View Routing Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto relative z-10">
        {currentTab === 'reach' && (
          <ReachPage
            userProfile={userProfile}
            onNavigateTab={handleTabChange}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'chat' && (
          <ChatPage
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'premium' && (
          <PremiumPage
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onNavigateTab={handleTabChange}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'owner' && <OwnerPage onShowToast={showToast} />}

        {currentTab === 'admin' && <AdminPage userProfile={userProfile} onShowToast={showToast} />}

        {currentTab === 'appeal' && <AppealPage userProfile={userProfile} onShowToast={showToast} />}
      </main>

      {/* Floating Compact Liquid Glass Dock Navigation */}
      <div className="relative z-30">
        <FooterNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          unreadChatCount={unreadChatCount}
          userProfile={userProfile}
        />
      </div>
    </div>
  );
}
