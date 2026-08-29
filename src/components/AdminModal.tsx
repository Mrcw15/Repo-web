import React, { useState, useEffect } from 'react';
import { PremiumCode } from '../types';
import { fetchAdminCodes, createAdminCode } from '../services/api';
import { sound } from '../utils/sound';
import { X, ShieldAlert, Key, Plus, Copy, Check, RefreshCw } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (toast: any) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [password, setPassword] = useState('admin123');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<PremiumCode[]>([]);

  // Form fields
  const [newCode, setNewCode] = useState('');
  const [planType, setPlanType] = useState<'weekly' | 'monthly' | 'lifetime'>('weekly');
  const [durationDays, setDurationDays] = useState(7);
  const [maxUses, setMaxUses] = useState(50);
  const [codeName, setCodeName] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (planType === 'weekly') setDurationDays(7);
    if (planType === 'monthly') setDurationDays(30);
    if (planType === 'lifetime') setDurationDays(3650);
  }, [planType]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const result = await fetchAdminCodes(password);
      setCodes(result);
      setIsAuthenticated(true);
      sound.playSuccess();
    } catch (err: any) {
      sound.playError();
      onShowToast({
        id: 'admin_err_' + Date.now(),
        type: 'error',
        title: 'Akses Ditolak!',
        message: err.message || 'Password Admin salah! (Default: admin123)',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setLoading(true);
    try {
      const res = await createAdminCode(
        password,
        newCode.trim().toUpperCase(),
        planType,
        durationDays,
        maxUses,
        codeName || `VIP ${newCode.trim().toUpperCase()}`
      );
      sound.playSuccess();
      onShowToast({
        id: 'code_created_' + Date.now(),
        type: 'success',
        title: 'Kode Berhasil Dibuat!',
        message: `Kode ${res.code.code} siap dibagikan ke pengguna.`,
      });
      setNewCode('');
      setCodeName('');
      // Refresh list
      const updated = await fetchAdminCodes(password);
      setCodes(updated);
    } catch (err: any) {
      sound.playError();
      onShowToast({
        id: 'code_create_err_' + Date.now(),
        type: 'error',
        title: 'Gagal Membuat Kode',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (codeStr: string) => {
    sound.playClick();
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] border-[4px] border-black brutal-shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-toast-in">
        {/* Header Bar */}
        <div className="bg-[#FFEB3B] border-b-[4px] border-black p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-black" />
            <h2 className="text-xl font-heading uppercase font-black tracking-tight">
              ADMIN CODE GENERATOR
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 bg-white border-[2px] border-black brutal-shadow-sm brutal-btn hover:bg-black hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!isAuthenticated ? (
            /* Login Admin Form */
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto py-6">
              <div className="bg-[#FFF9C4] border-[3px] border-black p-4 brutal-shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-black">
                  🔐 Panel Khusus Owner / Admin
                </p>
                <p className="text-xs text-gray-700 mt-1 font-bold">
                  Masukkan password admin untuk generate dan kelola kode promo premium.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">
                  Password Admin
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password admin..."
                    className="flex-1 p-3 border-[3px] border-black font-mono font-bold text-sm bg-white outline-none focus:bg-[#FFF9C4]"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#00B4FF] text-black border-[3px] border-black px-5 py-3 font-black text-sm brutal-shadow-sm brutal-btn hover:bg-black hover:text-white flex items-center gap-2 uppercase"
                  >
                    <Key className="w-4 h-4" />
                    {loading ? 'Cek...' : 'Buka'}
                  </button>
                </div>
                <span className="text-[10px] font-bold text-gray-500 mt-1 block">
                  Petunjuk: default password adalah <span className="font-mono text-black font-black">admin123</span>
                </span>
              </div>
            </form>
          ) : (
            /* Authenticated Admin Workspace */
            <div className="space-y-6">
              {/* Generator Form */}
              <div className="bg-[#F8F8F8] border-[3px] border-black p-4 sm:p-5 brutal-shadow-sm">
                <h3 className="text-base font-heading font-black uppercase mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#FF2E93]" />
                  Buat Kode Promo Baru
                </h3>

                <form onSubmit={handleCreateCode} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black uppercase block mb-1">
                        Kode Promo (Uppercase)
                      </label>
                      <input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="MISAL: BOOSTVIP2026"
                        required
                        className="w-full p-2.5 border-[3px] border-black font-mono font-black text-sm uppercase bg-white outline-none focus:bg-[#FFF9C4]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase block mb-1">
                        Nama Paket / Label
                      </label>
                      <input
                        type="text"
                        value={codeName}
                        onChange={(e) => setCodeName(e.target.value)}
                        placeholder="MISAL: Event Ramadan 7 Hari"
                        className="w-full p-2.5 border-[3px] border-black font-bold text-sm bg-white outline-none focus:bg-[#FFF9C4]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-black uppercase block mb-1">
                        Tipe Paket
                      </label>
                      <select
                        value={planType}
                        onChange={(e) => setPlanType(e.target.value as any)}
                        className="w-full p-2.5 border-[3px] border-black font-bold text-sm bg-white outline-none"
                      >
                        <option value="weekly">Mingguan (7 Hari)</option>
                        <option value="monthly">Bulanan (30 Hari)</option>
                        <option value="lifetime">Lifetime Access</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase block mb-1">
                        Durasi (Hari)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="w-full p-2.5 border-[3px] border-black font-mono font-bold text-sm bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase block mb-1">
                        Maksimal Kuota Klaim
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        className="w-full p-2.5 border-[3px] border-black font-mono font-bold text-sm bg-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newCode.trim()}
                    className="w-full bg-[#B4FF00] text-black border-[3px] border-black py-3 font-black text-sm uppercase brutal-shadow-sm brutal-btn hover:bg-black hover:text-white flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    {loading ? 'Memproses...' : 'GENERATE KODE SEKARANG'}
                  </button>
                </form>
              </div>

              {/* Codes Table List */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-heading font-black text-sm uppercase">
                    Daftar Kode Aktif ({codes.length})
                  </h3>
                  <button
                    onClick={() => handleLogin()}
                    className="p-1 text-xs font-bold border-[2px] border-black bg-white flex items-center gap-1 hover:bg-gray-100"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                <div className="border-[3px] border-black overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-black text-white uppercase text-[10px]">
                        <th className="p-2.5 border-r border-gray-700">Kode</th>
                        <th className="p-2.5 border-r border-gray-700">Paket</th>
                        <th className="p-2.5 border-r border-gray-700">Durasi</th>
                        <th className="p-2.5 border-r border-gray-700">Terpakai</th>
                        <th className="p-2.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-[2px] divide-black font-bold">
                      {codes.map((item) => (
                        <tr key={item.code} className="hover:bg-[#FFF9C4]">
                          <td className="p-2.5 border-r-[2px] border-black font-black text-[#FF2E93]">
                            {item.code}
                          </td>
                          <td className="p-2.5 border-r-[2px] border-black uppercase">
                            {item.name || item.plan}
                          </td>
                          <td className="p-2.5 border-r-[2px] border-black">
                            {item.durationDays} Hari
                          </td>
                          <td className="p-2.5 border-r-[2px] border-black">
                            <span className={item.currentUses >= item.maxUses ? 'text-red-600' : 'text-black'}>
                              {item.currentUses}
                            </span>{' '}
                            / {item.maxUses}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleCopy(item.code)}
                              className="px-2 py-1 bg-[#FFEB3B] border-[2px] border-black text-[10px] font-black uppercase hover:bg-black hover:text-white flex items-center gap-1 mx-auto"
                            >
                              {copiedCode === item.code ? (
                                <>
                                  <Check className="w-3 h-3 text-green-700" /> Disalin!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Salin
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
