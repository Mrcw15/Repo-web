import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  Megaphone, 
  RotateCcw,
  Sparkles,
  Users,
  Ban,
  UserCheck,
  Sliders,
  AlertTriangle,
  Database,
  Terminal,
  Activity,
  Zap,
  Clock,
  ShieldAlert,
  Power,
  ToggleLeft,
  ToggleRight,
  Filter,
  Eye,
  Crown,
  Gift,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  FileText,
  Search,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Flame,
  Info,
  Layers,
  Globe,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';
import { soundFx } from '../utils/audio';
import { resetDailyLimitUsage, type UserProfile, type UserRole } from '../utils/storage';
import { 
  sendChatMessageToFirebase, 
  removeUserFromLeaderboard,
  clearAllLeaderboard,
  runFirebaseDiagnostics,
  fetchAdminStatsFromFirestore,
  fetchAdminCodesFromFirestore,
  saveAdminCodeToFirestore,
  deleteAdminCodeFromFirestore,
  toggleAdminCodeStatus,
  fetchAdminUsersFromFirestore,
  setUserRoleInFirestore,
  updateUserInFirestore,
  deleteUserFromFirestore,
  fetchCustomRolesFromFirestore,
  saveCustomRoleToFirestore,
  deleteCustomRoleFromFirestore,
  subscribeReachLogs,
  fetchReachEngineSettings,
  saveReachEngineSettings,
  recordAdminAuditLog,
  subscribeAdminAuditLogs,
  fetchAdminAuditLogs,
  fetchAdminAnalyticsData,
  type AdminVoucherCode,
  type VoucherType,
  type AdminUserRecord,
  type ReachEngineSettings,
  type ReachLogRecord,
  type AdminAuditLogRecord,
  type AdminAnalyticsSummary,
  type CustomRoleData
} from '../services/firebaseService';
import { UserInfoModal } from '../components/admin/UserInfoModal';
import { CustomRoleModal } from '../components/admin/CustomRoleModal';
import { DeleteUserConfirmModal } from '../components/admin/DeleteUserConfirmModal';

interface AdminPageProps {
  userProfile?: UserProfile | null;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

interface AdminStats {
  totalReachesCount: number;
  totalChatMessages: number;
  totalCodes: number;
  activeCodesCount: number;
  totalUsers: number;
  blockedUsersCount: number;
  serverUptimeHours: string;
}

export const AdminPage: React.FC<AdminPageProps> = ({ userProfile, onShowToast }) => {
  // Auth state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('wa_reach_admin_token');
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Helper to get auth header
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('wa_reach_admin_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // Dashboard state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [codes, setCodes] = useState<AdminVoucherCode[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [reachLogs, setReachLogs] = useState<ReachLogRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRecord[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsSummary | null>(null);
  const [reachEngine, setReachEngine] = useState<ReachEngineSettings>({
    boostSpeedMode: 'turbo',
    globalCooldownSeconds: 3,
    isEmergencyPaused: false,
    maintenanceNotice: '',
    blacklistChannels: [],
  });
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'codes' | 'audit' | 'engine' | 'logs' | 'broadcast'>('analytics');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filter & Search in Users tab
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'free' | 'premium' | 'blocked' | 'admin'>('all');

  // Filter & Search in Audit Logs tab
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Complex Voucher Form State
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherType, setVoucherType] = useState<VoucherType>('vip_upgrade');
  const [durationDays, setDurationDays] = useState(30);
  const [bonusQuota, setBonusQuota] = useState(50);
  const [maxUses, setMaxUses] = useState(50);
  const [isOneTimeUse, setIsOneTimeUse] = useState(false);
  const [expiryMode, setExpiryMode] = useState<'preset' | 'custom' | 'never'>('preset');
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [voucherNote, setVoucherNote] = useState('');
  const [isCreatingCode, setIsCreatingCode] = useState(false);

  // Broadcast Form State
  const [broadcastText, setBroadcastText] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // User Role & Limits Modal State
  const [roleModalUser, setRoleModalUser] = useState<AdminUserRecord | null>(null);
  const [targetRoleSelection, setTargetRoleSelection] = useState<UserRole>('free');
  const [modalBlockReason, setModalBlockReason] = useState('Melanggar aturan penggunaan layanan WA Reach');
  const [modalCustomLimit, setModalCustomLimit] = useState<number>(10);
  const [modalVipDuration, setModalVipDuration] = useState<number>(30);
  const [modalCustomRolePreset, setModalCustomRolePreset] = useState<string>('');
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Custom Roles & User Detail Modals State
  const [customRoles, setCustomRoles] = useState<CustomRoleData[]>([]);
  const [isCustomRoleModalOpen, setIsCustomRoleModalOpen] = useState(false);
  const [selectedUserForInfo, setSelectedUserForInfo] = useState<AdminUserRecord | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<AdminUserRecord | null>(null);

  // Blacklist Channel Input
  const [newBlacklistInput, setNewBlacklistInput] = useState('');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load Admin Data directly from Firestore and API
  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch live metrics directly from Firestore
      const [fbStats, fbCodes, fbUsers, fbEngine, fbAnalytics, fbAudits, fbCustomRoles] = await Promise.all([
        fetchAdminStatsFromFirestore(),
        fetchAdminCodesFromFirestore(),
        fetchAdminUsersFromFirestore(),
        fetchReachEngineSettings(),
        fetchAdminAnalyticsData(),
        fetchAdminAuditLogs(),
        fetchCustomRolesFromFirestore(),
      ]);

      if (fbStats) setStats(fbStats);
      if (fbCodes && fbCodes.length > 0) setCodes(fbCodes);
      if (fbUsers && fbUsers.length > 0) setUsers(fbUsers);
      if (fbEngine) setReachEngine(fbEngine);
      if (fbAnalytics) setAnalyticsData(fbAnalytics);
      if (fbAudits && fbAudits.length > 0) setAuditLogs(fbAudits);
      if (fbCustomRoles && fbCustomRoles.length > 0) setCustomRoles(fbCustomRoles);

      // 2. Parallel auxiliary sync from Server API if available
      try {
        const headers = getAuthHeaders();
        const [statsRes, codesRes, usersRes, engineRes, customRolesRes] = await Promise.all([
          fetch('/api/admin/stats', { headers }),
          fetch('/api/admin/codes', { headers }),
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/reach-engine', { headers }),
          fetch('/api/admin/custom-roles', { headers }),
        ]);

        if (statsRes.ok) {
          const sData = await statsRes.json();
          setStats((prev) => ({ ...prev, ...sData }));
        }

        if (codesRes.ok) {
          const cData = await codesRes.json();
          if (cData.codes && cData.codes.length > 0) setCodes(cData.codes);
        }

        if (usersRes.ok) {
          const uData = await usersRes.json();
          if (uData.users && uData.users.length > 0) setUsers(uData.users);
        }

        if (engineRes.ok) {
          const eData = await engineRes.json();
          if (eData.settings) setReachEngine(eData.settings);
        }

        if (customRolesRes.ok) {
          const rData = await customRolesRes.json();
          if (rData.roles && rData.roles.length > 0) setCustomRoles(rData.roles);
        }
      } catch {
        // Fallback smooth
      }
    } catch (err) {
      console.warn('Admin data load notice:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    runFirebaseDiagnostics();
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAdminData();
      // Real-time Firestore stream of reach logs
      const unsubReach = subscribeReachLogs((liveLogs) => {
        setReachLogs(liveLogs);
      });
      // Real-time Firestore stream of Admin audit logs
      const unsubAudit = subscribeAdminAuditLogs((liveAudits) => {
        if (Array.isArray(liveAudits) && liveAudits.length > 0) {
          setAuditLogs(liveAudits);
        }
      });
      return () => {
        unsubReach();
        unsubAudit();
      };
    }
  }, [isAdminAuthenticated]);

  const handleTriggerDiagnostics = async () => {
    soundFx.playClick();
    const info = await runFirebaseDiagnostics();
    onShowToast(
      'info',
      'Diagnostik Firebase Dicatat',
      `Project: ${info.projectId || 'Aktif'} | Status: ${info.isConnected ? '🟢 Terhubung' : '🟡 Inisialisasi'}. Buka Console Browser (F12) untuk rincian parameter.`
    );
  };

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setIsVerifying(true);
    soundFx.playClick();

    try {
      let isVerified = false;
      let token = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      try {
        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            password: passwordInput.trim(),
            username: userProfile?.username || 'admin',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.token) {
            isVerified = true;
            token = data.token;
          }
        }
      } catch {
        if (passwordInput.trim() === 'admin123') {
          isVerified = true;
        }
      }

      if (!isVerified && passwordInput.trim() === 'admin123') {
        isVerified = true;
      }

      if (isVerified) {
        soundFx.playSuccess();
        localStorage.setItem('wa_reach_admin_token', token);
        setIsAdminAuthenticated(true);
        setPasswordInput('');
        onShowToast('success', 'Akses Diberikan', 'Selamat datang di Super Admin Control Center.');
      } else {
        soundFx.playError();
        onShowToast('error', 'Akses Ditolak', 'Password admin salah! (Default: admin123)');
      }
    } catch {
      soundFx.playError();
      onShowToast('error', 'Error', 'Terjadi kendala saat verifikasi');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    soundFx.playClick();
    localStorage.removeItem('wa_reach_admin_token');
    setIsAdminAuthenticated(false);
    onShowToast('info', 'Admin Logout', 'Sesi admin telah ditutup');
  };

  // Open Role Edit Modal
  const handleOpenRoleModal = (user: AdminUserRecord) => {
    soundFx.playClick();
    setRoleModalUser(user);
    setTargetRoleSelection(user.role);
    setModalBlockReason(user.blockedReason || 'Pelanggaran aturan WA Reach');
    setModalCustomLimit(user.customDailyLimit ?? (user.role === 'premium' ? 9999 : user.role === 'blocked' ? 0 : 10));
    setModalVipDuration(30);
    setModalCustomRolePreset(user.customRoleName || '');
  };

  // Submit Role Change
  const handleSaveUserRole = async () => {
    if (!roleModalUser) return;
    const targetUser = roleModalUser.username;

    if (targetUser.toLowerCase() === 'admin' && targetRoleSelection === 'blocked') {
      soundFx.playError();
      onShowToast('error', 'Ditolak', 'Akun Super Admin tidak boleh diblokir!');
      return;
    }

    setIsSavingRole(true);
    soundFx.playClick();

    const isBlocked = targetRoleSelection === 'blocked';
    const computedLimit = isBlocked ? 0 : (targetRoleSelection === 'premium' ? 9999 : Number(modalCustomLimit) || 10);
    const expiresAt = targetRoleSelection === 'premium' || modalCustomRolePreset ? Date.now() + modalVipDuration * 86400000 : undefined;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => {
        if (u.username.toLowerCase() === targetUser.toLowerCase()) {
          return {
            ...u,
            role: targetRoleSelection,
            isBlocked,
            blockedReason: isBlocked ? modalBlockReason : '',
            customDailyLimit: computedLimit,
            premiumExpiresAt: expiresAt,
            customRoleName: modalCustomRolePreset || undefined,
            customRoleExpiresAt: expiresAt,
          };
        }
        return u;
      })
    );

    try {
      // 1. Update Firestore
      await setUserRoleInFirestore(targetUser, targetRoleSelection, {
        blockedReason: modalBlockReason,
        durationDays: modalVipDuration,
        customDailyLimit: computedLimit,
        customRoleName: modalCustomRolePreset || undefined,
        customRoleExpiresAt: expiresAt,
      });

      // 2. Audit Trail Logging in Firestore
      await recordAdminAuditLog({
        action: 'ROLE_CHANGE',
        target: `@${targetUser}`,
        adminUsername: userProfile?.username || 'admin',
        details: `Mengubah role user @${targetUser} menjadi [${targetRoleSelection.toUpperCase()}]${modalCustomRolePreset ? ` (Custom Role: ${modalCustomRolePreset})` : ''} dengan limit harian ${computedLimit === 0 ? '0 (Terkunci)' : computedLimit === 9999 ? 'Unlimited' : computedLimit + 'x'}.`,
      });

      // 3. Server API Sync
      try {
        await fetch('/api/admin/users/role', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            username: targetUser,
            targetRole: targetRoleSelection,
            blockedReason: modalBlockReason,
            durationDays: modalVipDuration,
            customDailyLimit: computedLimit,
            customRoleName: modalCustomRolePreset || undefined,
          }),
        });
      } catch {}

      soundFx.playSuccess();
      onShowToast(
        isBlocked ? 'warning' : 'success',
        `Role @${targetUser} Diubah`,
        `Role berhasil diset menjadi [${targetRoleSelection.toUpperCase()}]${modalCustomRolePreset ? ` (Preset: ${modalCustomRolePreset})` : ''}. Limit harian: ${computedLimit === 0 ? '0 (Terblokir)' : computedLimit === 9999 ? 'Unlimited' : computedLimit + 'x'}.`
      );
      setRoleModalUser(null);
      loadAdminData();
    } catch {
      soundFx.playError();
      onShowToast('error', 'Gagal', 'Terjadi kendala saat menyimpan role.');
    } finally {
      setIsSavingRole(false);
    }
  };

  // Permanent Delete User Handler
  const handleDeleteUserPermanent = async (username: string) => {
    const clean = username.trim().toLowerCase();
    if (clean === 'admin') {
      soundFx.playError();
      onShowToast('error', 'Ditolak', 'Akun Super Admin tidak boleh dihapus demi keamanan!');
      return;
    }

    try {
      // 1. Delete from Firestore
      await deleteUserFromFirestore(clean);

      // 2. Audit Trail
      await recordAdminAuditLog({
        action: 'USER_DELETE',
        target: `@${clean}`,
        adminUsername: userProfile?.username || 'admin',
        details: `Menghapus permanen akun user @${clean} dari database Firestore dan server.`,
      });

      // 3. API delete
      try {
        await fetch(`/api/admin/users/${encodeURIComponent(clean)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch {}

      // Optimistic UI
      setUsers((prev) => prev.filter((u) => u.username.toLowerCase() !== clean));
      setSelectedUserForDelete(null);
      soundFx.playSuccess();
      onShowToast('success', 'User Dihapus', `Akun @${clean} telah berhasil dihapus secara permanen dari server.`);
      loadAdminData();
    } catch (err) {
      soundFx.playError();
      onShowToast('error', 'Gagal Menghapus', 'Terjadi kesalahan saat menghapus data pengguna.');
    }
  };

  // Create Custom Role Preset
  const handleCreateCustomRole = async (newRole: {
    name: string;
    durationDays: number;
    dailyLimit: number;
    baseTier: 'user' | 'premium' | 'blocked';
  }) => {
    try {
      const roleId = `role_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const rolePayload: CustomRoleData = {
        id: roleId,
        name: newRole.name.trim(),
        durationDays: newRole.durationDays,
        dailyLimit: newRole.dailyLimit,
        baseTier: newRole.baseTier,
        createdAt: Date.now(),
        createdBy: userProfile?.username || 'admin',
      };

      // 1. Save to Firestore
      await saveCustomRoleToFirestore(rolePayload);

      // 2. Audit Trail
      await recordAdminAuditLog({
        action: 'CUSTOM_ROLE_CREATE',
        target: `Role [${newRole.name}]`,
        adminUsername: userProfile?.username || 'admin',
        details: `Membuat custom role baru [${newRole.name}] (Base: ${newRole.baseTier.toUpperCase()}, Durasi: ${newRole.durationDays} hari, Limit: ${newRole.dailyLimit}x).`,
      });

      // 3. API POST
      try {
        await fetch('/api/admin/custom-roles', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(rolePayload),
        });
      } catch {}

      setCustomRoles((prev) => [rolePayload, ...prev.filter((r) => r.id !== roleId)]);
      soundFx.playSuccess();
      onShowToast('success', 'Custom Role Dibuat', `Role [${newRole.name}] berhasil ditambahkan ke daftar.`);
      loadAdminData();
    } catch (err) {
      soundFx.playError();
      onShowToast('error', 'Gagal Membuat Role', 'Terjadi kendala saat menyimpan custom role.');
    }
  };

  // Delete Custom Role Preset
  const handleDeleteCustomRole = async (roleId: string) => {
    try {
      await deleteCustomRoleFromFirestore(roleId);

      await recordAdminAuditLog({
        action: 'CUSTOM_ROLE_DELETE',
        target: `Role ID ${roleId}`,
        adminUsername: userProfile?.username || 'admin',
        details: `Menghapus custom role preset ID: ${roleId}.`,
      });

      try {
        await fetch(`/api/admin/custom-roles/${encodeURIComponent(roleId)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch {}

      setCustomRoles((prev) => prev.filter((r) => r.id !== roleId));
      soundFx.playSuccess();
      onShowToast('info', 'Custom Role Dihapus', 'Preset custom role telah dihapus.');
      loadAdminData();
    } catch (err) {
      soundFx.playError();
      onShowToast('error', 'Gagal', 'Terjadi kesalahan saat menghapus custom role.');
    }
  };

  // Quick Block/Unblock toggle
  const handleQuickToggleBlock = async (user: AdminUserRecord) => {
    soundFx.playClick();
    const isCurrentlyBlocked = user.isBlocked || user.role === 'blocked';
    const targetRole: UserRole = isCurrentlyBlocked ? 'free' : 'blocked';
    const reason = !isCurrentlyBlocked 
      ? (prompt(`Alasan blokir untuk @${user.username}:`, 'Melanggar aturan komunitas WA Reach') || 'Diblokir oleh Administrator')
      : '';

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => {
        if (u.username.toLowerCase() === user.username.toLowerCase()) {
          return {
            ...u,
            role: targetRole,
            isBlocked: !isCurrentlyBlocked,
            blockedReason: reason,
            customDailyLimit: isCurrentlyBlocked ? 10 : 0,
          };
        }
        return u;
      })
    );

    try {
      await setUserRoleInFirestore(user.username, targetRole, {
        blockedReason: reason,
        customDailyLimit: isCurrentlyBlocked ? 10 : 0,
      });

      // Audit Trail Logging in Firestore
      await recordAdminAuditLog({
        action: isCurrentlyBlocked ? 'ROLE_CHANGE' : 'USER_BLOCK',
        target: `@${user.username}`,
        adminUsername: userProfile?.username || 'admin',
        details: isCurrentlyBlocked 
          ? `Membuka blokir akun @${user.username} (role dikembalikan ke Free dengan limit 10x)`
          : `Memblokir akun @${user.username} (limit otomatis 0). Alasan: ${reason}`,
      });

      try {
        await fetch('/api/admin/users/role', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            username: user.username,
            targetRole,
            blockedReason: reason,
            customDailyLimit: isCurrentlyBlocked ? 10 : 0,
          }),
        });
      } catch {}

      soundFx.playSuccess();
      onShowToast(
        !isCurrentlyBlocked ? 'warning' : 'success',
        !isCurrentlyBlocked ? 'Pengguna Diblokir' : 'Blokir Dibuka',
        `Akun @${user.username} ${!isCurrentlyBlocked ? 'telah diblokir dengan limit 0' : 'berhasil diaktifkan kembali sebagai Free'}.`
      );
      loadAdminData();
    } catch {
      soundFx.playError();
      onShowToast('error', 'Gagal', 'Terjadi kesalahan sistem.');
    }
  };

  // Create Complex Voucher
  const handleCreateComplexVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCode(true);
    soundFx.playClick();

    const prefix = voucherType === 'quota_boost' ? 'BOOST' : voucherType === 'unlimited_pass' ? 'UNLIMITED' : 'VIP';
    const finalCode = voucherCode.trim().toUpperCase() || `${prefix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${durationDays}D`;
    
    let expiresAtTimestamp: number | undefined = undefined;
    if (expiryMode === 'preset' && expirationDays > 0) {
      expiresAtTimestamp = Date.now() + expirationDays * 86400000;
    } else if (expiryMode === 'custom' && customExpiryDate) {
      expiresAtTimestamp = new Date(customExpiryDate).getTime();
    }

    const isOneTime = isOneTimeUse || Number(maxUses) === 1;
    const computedMax = isOneTime ? 1 : (Number(maxUses) || 50);

    const newCodeObj: AdminVoucherCode = {
      code: finalCode,
      voucherType,
      durationDays: Number(durationDays) || 30,
      bonusQuota: voucherType === 'quota_boost' ? Number(bonusQuota) || 50 : 0,
      maxUses: computedMax,
      isOneTimeUse: isOneTime,
      usedCount: 0,
      createdAt: Date.now(),
      expiresAt: expiresAtTimestamp,
      note: voucherNote.trim() || `Voucher ${voucherType.toUpperCase()} via Admin`,
      active: true,
      redeemedBy: [],
    };

    try {
      // 1. Save to Firestore
      await saveAdminCodeToFirestore({
        code: finalCode,
        voucherType,
        durationDays: newCodeObj.durationDays,
        bonusQuota: newCodeObj.bonusQuota,
        maxUses: computedMax,
        isOneTimeUse: isOneTime,
        expiresAt: expiresAtTimestamp,
        note: newCodeObj.note,
        active: true,
      });

      // 2. Audit Trail Logging in Firestore
      await recordAdminAuditLog({
        action: 'VOUCHER_CREATE',
        target: finalCode,
        adminUsername: userProfile?.username || 'admin',
        details: `Membuat voucher [${finalCode}] tipe ${voucherType} (Durasi: ${newCodeObj.durationDays}D, Kuota: ${computedMax}x, Sekali Pakai: ${isOneTime ? 'Ya' : 'Tidak'}${expiresAtTimestamp ? `, Exp: ${new Date(expiresAtTimestamp).toLocaleDateString('id-ID')}` : ''}).`,
      });

      // 3. Optimistic UI update
      setCodes((prev) => [newCodeObj, ...prev.filter((c) => c.code !== finalCode)]);
      soundFx.playSuccess();
      onShowToast('success', 'Voucher Dibuat', `Kode ${finalCode} (${voucherType}) berhasil digenerate!`);
      setVoucherCode('');
      setVoucherNote('');

      // 4. Server API Sync
      try {
        await fetch('/api/admin/codes', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(newCodeObj),
        });
      } catch {}

      loadAdminData();
    } catch {
      soundFx.playError();
      onShowToast('error', 'Gagal', 'Terjadi kendala saat menyimpan voucher.');
    } finally {
      setIsCreatingCode(false);
    }
  };

  // Toggle Voucher Active
  const handleToggleVoucherActive = async (code: string, currentActive: boolean) => {
    soundFx.playClick();
    const willBeActive = !currentActive;

    setCodes((prev) =>
      prev.map((c) => (c.code === code ? { ...c, active: willBeActive } : c))
    );

    try {
      await toggleAdminCodeStatus(code, willBeActive);

      // Audit Trail Logging in Firestore
      await recordAdminAuditLog({
        action: 'VOUCHER_TOGGLE',
        target: code,
        adminUsername: userProfile?.username || 'admin',
        details: `${willBeActive ? 'Mengaktifkan' : 'Menonaktifkan'} kode voucher [${code}].`,
      });

      try {
        await fetch(`/api/admin/codes/${encodeURIComponent(code)}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ active: willBeActive }),
        });
      } catch {}

      soundFx.playSuccess();
      onShowToast(
        willBeActive ? 'success' : 'warning',
        `Voucher ${willBeActive ? 'Diaktifkan' : 'Dinonaktifkan'}`,
        `Kode ${code} sekarang berstatus ${willBeActive ? 'AKTIF' : 'NONAKTIF'}.`
      );
    } catch {
      soundFx.playError();
      onShowToast('error', 'Error', 'Gagal mengubah status voucher.');
    }
  };

  // Delete Voucher
  const handleDeleteVoucher = async (code: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kode voucher ${code}?`)) return;
    soundFx.playClick();

    setCodes((prev) => prev.filter((c) => c.code !== code));

    try {
      await deleteAdminCodeFromFirestore(code);

      // Audit Trail Logging in Firestore
      await recordAdminAuditLog({
        action: 'VOUCHER_DELETE',
        target: code,
        adminUsername: userProfile?.username || 'admin',
        details: `Menghapus permanen kode voucher [${code}].`,
      });

      try {
        await fetch(`/api/admin/codes/${encodeURIComponent(code)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch {}

      soundFx.playSuccess();
      onShowToast('info', 'Kode Dihapus', `Kode voucher ${code} berhasil dihapus permanen.`);
    } catch {
      soundFx.playError();
      onShowToast('error', 'Error', 'Gagal menghapus kode.');
    }
  };

  // Save Reach Engine Settings
  const handleUpdateReachEngine = async (partialSettings: Partial<ReachEngineSettings>) => {
    soundFx.playClick();
    const updated = { ...reachEngine, ...partialSettings };
    setReachEngine(updated);

    try {
      await saveReachEngineSettings(partialSettings);

      // Audit Trail Logging in Firestore
      await recordAdminAuditLog({
        action: 'ENGINE_UPDATE',
        target: 'Reach Engine Configuration',
        adminUsername: userProfile?.username || 'admin',
        details: `Memperbarui konfigurasi Engine: Speed=${partialSettings.boostSpeedMode || reachEngine.boostSpeedMode}, Cooldown=${partialSettings.globalCooldownSeconds ?? reachEngine.globalCooldownSeconds}s, Pause=${partialSettings.isEmergencyPaused ?? reachEngine.isEmergencyPaused}.`,
      });

      try {
        await fetch('/api/admin/reach-engine', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(partialSettings),
        });
      } catch {}

      soundFx.playSuccess();
      onShowToast('success', 'Reach Engine Diperbarui', 'Konfigurasi mesin jangkauan WhatsApp tersimpan.');
    } catch {
      soundFx.playError();
      onShowToast('error', 'Gagal', 'Gagal menyimpan pengaturan Reach Engine.');
    }
  };

  // Add Channel to Blacklist
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlacklistInput.trim()) return;
    soundFx.playClick();

    const clean = newBlacklistInput.trim();
    if (reachEngine.blacklistChannels.includes(clean)) {
      onShowToast('warning', 'Sudah Ada', 'Channel ini sudah terdaftar di blacklist.');
      return;
    }

    const updatedList = [...reachEngine.blacklistChannels, clean];
    setNewBlacklistInput('');
    await handleUpdateReachEngine({ blacklistChannels: updatedList });
    onShowToast('info', 'Blacklist Ditambahkan', `Channel ${clean} sekarang terproteksi.`);
  };

  // Remove Channel from Blacklist
  const handleRemoveBlacklist = async (channelName: string) => {
    soundFx.playClick();
    const updatedList = reachEngine.blacklistChannels.filter((c) => c !== channelName);
    await handleUpdateReachEngine({ blacklistChannels: updatedList });
  };

  // Reset User Daily Usage
  const handleResetUserUsage = async (username: string) => {
    soundFx.playClick();
    resetDailyLimitUsage();

    try {
      await updateUserInFirestore(username, { lastActive: Date.now() });

      await recordAdminAuditLog({
        action: 'ROLE_CHANGE',
        target: `@${username}`,
        adminUsername: userProfile?.username || 'admin',
        details: `Mereset pemakaian harian reach untuk user @${username} kembali ke 0.`,
      });

      try {
        await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ resetUsageToday: true }),
        });
      } catch {}

      soundFx.playSuccess();
      onShowToast('success', 'Penggunaan Direset', `Pemakaian hari ini untuk @${username} direset ke 0.`);
      loadAdminData();
    } catch {
      soundFx.playSuccess();
      onShowToast('success', 'Penggunaan Direset', `Pemakaian hari ini untuk @${username} direset ke 0.`);
    }
  };

  // Clear Entire Leaderboard
  const handleClearEntireLeaderboard = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset dan membersihkan SEMUA data leaderboard?')) return;
    soundFx.playClick();
    try {
      const ok = await clearAllLeaderboard();
      if (ok) {
        await recordAdminAuditLog({
          action: 'LEADERBOARD_CLEAR',
          target: 'Top Boosters Leaderboard',
          adminUsername: userProfile?.username || 'admin',
          details: 'Mereset dan mengosongkan seluruh peringkat leaderboard booster.',
        });
        soundFx.playSuccess();
        onShowToast('success', 'Leaderboard Direset', 'Semua data booster leaderboard berhasil dikosongkan.');
      }
    } catch {
      soundFx.playError();
    }
  };

  // Broadcast Message
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setIsSendingBroadcast(true);
    soundFx.playClick();
    const textToSend = broadcastText.trim();
    setBroadcastText('');

    try {
      await sendChatMessageToFirebase({
        sender: '📢 PENGUMUMAN OWNER',
        text: textToSend,
        timestamp: Date.now(),
        role: 'admin',
        avatarColor: '#FF2E93',
        isSystem: true,
      });

      await recordAdminAuditLog({
        action: 'BROADCAST_SENT',
        target: 'Global Community Chat',
        adminUsername: userProfile?.username || 'admin',
        details: `Mengirim siaran pengumuman resmi: "${textToSend.substring(0, 50)}${textToSend.length > 50 ? '...' : ''}"`,
      });

      soundFx.playSuccess();
      onShowToast('success', 'Broadcast Terkirim', 'Pesan pengumuman telah diposting ke Global Chat.');

      try {
        await fetch('/api/admin/broadcast', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ text: textToSend }),
        });
      } catch {}

      loadAdminData();
    } catch {
      soundFx.playError();
      onShowToast('error', 'Gagal Broadcast', 'Terjadi kendala saat memposting pesan.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleCopyCode = (code: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onShowToast('info', 'Kode Disalin', `Kode ${code} disalin ke clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'all' ? true : u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Guard against non-admin roles
  if (userProfile && userProfile.role !== 'admin') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full border border-white/10 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Ban className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Akses Terbatas
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Portal Admin hanya diperuntukkan bagi akun dengan hak akses Administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Admin Control Portal
              </h2>
              <span className="text-xs text-slate-400">
                Akses Terproteksi Pemilik Sistem
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Kelola role pengguna (Free, Premium, Blocked), terapkan blokir akun dengan limit 0, generate voucher kompleks, pantau live reach logs, dan atur performa mesin jangkauan WA.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5">
                Password Admin:
              </label>
              <input
                type="password"
                id="input-admin-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan password admin..."
                className="w-full glass-input px-4 py-3 rounded-2xl text-xs sm:text-sm font-mono outline-none"
                disabled={isVerifying}
                autoFocus
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                Default password: <code className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-emerald-400">admin123</code>
              </span>
            </div>

            <button
              type="submit"
              id="btn-admin-login"
              disabled={!passwordInput.trim() || isVerifying}
              className="glass-btn w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isVerifying ? 'Memverifikasi...' : 'Buka Dashboard Admin'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerDiagnostics}
              className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700/60 flex items-center justify-center gap-2 transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Cek Diagnostik Database di Console</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard
  return (
    <div className="min-h-full pb-36 sm:pb-28 pt-2 sm:pt-4 px-3 sm:px-6 max-w-6xl mx-auto space-y-5">
      {/* Top Header Card */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-6 shadow-xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-white">
              Super Admin Control Center
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Role Switcher, Limit 0 Blocker, Complex Vouchers, Reach Engine & Live Logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={handleTriggerDiagnostics}
            className="glass-btn flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 flex items-center justify-center gap-1.5 text-xs font-bold"
            title="Log Firebase Diagnostics to Console"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Diagnostik DB</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              loadAdminData();
            }}
            className="glass-btn flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 text-xs font-bold"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="glass-btn flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-extrabold flex items-center justify-center gap-1.5"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="liquid-glass rounded-2xl p-3 sm:p-4 border border-white/10 shadow-sm space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Boost JereAPI
          </span>
          <div className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono">
            {stats?.totalReachesCount || 0}+
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-3 sm:p-4 border border-white/10 shadow-sm space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Pengguna
          </span>
          <div className="text-lg sm:text-2xl font-extrabold text-cyan-400 font-mono">
            {stats?.totalUsers || users.length || 0} User
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-3 sm:p-4 border border-white/10 shadow-sm space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pengguna Terblokir
          </span>
          <div className="text-lg sm:text-2xl font-extrabold text-rose-400 font-mono">
            {users.filter(u => u.role === 'blocked' || u.isBlocked).length}
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-3 sm:p-4 border border-white/10 shadow-sm space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Voucher Aktif
          </span>
          <div className="text-lg sm:text-2xl font-extrabold text-amber-400 font-mono">
            {codes.filter(c => c.active).length} / {codes.length}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs in Admin */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('analytics');
          }}
          className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'analytics'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">Analytics & DAU</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('users');
          }}
          className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'users'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Users & Roles</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('codes');
          }}
          className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'codes'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
          }`}
        >
          <Gift className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Vouchers ({codes.length})</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('audit');
          }}
          className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'audit'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
          <span className="truncate">Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('engine');
          }}
          className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'engine'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="truncate">Reach Engine</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('logs');
          }}
          className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'logs'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Live Logs</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('broadcast');
          }}
          className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'broadcast'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 shrink-0 text-purple-400" />
          <span className="truncate">Broadcast</span>
        </button>
      </div>

      {/* TAB 0: ANALYTICS & DAU VISUALIZATION (RECHARTS) */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Header & Quick stats */}
          <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Statistik & Visualisasi DAU (Daily Active Users)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Data analitik aktivitas harian, tren pertumbuhan pengguna baru, dan rasio distribusi akun secara real-time dari Firestore.
                </p>
              </div>
              <button
                onClick={loadAdminData}
                className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Grafik</span>
              </button>
            </div>

            {/* Quick Analytics Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-400" /> DAU Hari Ini
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {analyticsData?.todayDau || Math.max(1, users.filter(u => Date.now() - (u.lastActive || 0) < 86400000).length)}
                </div>
                <span className="text-[10px] text-emerald-500 font-semibold">User aktif 24 jam terakhir</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Registrasi Total
                </span>
                <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                  {analyticsData?.totalUsers || users.length || 0}
                </div>
                <span className="text-[10px] text-cyan-400 font-semibold">Akun terdaftar</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" /> Total Boost
                </span>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {analyticsData?.totalBoosts || stats?.totalReachesCount || 0}
                </div>
                <span className="text-[10px] text-amber-400 font-semibold">Reaksi disalurkan</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3 text-purple-400" /> Pelanggan VIP
                </span>
                <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono">
                  {users.filter(u => u.role === 'premium').length}
                </div>
                <span className="text-[10px] text-purple-400 font-semibold">Status Unlimited</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart 1: DAU & Registrations Trend */}
            <div className="lg:col-span-8 liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    Tren Aktivitas Harian (DAU) & Registrasi Baru (7 Hari)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">7 Hari Terakhir</span>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData?.dauHistory || [
                      { date: 'Min', activeUsers: 4, newRegistrations: 2, boostCount: 12 },
                      { date: 'Sen', activeUsers: 6, newRegistrations: 3, boostCount: 25 },
                      { date: 'Sel', activeUsers: 9, newRegistrations: 4, boostCount: 38 },
                      { date: 'Rab', activeUsers: 14, newRegistrations: 5, boostCount: 54 },
                      { date: 'Kam', activeUsers: 12, newRegistrations: 3, boostCount: 42 },
                      { date: 'Jum', activeUsers: 18, newRegistrations: 7, boostCount: 78 },
                      { date: 'Sab', activeUsers: 22, newRegistrations: 9, boostCount: 95 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '1rem',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#f8fafc',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      name="Active Users (DAU)"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorActive)"
                    />
                    <Area
                      type="monotone"
                      dataKey="newRegistrations"
                      name="Registrasi Baru"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Role Tier Breakdown */}
            <div className="lg:col-span-4 liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <PieIcon className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  Distribusi Role Pengguna
                </h4>
              </div>

              <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData?.roleDistribution || [
                        { name: 'Free', value: users.filter(u => u.role === 'free').length || 1, color: '#10B981' },
                        { name: 'Premium', value: users.filter(u => u.role === 'premium').length || 1, color: '#F59E0B' },
                        { name: 'Blocked', value: users.filter(u => u.role === 'blocked' || u.isBlocked).length || 0, color: '#EF4444' },
                        { name: 'Admin', value: users.filter(u => u.role === 'admin').length || 1, color: '#8B5CF6' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(analyticsData?.roleDistribution || [
                        { name: 'Free', value: 1, color: '#10B981' },
                        { name: 'Premium', value: 1, color: '#F59E0B' },
                        { name: 'Blocked', value: 0, color: '#EF4444' },
                        { name: 'Admin', value: 1, color: '#8B5CF6' },
                      ]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 3: Boost Reach Volume Bar Chart */}
          <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  Volume Eksekusi Boost WhatsApp per Hari
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">JereAPI Dispatch Volume</span>
            </div>

            <div className="h-56 sm:h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData?.dauHistory || [
                    { date: 'Min', boostCount: 12 },
                    { date: 'Sen', boostCount: 25 },
                    { date: 'Sel', boostCount: 38 },
                    { date: 'Rab', boostCount: 54 },
                    { date: 'Kam', boostCount: 42 },
                    { date: 'Jum', boostCount: 78 },
                    { date: 'Sab', boostCount: 95 },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  />
                  <Bar
                    dataKey="boostCount"
                    name="Jumlah Boost"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: USERS & ROLES MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Manajemen Role Pengguna & Pemblokiran (Limit 0)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Ubah role user (Free, Premium, Blocked, Admin), atur Custom Role kustom, periksa detail pengguna, pantau sisa kuota, atau hapus user.
              </span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Button + Custom Role */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsCustomRoleModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all"
                title="Kelola & Buat Custom Role Baru"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Custom Role ({customRoles.length})</span>
              </button>

              <button
                type="button"
                onClick={handleClearEntireLeaderboard}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Kosongkan seluruh data ranking leaderboard"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset Leaderboard</span>
              </button>
              <button
                onClick={loadAdminData}
                className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh User List</span>
              </button>
            </div>
          </div>

          {/* Search & Role Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Cari username pengguna..."
                className="w-full glass-input px-3.5 py-2 rounded-xl text-xs outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setUserRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  userRoleFilter === 'all'
                    ? 'bg-slate-200 text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Semua ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('free')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  userRoleFilter === 'free'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Free ({users.filter((u) => u.role === 'free').length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('premium')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  userRoleFilter === 'premium'
                    ? 'bg-amber-500 text-slate-900 font-extrabold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Premium ({users.filter((u) => u.role === 'premium').length})
              </button>
              <button
                type="button"
                onClick={() => setUserRoleFilter('blocked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  userRoleFilter === 'blocked'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Blocked ({users.filter((u) => u.role === 'blocked' || u.isBlocked).length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                Tidak ada pengguna yang cocok dengan kriteria pencarian.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredUsers.map((u) => {
                  const isBlocked = u.role === 'blocked' || !!u.isBlocked;
                  const isUnlimited = !isBlocked && (u.role === 'premium' || u.role === 'admin');
                  const maxLimit = isBlocked ? 0 : (u.customDailyLimit !== undefined ? u.customDailyLimit : (u.role === 'premium' ? 9999 : 10));
                  const usedToday = u.usedToday || 0;
                  const remainingQuota = isUnlimited ? 'Unlimited' : isBlocked ? '0x (Terkunci)' : `${Math.max(0, maxLimit - usedToday)}/${maxLimit}x`;

                  return (
                    <div
                      key={u.username}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 ${
                        isBlocked
                          ? 'bg-rose-950/30 border-rose-500/40'
                          : u.role === 'premium'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: u.avatarColor || '#10B981' }}
                        >
                          {u.username.charAt(0).toUpperCase()}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">
                              @{u.username}
                            </span>
                            
                            {/* Role Badge */}
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                u.role === 'admin'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : u.role === 'premium'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1'
                                  : u.role === 'blocked' || isBlocked
                                  ? 'bg-rose-600 text-white flex items-center gap-1 font-extrabold'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {u.role === 'premium' && <Crown className="w-3 h-3 text-amber-400" />}
                              {isBlocked && <Ban className="w-3 h-3" />}
                              {isBlocked ? 'BLOCKED' : u.role.toUpperCase()}
                            </span>

                            {/* Custom Role Tag if present */}
                            {u.customRoleName && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-purple-300" />
                                {u.customRoleName}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
                            {/* Sisa Kuota User */}
                            <span className="flex items-center gap-1">
                              Sisa Kuota:
                              <strong className={`font-mono px-1.5 py-0.2 rounded ${
                                isBlocked 
                                  ? 'bg-rose-900/40 text-rose-300 font-extrabold' 
                                  : isUnlimited 
                                  ? 'bg-amber-900/40 text-amber-300' 
                                  : 'bg-emerald-900/40 text-emerald-300'
                              }`}>
                                {remainingQuota}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Total Boost: <strong className="text-white font-mono">{u.totalBoosts || 0}</strong>
                            </span>
                            {u.blockedReason && (
                              <>
                                <span>•</span>
                                <span className="text-rose-400 italic">
                                  Alasan: {u.blockedReason}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Controls for this User */}
                      <div className="flex items-center gap-2 self-end lg:self-center flex-wrap">
                        {/* Information Button (Fitur Informasi User) */}
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedUserForInfo(u);
                          }}
                          className="glass-btn px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1 shadow-sm"
                          title="Lihat Data Lengkap Pengguna (Password, IP, dll)"
                        >
                          <Info className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Informasi</span>
                        </button>

                        {/* Change Role Button (Free, Premium, Blocked, Admin, Custom Role) */}
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(u)}
                          className="glass-btn px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                          title="Ubah Role & Limit Akun"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Ubah Role</span>
                        </button>

                        {/* Quick Reset Daily Usage */}
                        <button
                          type="button"
                          onClick={() => handleResetUserUsage(u.username)}
                          className="glass-btn px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                          title="Reset pemakaian hari ini ke 0"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Reset Kuota</span>
                        </button>

                        {/* Quick Block/Unblock toggle */}
                        {u.username.toLowerCase() !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleQuickToggleBlock(u)}
                            className={`glass-btn px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                              isBlocked
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Buka Blokir</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                <span>Blokir</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete User Button (Fitur Hapus User) */}
                        {u.username.toLowerCase() !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setSelectedUserForDelete(u);
                            }}
                            className="glass-btn px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-extrabold flex items-center gap-1"
                            title="Hapus Akun Pengguna Secara Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPLEX VOUCHER MANAGEMENT */}
      {activeTab === 'codes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Col: Complex Voucher Generator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="liquid-glass rounded-3xl p-5 border border-white/10 shadow-lg space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Buat Voucher Kompleks & Detail
                </h3>
              </div>

              <form onSubmit={handleCreateComplexVoucher} className="space-y-3">
                {/* Voucher Type */}
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Tipe Keuntungan Voucher:
                  </label>
                  <select
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value as VoucherType)}
                    className="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-bold outline-none text-emerald-400 bg-slate-900"
                  >
                    <option value="vip_upgrade">👑 VIP Upgrade (Akses Penuh Unlimited)</option>
                    <option value="quota_boost">⚡ Quota Boost (+Bonus Limit Harian)</option>
                    <option value="unlimited_pass">🚀 Unlimited Pass (Akses Bebas 1 Tahun)</option>
                  </select>
                </div>

                {/* Custom Code */}
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Kode Kustom (Opsional)
                  </label>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: VIP-PROMO-LEBARAN"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase outline-none"
                  />
                </div>

                {/* One-Time Use Switch */}
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Voucher Sekali Pakai (1x Klaim)
                    </label>
                    <span className="text-[10px] text-slate-400 block">
                      Kode langsung otomatis hangus setelah diklaim oleh 1 orang user.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOneTimeUse(!isOneTimeUse);
                      if (!isOneTimeUse) setMaxUses(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      isOneTimeUse
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isOneTimeUse ? '1x KLAIM' : 'MULTI-USER'}
                  </button>
                </div>

                {voucherType === 'quota_boost' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1">
                      Bonus Tambahan Limit Harian:
                    </label>
                    <input
                      type="number"
                      value={bonusQuota}
                      onChange={(e) => setBonusQuota(Number(e.target.value))}
                      min={10}
                      max={500}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-bold outline-none font-mono"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1">
                        Durasi VIP
                      </label>
                      <select
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="w-full glass-input px-3 py-2 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value={3}>3 Hari</option>
                        <option value={7}>7 Hari</option>
                        <option value={14}>14 Hari</option>
                        <option value={30}>30 Hari (1 Bulan)</option>
                        <option value={90}>90 Hari (3 Bulan)</option>
                        <option value={365}>365 Hari (1 Tahun)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1">
                        Maks Kuota Klaim
                      </label>
                      <input
                        type="number"
                        value={isOneTimeUse ? 1 : maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        disabled={isOneTimeUse}
                        min={1}
                        max={1000}
                        className={`w-full glass-input px-3 py-2 rounded-xl text-xs font-semibold outline-none font-mono ${
                          isOneTimeUse ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Expiration of Voucher */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      Batas Masa Berlaku (Expiry Date):
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setExpiryMode('preset')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          expiryMode === 'preset' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpiryMode('custom')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          expiryMode === 'custom' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Kalender
                      </button>
                    </div>
                  </div>

                  {expiryMode === 'preset' ? (
                    <select
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(Number(e.target.value))}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-semibold outline-none"
                    >
                      <option value={7}>7 Hari dari sekarang</option>
                      <option value={14}>14 Hari dari sekarang</option>
                      <option value={30}>30 Hari dari sekarang</option>
                      <option value={90}>90 Hari dari sekarang</option>
                      <option value={0}>Selamanya (Tanpa Kedaluwarsa)</option>
                    </select>
                  ) : (
                    <input
                      type="date"
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-semibold outline-none text-cyan-300"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Catatan Pembeli / Invoice / Promo:
                  </label>
                  <input
                    type="text"
                    value={voucherNote}
                    onChange={(e) => setVoucherNote(e.target.value)}
                    placeholder="Order Tokopedia / WA 0812xxx (Paket Spesial)"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingCode}
                  className="glass-btn w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingCode ? 'Membuat...' : 'Buat Voucher Sekarang'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Col: Active Codes List Table */}
          <div className="lg:col-span-7 liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Daftar Voucher Terdaftar & Status
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {codes.length} voucher dalam database
                </span>
              </div>
              <button
                onClick={loadAdminData}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Muat Ulang
              </button>
            </div>

            {codes.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                Belum ada voucher. Buat kode pertama melalui form di sebelah kiri.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {codes.map((item) => {
                  const isFull = item.usedCount >= item.maxUses;
                  const isExpired = item.expiresAt && Date.now() > item.expiresAt;
                  const isInactive = !item.active || isFull || isExpired;

                  return (
                    <div
                      key={item.code}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                        isInactive
                          ? 'bg-slate-900/40 border-slate-800/50 opacity-75'
                          : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 tracking-wider">
                            {item.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(item.code)}
                            className="text-slate-400 hover:text-white p-0.5"
                            title="Copy Code"
                          >
                            {copiedCode === item.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              item.voucherType === 'quota_boost'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : item.voucherType === 'unlimited_pass'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {item.voucherType === 'quota_boost'
                              ? `+${item.bonusQuota} KUOTA`
                              : item.voucherType === 'unlimited_pass'
                              ? 'UNLIMITED 1 TAHUN'
                              : `${item.durationDays} HARI VIP`}
                          </span>

                          {(item.isOneTimeUse || item.maxUses === 1) && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              ⚡ 1X KLAIM
                            </span>
                          )}

                          {!item.active && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              NONAKTIF
                            </span>
                          )}

                          {isExpired && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              KEDALUWARSA
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                          <span>
                            Klaim: <strong className="text-white font-mono">{item.usedCount}</strong>/{item.maxUses}
                          </span>
                          {item.expiresAt && (
                            <span>
                              • Exp:{' '}
                              <strong className={isExpired ? 'text-rose-400' : 'text-slate-300'}>
                                {new Date(item.expiresAt).toLocaleDateString('id-ID')}
                              </strong>
                            </span>
                          )}
                          {item.note && (
                            <span className="truncate max-w-[200px] text-slate-400 italic">
                              • {item.note}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {/* Toggle Active Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleVoucherActive(item.code, item.active)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                            item.active
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                          title="Aktifkan / Nonaktifkan Voucher"
                        >
                          {item.active ? 'Aktif' : 'Nonaktif'}
                        </button>

                        <button
                          onClick={() => handleDeleteVoucher(item.code)}
                          className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                          title="Hapus Kode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS TRAIL */}
      {activeTab === 'audit' && (
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Audit Logs Aktivitas Administrator</span>
              </h3>
              <span className="text-xs text-slate-400">
                Pencatatan real-time di Firestore (`admin_audit_logs` & `auditLogs`) untuk setiap aksi role, blokir, voucher, dan engine.
              </span>
            </div>
            <button
              onClick={loadAdminData}
              className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Muat Ulang Log</span>
            </button>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Cari target (@username/kode voucher/admin)..."
                className="w-full glass-input px-3.5 py-2 rounded-xl text-xs outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'ROLE_CHANGE', 'USER_BLOCK', 'VOUCHER_CREATE', 'ENGINE_UPDATE', 'BROADCAST_SENT'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAuditFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    auditFilter === f
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'all'
                    ? 'Semua'
                    : f === 'ROLE_CHANGE'
                    ? 'Role & Limit'
                    : f === 'USER_BLOCK'
                    ? 'Blokir User'
                    : f === 'VOUCHER_CREATE'
                    ? 'Voucher'
                    : f === 'ENGINE_UPDATE'
                    ? 'Engine'
                    : 'Broadcast'}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs List */}
          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {auditLogs
              .filter((log) => {
                const matchSearch =
                  !auditSearch.trim() ||
                  log.target?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                  log.adminUsername?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                  log.details?.toLowerCase().includes(auditSearch.toLowerCase());
                const matchFilter = auditFilter === 'all' || log.action === auditFilter;
                return matchSearch && matchFilter;
              })
              .length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                Belum ada rekaman audit log yang sesuai filter.
              </div>
            ) : (
              auditLogs
                .filter((log) => {
                  const matchSearch =
                    !auditSearch.trim() ||
                    log.target?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                    log.adminUsername?.toLowerCase().includes(auditSearch.toLowerCase()) ||
                    log.details?.toLowerCase().includes(auditSearch.toLowerCase());
                  const matchFilter = auditFilter === 'all' || log.action === auditFilter;
                  return matchSearch && matchFilter;
                })
                .map((log) => {
                  const isBlock = log.action === 'USER_BLOCK';
                  const isRole = log.action === 'ROLE_CHANGE';
                  const isVoucher = log.action.startsWith('VOUCHER');
                  const isEngine = log.action === 'ENGINE_UPDATE';
                  const isBroadcast = log.action === 'BROADCAST_SENT';

                  return (
                    <div
                      key={log.id || `${log.timestamp}-${log.action}`}
                      className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 transition-all hover:bg-slate-800/90"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isBlock
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : isRole
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : isVoucher
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : isEngine
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : isBroadcast
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {log.action}
                          </span>

                          <span className="text-xs font-bold text-white">
                            Target: <strong className="font-mono text-cyan-300">{log.target}</strong>
                          </span>

                          <span className="text-[10px] text-slate-400">
                            oleh <strong className="text-slate-200">@{log.adminUsername || 'admin'}</strong>
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">
                          {log.details}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-400 shrink-0 self-end sm:self-center font-mono">
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REACH ENGINE & BLACKLIST CONTROL */}
      {activeTab === 'engine' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Engine Parameters */}
          <div className="lg:col-span-6 liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Pengaturan Mesin JereAPI & Server Reach
              </h3>
            </div>

            {/* Emergency Switch */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
              reachEngine.isEmergencyPaused
                ? 'bg-rose-950/40 border-rose-500/50'
                : 'bg-slate-800/60 border-slate-700/60'
            }`}>
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Power className="w-3.5 h-3.5 text-rose-400" />
                  Mode Pemeliharaan Darurat (Emergency Pause)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Matikan sementara semua proses boost WhatsApp untuk seluruh user
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateReachEngine({ isEmergencyPaused: !reachEngine.isEmergencyPaused })}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  reachEngine.isEmergencyPaused
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {reachEngine.isEmergencyPaused ? 'PAUSED' : 'AKTIF'}
              </button>
            </div>

            {/* Speed Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Mode Kecepatan Dispatch Reaksi:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateReachEngine({ boostSpeedMode: 'turbo' })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                    reachEngine.boostSpeedMode === 'turbo'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  🚀 Turbo (0.8s)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReachEngine({ boostSpeedMode: 'normal' })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                    reachEngine.boostSpeedMode === 'normal'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  ⚡ Normal (1.5s)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReachEngine({ boostSpeedMode: 'eco' })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                    reachEngine.boostSpeedMode === 'eco'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  🍃 Eco (3.0s)
                </button>
              </div>
            </div>

            {/* Cooldown Settings */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Cooldown Antar-Permintaan (Detik):
              </label>
              <div className="flex items-center gap-2">
                {[1, 3, 5, 10].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleUpdateReachEngine({ globalCooldownSeconds: sec })}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      reachEngine.globalCooldownSeconds === sec
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    {sec} Detik
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Protected Channels Blacklist */}
          <div className="lg:col-span-6 liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Blacklist & Proteksi Target Channel
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              Channel WhatsApp yang didaftarkan di sini tidak akan bisa di-boost oleh user manapun untuk menghindari spam pada channel sensitif.
            </p>

            <form onSubmit={handleAddBlacklist} className="flex gap-2">
              <input
                type="text"
                value={newBlacklistInput}
                onChange={(e) => setNewBlacklistInput(e.target.value)}
                placeholder="ID Channel atau URL WhatsApp..."
                className="flex-1 glass-input px-3 py-2 rounded-xl text-xs outline-none"
              />
              <button
                type="submit"
                className="glass-btn px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
              >
                Tambah
              </button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {reachEngine.blacklistChannels.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  Belum ada channel dalam daftar blacklist proteksi.
                </div>
              ) : (
                reachEngine.blacklistChannels.map((channel) => (
                  <div
                    key={channel}
                    className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-mono text-slate-200 truncate">{channel}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlacklist(channel)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Hapus dari blacklist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE REACH LOGS STREAM */}
      {activeTab === 'logs' && (
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Live Audit Logs Real-Time
                </h3>
                <span className="text-[11px] text-slate-400">
                  Seluruh riwayat boost WhatsApp: target channel, status keberhasilan, user, emoji, & IP address.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                🟢 Live Real-Time ({reachLogs.length} logs)
              </span>
              <button
                type="button"
                onClick={loadAdminData}
                className="text-xs text-cyan-400 hover:text-cyan-300 p-1 font-bold"
                title="Muat ulang logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1 text-xs">
            {reachLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-sans">
                Belum ada aktivitas boost terbaru yang tercatat di sistem.
              </div>
            ) : (
              reachLogs.map((log) => {
                const isSuccess = log.status === 'success';
                const channelFormatted = log.channel.startsWith('http') 
                  ? log.channel 
                  : `https://whatsapp.com/channel/${log.channel}`;

                return (
                  <div
                    key={log.id || log.timestamp}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                      isSuccess 
                        ? 'bg-slate-900/80 border-emerald-500/30 shadow-sm' 
                        : 'bg-rose-950/30 border-rose-500/40'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Top Header line */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isSuccess
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-600 text-white font-extrabold'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-white" />}
                          {isSuccess ? 'BERHASIL' : 'GAGAL'}
                        </span>

                        <span className="text-cyan-400 font-bold font-mono">
                          @{log.username || 'Anonymous'}
                        </span>

                        <span className="text-slate-500">→</span>

                        {/* Channel Link with direct click */}
                        <a
                          href={channelFormatted}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-amber-300 hover:text-amber-200 font-mono underline truncate max-w-[260px] flex items-center gap-1"
                          title="Buka Channel WhatsApp Target"
                        >
                          <span>{log.channel}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>

                        {log.emojis && log.emojis.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-300 text-xs">
                            {log.emojis.join(' ')}
                          </span>
                        )}
                      </div>

                      {/* Message and IP details */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="text-slate-300">{log.message}</span>
                        {log.ipMasked && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-400 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-cyan-400" />
                              IP: {log.ipMasked}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-[11px] font-mono text-slate-400 shrink-0 self-end md:self-center bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 5: BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-lg space-y-4 max-w-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Megaphone className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Broadcast Pengumuman Resmi
            </h3>
          </div>

          <p className="text-xs text-slate-300">
            Pesan ini akan langsung diposting ke Global Chat sebagai pengumuman resmi dari Developer / Admin.
          </p>

          <form onSubmit={handleBroadcast} className="space-y-3">
            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Tulis pengumuman resmi ke Global Chat..."
              rows={3}
              className="w-full glass-input p-3 rounded-2xl text-xs font-medium outline-none resize-none"
            />
            <button
              type="submit"
              disabled={!broadcastText.trim() || isSendingBroadcast}
              className="glass-btn w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isSendingBroadcast ? 'Mengirim...' : 'Kirim Pengumuman Sekarang'}
            </button>
          </form>
        </div>
      )}

      {/* ROLE SWITCHER MODAL (STANDAR & CUSTOM ROLES) */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="liquid-glass rounded-3xl p-6 max-w-lg w-full border border-white/10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-extrabold text-white">
                  Ubah Role & Akses @{roleModalUser.username}
                </h4>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Preset Custom Roles Quick Select if available */}
              {customRoles.length > 0 && (
                <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <label className="font-extrabold text-purple-300 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Terapkan Preset Custom Role yang Telah Dibuat:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {customRoles.map((cr) => {
                      const isSelected = modalCustomRolePreset === cr.name;
                      return (
                        <button
                          key={cr.id}
                          type="button"
                          onClick={() => {
                            setModalCustomRolePreset(isSelected ? '' : cr.name);
                            if (!isSelected) {
                              const targetTier: UserRole = cr.baseTier === 'premium' ? 'premium' : cr.baseTier === 'blocked' ? 'blocked' : 'free';
                              setTargetRoleSelection(targetTier);
                              setModalCustomLimit(cr.dailyLimit);
                              setModalVipDuration(cr.durationDays);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white font-extrabold border-purple-400 shadow-md shadow-purple-500/30'
                              : 'bg-slate-900/80 border-purple-500/20 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="font-bold text-xs truncate">{cr.name}</div>
                          <div className="text-[10px] opacity-80">
                            {cr.durationDays} hari • {cr.dailyLimit}x limit ({cr.baseTier})
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standard Role Picker */}
              <div>
                <label className="font-bold text-slate-200 block mb-1.5">
                  Pilih Role Pokok Pengguna:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetRoleSelection('free');
                      setModalCustomRolePreset('');
                      setModalCustomLimit(10);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetRoleSelection === 'free' && !modalCustomRolePreset
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-black text-xs">FREE</div>
                    <div className="text-[10px] text-slate-400">Limit harian standar (10x)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetRoleSelection('premium');
                      setModalCustomRolePreset('');
                      setModalCustomLimit(9999);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetRoleSelection === 'premium' && !modalCustomRolePreset
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-extrabold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1">👑 PREMIUM</div>
                    <div className="text-[10px] text-slate-400">Akses VIP Unlimited</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetRoleSelection('blocked');
                      setModalCustomRolePreset('');
                      setModalCustomLimit(0);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetRoleSelection === 'blocked' && !modalCustomRolePreset
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-extrabold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1">🚫 BLOCKED</div>
                    <div className="text-[10px] text-slate-400">Akses dikunci, limit = 0</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetRoleSelection('admin');
                      setModalCustomRolePreset('');
                      setModalCustomLimit(9999);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetRoleSelection === 'admin' && !modalCustomRolePreset
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-extrabold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1">⚡ ADMIN</div>
                    <div className="text-[10px] text-slate-400">Hak akses administrator</div>
                  </button>
                </div>
              </div>

              {/* Detail fields based on selected role */}
              {targetRoleSelection === 'blocked' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                  <span className="font-bold text-rose-300 block">
                    Alasan Pemblokiran Akun:
                  </span>
                  <input
                    type="text"
                    value={modalBlockReason}
                    onChange={(e) => setModalBlockReason(e.target.value)}
                    placeholder="Contoh: Spam berlebihan / Bot otomatis"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs outline-none font-medium text-rose-200"
                  />
                  <span className="text-[11px] text-rose-400 block">
                    Saat diblokir, sistem akan otomatis menetapkan kuota harian akun ini menjadi <strong>0 (NOL)</strong> dan mencegah semua eksekusi boost.
                  </span>
                </div>
              )}

              {targetRoleSelection === 'premium' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-200 block">
                    Durasi Masa Aktif VIP (Hari):
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1000}
                    value={modalVipDuration}
                    onChange={(e) => setModalVipDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full glass-input px-3 py-2 rounded-xl text-sm font-mono font-bold outline-none text-amber-400"
                  />
                </div>
              )}

              {targetRoleSelection === 'free' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-200 block">
                    Atur Limit Harian Kustom (x reach per hari):
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1000}
                    value={modalCustomLimit}
                    onChange={(e) => setModalCustomLimit(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full glass-input px-3 py-2 rounded-xl text-sm font-mono font-bold outline-none text-emerald-400"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveUserRole}
                  disabled={isSavingRole}
                  className="glass-btn flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs text-center shadow-lg shadow-emerald-500/25"
                >
                  {isSavingRole ? 'Menyimpan...' : 'Simpan & Terapkan Role'}
                </button>
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="glass-btn px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL INFORMATION MODAL */}
      <UserInfoModal
        user={selectedUserForInfo}
        isOpen={!!selectedUserForInfo}
        onClose={() => setSelectedUserForInfo(null)}
        onShowToast={onShowToast}
      />

      {/* CUSTOM ROLE CREATOR & MANAGER MODAL */}
      <CustomRoleModal
        isOpen={isCustomRoleModalOpen}
        onClose={() => setIsCustomRoleModalOpen(false)}
        customRoles={customRoles}
        onCreateRole={handleCreateCustomRole}
        onDeleteRole={handleDeleteCustomRole}
        onShowToast={onShowToast}
      />

      {/* DELETE USER CONFIRMATION MODAL */}
      <DeleteUserConfirmModal
        user={selectedUserForDelete}
        isOpen={!!selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        onConfirmDelete={handleDeleteUserPermanent}
        onShowToast={onShowToast}
      />
    </div>
  );
};
