import React, { useState } from 'react';
import { Layers, Shield, UserCheck, Lock, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl backdrop-blur-xl z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-3">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Velozity Project Hub</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Real-Time Client Dashboard & Live Activity Feed</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Email</label>
            <div className="relative">
              <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@velozity.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Demo Quick Login (Role Testing)
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => quickLogin('admin@velozity.com')}
              className="w-full p-2.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-left flex items-center justify-between transition group cursor-pointer"
            >
              <div>
                <div className="text-xs font-extrabold text-purple-900">System Admin</div>
                <div className="text-[10px] text-purple-700 font-medium">admin@velozity.com · Full Access</div>
              </div>
              <Shield className="w-4 h-4 text-purple-600 opacity-80 group-hover:opacity-100" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('pm1@velozity.com')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition cursor-pointer"
              >
                <div className="text-[11px] font-extrabold text-blue-900">PM 1 (Sarah)</div>
                <div className="text-[9px] text-blue-700 font-medium">pm1@velozity.com</div>
              </button>

              <button
                onClick={() => quickLogin('pm2@velozity.com')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition cursor-pointer"
              >
                <div className="text-[11px] font-extrabold text-blue-900">PM 2 (Arthur)</div>
                <div className="text-[9px] text-blue-700 font-medium">pm2@velozity.com</div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('dev1@velozity.com')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left transition cursor-pointer"
              >
                <div className="text-[11px] font-extrabold text-emerald-900">Dev 1 (Ravi)</div>
                <div className="text-[9px] text-emerald-700 font-medium">dev1@velozity.com</div>
              </button>

              <button
                onClick={() => quickLogin('dev2@velozity.com')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left transition cursor-pointer"
              >
                <div className="text-[11px] font-extrabold text-emerald-900">Dev 2 (Elena)</div>
                <div className="text-[9px] text-emerald-700 font-medium">dev2@velozity.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
