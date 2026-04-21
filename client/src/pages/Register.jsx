import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const pwStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
};

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPW, setShowPW] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const strength = pwStrength(form.password);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!agreed) return toast.error('Please accept the terms');
    try {
      setLoading(true);
      await register({ username: form.username, email: form.email, password: form.password });
      toast.success('Account created! Welcome to TerraManhwa!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Create Account — TerraManhwa</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl tracking-wider mb-2">JOIN TERRAMANHWA</h1>
            <p className="text-terra-muted">Create your account and start reading</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-terra-card border border-terra-border rounded-2xl p-6 space-y-5">
            <div>
              <label htmlFor="reg-username" className="text-sm text-terra-muted mb-1.5 block">Username</label>
              <input id="reg-username" value={form.username} onChange={set('username')} placeholder="coolreader42" className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors" />
            </div>

            <div>
              <label htmlFor="reg-email" className="text-sm text-terra-muted mb-1.5 block">Email</label>
              <input id="reg-email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors" />
            </div>

            <div>
              <label htmlFor="reg-password" className="text-sm text-terra-muted mb-1.5 block">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPW ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors pr-10" />
                <button type="button" onClick={() => setShowPW(!showPW)} className="absolute right-3 top-1/2 -translate-y-1/2 text-terra-muted hover:text-terra-text">
                  {showPW ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-terra-bg rounded-full overflow-hidden flex gap-0.5">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-terra-border'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strength >= 3 ? 'text-green-400' : strength >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="text-sm text-terra-muted mb-1.5 block">Confirm Password</label>
              <input id="reg-confirm" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors" />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input id="reg-agreed" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-terra-border bg-terra-bg accent-terra-red" />
              <span className="text-xs text-terra-muted">I agree to the <a href="#" className="text-terra-red hover:underline">Terms of Service</a> and <a href="#" className="text-terra-red hover:underline">Privacy Policy</a></span>
            </label>

            <Button variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-terra-muted">
              Already have an account? <Link to="/login" className="text-terra-red hover:underline font-medium">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
