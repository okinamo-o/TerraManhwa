import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { FaGoogle, FaDiscord } from 'react-icons/fa';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPW, setShowPW] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Sign In — TerraManhwa</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl tracking-wider mb-2">WELCOME BACK</h1>
            <p className="text-terra-muted">Sign in to continue reading</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-terra-card border border-terra-border rounded-2xl p-6 space-y-5">
            <div>
              <label htmlFor="login-email" className="text-sm text-terra-muted mb-1.5 block">Email</label>
              <input
                id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="text-sm text-terra-muted mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="login-password" type={showPW ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors pr-10"
                />
                <button type="button" onClick={() => setShowPW(!showPW)} className="absolute right-3 top-1/2 -translate-y-1/2 text-terra-muted hover:text-terra-text">
                  {showPW ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded border-terra-border bg-terra-bg accent-terra-red" />
                <span className="text-sm text-terra-muted">Remember me</span>
              </label>
              <a href="#" className="text-sm text-terra-red hover:underline">Forgot password?</a>
            </div>

            <Button variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-terra-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-terra-card px-3 text-terra-muted">or continue with</span></div>
            </div>

            <div className="flex gap-3">
              <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-terra-bg border border-terra-border rounded-lg text-sm text-terra-muted hover:text-terra-text hover:border-terra-red transition-colors">
                <FaGoogle size={16} /> Google
              </button>
              <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-terra-bg border border-terra-border rounded-lg text-sm text-terra-muted hover:text-terra-text hover:border-terra-red transition-colors">
                <FaDiscord size={16} /> Discord
              </button>
            </div>

            <p className="text-center text-sm text-terra-muted mt-4">
              Don't have an account? <Link to="/register" className="text-terra-red hover:underline font-medium">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
