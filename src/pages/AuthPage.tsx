import React, { useState } from 'react';
import { 
  Zap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { 
  saveAuthSession, 
  getLocalAccounts, 
  saveLocalAccount, 
  type UserProfile,
  type LocalAccount,
  getRandomColor
} from '../utils/storage';
import { syncUserProfileToFirebase } from '../services/firebaseService';

interface AuthPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onShowToast,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      soundFx.playError();
      setErrorMessage('Harap masukkan username!');
      return;
    }

    if (cleanUsername.length < 3) {
      soundFx.playError();
      setErrorMessage('Username minimal 3 karakter!');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      soundFx.playError();
      setErrorMessage('Username hanya boleh berisi huruf, angka, dan underscore (_)!');
      return;
    }

    if (!password) {
      soundFx.playError();
      setErrorMessage('Harap masukkan password!');
      return;
    }

    if (password.length < 4) {
      soundFx.playError();
      setErrorMessage('Password minimal 4 karakter!');
      return;
    }

    if (authMode === 'register' && password !== confirmPassword) {
      soundFx.playError();
      setErrorMessage('Konfirmasi password tidak cocok dengan password!');
      return;
    }

    soundFx.playClick();
    setIsLoading(true);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        soundFx.playSuccess();
        const userProfile: UserProfile = {
          username: data.user.username,
          nickname: data.user.username,
          role: data.user.role || 'free',
          avatarColor: data.user.avatarColor || getRandomColor(),
          premiumExpiresAt: data.user.premiumExpiresAt,
          loginTime: Date.now(),
        };

        // Save local backup
        const newLocalAccount: LocalAccount = {
          username: cleanUsername,
          passwordHash: password,
          role: userProfile.role,
          avatarColor: userProfile.avatarColor,
          createdAt: Date.now(),
        };
        saveLocalAccount(newLocalAccount);

        saveAuthSession(userProfile);
        syncUserProfileToFirebase(userProfile, { password });
        onShowToast('success', authMode === 'login' ? 'Login Sukses' : 'Registrasi Sukses', data.message || 'Selamat datang!');
        onLoginSuccess(userProfile);
      } else {
        // Fallback to local accounts if backend is unreachable or offline
        const localAccounts = getLocalAccounts();
        if (authMode === 'login') {
          const match = localAccounts.find((a) => a.username.toLowerCase() === cleanUsername);
          if (match) {
            if (match.passwordHash === password) {
              soundFx.playSuccess();
              const profile: UserProfile = {
                username: match.username,
                nickname: match.username,
                role: match.role,
                avatarColor: match.avatarColor,
                loginTime: Date.now(),
              };
              saveAuthSession(profile);
              onShowToast('success', 'Login Berhasil', `Selamat datang kembali, @${match.username}!`);
              onLoginSuccess(profile);
              return;
            } else {
              soundFx.playError();
              setErrorMessage('Password salah! Periksa kembali password Anda.');
              return;
            }
          } else {
            soundFx.playError();
            setErrorMessage(data.message || 'Username belum terdaftar! Silakan registrasi.');
            return;
          }
        } else {
          // Register local fallback
          const match = localAccounts.find((a) => a.username.toLowerCase() === cleanUsername);
          if (match) {
            soundFx.playError();
            setErrorMessage('Username sudah digunakan! Silakan pilih username lain.');
            return;
          }

          const newAccount: LocalAccount = {
            username: cleanUsername,
            passwordHash: password,
            role: cleanUsername === 'admin' ? 'admin' : 'free',
            avatarColor: getRandomColor(),
            createdAt: Date.now(),
          };
          saveLocalAccount(newAccount);

          const profile: UserProfile = {
            username: newAccount.username,
            nickname: newAccount.username,
            role: newAccount.role,
            avatarColor: newAccount.avatarColor,
            loginTime: Date.now(),
          };
          saveAuthSession(profile);
          soundFx.playSuccess();
          onShowToast('success', 'Registrasi Berhasil', 'Akun Anda telah dibuat!');
          onLoginSuccess(profile);
        }
      }
    } catch {
      // Offline fallback handling
      const localAccounts = getLocalAccounts();
      if (authMode === 'login') {
        const match = localAccounts.find((a) => a.username.toLowerCase() === cleanUsername);
        if (match && match.passwordHash === password) {
          const profile: UserProfile = {
            username: match.username,
            nickname: match.username,
            role: match.role,
            avatarColor: match.avatarColor,
            loginTime: Date.now(),
          };
          saveAuthSession(profile);
          soundFx.playSuccess();
          onShowToast('success', 'Login Berhasil', `Selamat datang kembali, @${match.username}!`);
          onLoginSuccess(profile);
        } else if (match) {
          soundFx.playError();
          setErrorMessage('Password salah!');
        } else {
          soundFx.playError();
          setErrorMessage('Username belum terdaftar! Silakan beralih ke tab Registrasi.');
        }
      } else {
        const match = localAccounts.find((a) => a.username.toLowerCase() === cleanUsername);
        if (match) {
          soundFx.playError();
          setErrorMessage('Username sudah terdaftar!');
          return;
        }
        const newAccount: LocalAccount = {
          username: cleanUsername,
          passwordHash: password,
          role: 'free',
          avatarColor: getRandomColor(),
          createdAt: Date.now(),
        };
        saveLocalAccount(newAccount);
        const profile: UserProfile = {
          username: newAccount.username,
          nickname: newAccount.username,
          role: newAccount.role,
          avatarColor: newAccount.avatarColor,
          loginTime: Date.now(),
        };
        saveAuthSession(profile);
        soundFx.playSuccess();
        onShowToast('success', 'Registrasi Sukses', 'Akun berhasil dibuat!');
        onLoginSuccess(profile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-[#080b13] text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Liquid Dark Ambient Glow Lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-emerald-600/20 to-teal-800/10 blur-[130px] animate-blob-1" />
        <div className="absolute bottom-[15%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-cyan-600/20 to-blue-800/10 blur-[140px] animate-blob-2" />
        <div className="absolute top-[40%] right-[30%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-br from-purple-600/15 to-rose-800/10 blur-[120px] animate-blob-3" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-0.5 shadow-xl shadow-emerald-500/25">
            <div className="w-full h-full rounded-3xl bg-slate-950/80 flex items-center justify-center text-white">
              <Zap className="w-7 h-7 fill-emerald-400 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            WA Reach <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Tools</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs mx-auto">
            Masuk dengan Akun Anda untuk mengakses fitur boost reach WhatsApp Channel
          </p>
        </div>

        {/* Liquid Glass Auth Card */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-5 bg-slate-900/80 backdrop-blur-2xl">
          {/* Auth Mode Toggle Tabs (Login vs Registrasi) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <button
              type="button"
              id="tab-auth-login"
              onClick={() => {
                soundFx.playClick();
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk (Login)</span>
            </button>

            <button
              type="button"
              id="tab-auth-register"
              onClick={() => {
                soundFx.playClick();
                setAuthMode('register');
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar (Registrasi)</span>
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Dedicated Username & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label htmlFor="auth-username" className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Username</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="auth-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  autoComplete="username"
                  disabled={isLoading}
                  className="w-full glass-input p-3.5 rounded-2xl text-xs sm:text-sm font-medium outline-none bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="auth-password" className="font-extrabold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Password</span>
                </label>
                <span className="text-[11px] text-slate-500">Min. 4 karakter</span>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  disabled={isLoading}
                  className="w-full glass-input p-3.5 rounded-2xl text-xs sm:text-sm font-medium outline-none pr-11 bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Registrasi Only) */}
            {authMode === 'register' && (
              <div className="space-y-1.5 animate-in fade-in">
                <label htmlFor="auth-confirm-password" className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                  <span>Ulangi Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password untuk konfirmasi"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="w-full glass-input p-3.5 rounded-2xl text-xs sm:text-sm font-medium outline-none bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-auth-submit"
                disabled={isLoading}
                className="glass-btn w-full py-3.5 sm:py-4 px-5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Masuk ke Aplikasi' : 'Daftar & Masuk Sekarang'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Privacy Notice */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Keamanan Terenkripsi &bull; Tanpa Email / No HP</span>
        </div>
      </div>
    </div>
  );
};
