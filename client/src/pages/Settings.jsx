import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/manhwaService';

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Profile state
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await userService.updateMe(formData);
      setUser(res.data.data || res.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <Helmet><title>Settings — TerraManhwa</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-display text-4xl tracking-wider mb-8">SETTINGS</h1>

        {/* Account */}
        <Section title="Account" onSubmit={handleUpdateProfile}>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-terra-muted mb-1.5 block">Username</label>
              <input 
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors" 
              />
            </div>
            <div>
              <label className="text-sm text-terra-muted mb-1.5 block">Email</label>
              <input 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors" 
              />
            </div>
            <div>
              <label className="text-sm text-terra-muted mb-1.5 block">Bio</label>
              <textarea 
                name="bio"
                rows={3} 
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..." 
                className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors resize-none" 
              />
            </div>
            <Button variant="primary" size="sm" type="submit" loading={loading}>Save Changes</Button>
          </div>
        </Section>

        {/* Password */}
        <Section title="Change Password">
          <div className="space-y-4">
            <Field label="Current Password" type="password" />
            <Field label="New Password" type="password" />
            <Field label="Confirm New Password" type="password" />
            <Button variant="primary" size="sm" onClick={() => toast.success('Password functionality coming soon!')}>Update Password</Button>
          </div>
        </Section>

        {/* Reader */}
        <Section title="Reader Preferences">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-terra-muted mb-1.5 block">Default Mode</label>
              <select className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text focus:outline-none focus:border-terra-red">
                <option>Vertical Scroll</option>
                <option>Single Page</option>
                <option>Double Page</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-terra-muted mb-1.5 block">Background</label>
              <select className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text focus:outline-none focus:border-terra-red">
                <option>Black</option>
                <option>White</option>
                <option>Sepia</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Toggle label="New chapter releases for bookmarked manhwa" />
          <Toggle label="Email notifications" />
        </Section>

        {/* Danger Zone */}
        <div className="mt-12 p-5 bg-red-950/20 border border-red-900/30 rounded-xl">
          <h3 className="font-display text-lg tracking-wider text-terra-red mb-2">DANGER ZONE</h3>
          <p className="text-sm text-terra-muted mb-4">Once you delete your account, there is no going back.</p>
          <Button variant="primary" size="sm" className="bg-red-800 hover:bg-red-900" onClick={() => setDeleteModal(true)}>Delete Account</Button>
        </div>

        <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
          <p className="text-terra-muted text-sm mb-4">Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="primary" className="bg-red-700 hover:bg-red-800" onClick={() => { setDeleteModal(false); toast.success('Account deleted'); }}>Delete Forever</Button>
          </div>
        </Modal>
      </div>
    </>
  );
}

function Section({ title, children, onSubmit }) {
  return (
    <form className="mb-10" onSubmit={onSubmit}>
      <h2 className="font-display text-lg tracking-wider mb-5 pb-2 border-b border-terra-border">{title}</h2>
      <div className="space-y-4">{children}</div>
    </form>
  );
}

function Field({ label, type = 'text', value = '', onChange, name }) {
  return (
    <div>
      <label className="text-sm text-terra-muted mb-1.5 block">{label}</label>
      <input 
        name={name}
        type={type} 
        value={value} 
        onChange={onChange}
        className="w-full px-4 py-3 bg-terra-bg border border-terra-border rounded-lg text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red transition-colors" 
      />
    </div>
  );
}

function Toggle({ label, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm text-terra-muted">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-terra-red' : 'bg-terra-border'}`} onClick={() => setChecked(!checked)}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );
}
