import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { 
  User, Mail, Lock, Bell, Shield, Camera, Save, Globe, BookOpen, Briefcase, ChevronRight, ExternalLink, Trash2, Calendar, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/authContext';
import { updateProfile } from '../../lib/db';

export default function ProfileSettings() {
  const { profile: user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    faculty: user?.faculty || '',
    department: user?.department || '',
  });

  // Keep state synced if user context updates after render
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: '', 
        faculty: user.faculty || '',
        department: user.department || '',
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', name: 'Profile Info', icon: <User size={18} />, desc: 'Personal details and bio' },
    { id: 'account', name: 'Account Security', icon: <Shield size={18} />, desc: 'Password and security' },
    { id: 'notifications', name: 'Notifications', icon: <Bell size={18} />, desc: 'Email and app alerts' },
  ];

  const handleSave = async () => {
    if (!user) return;

    const nameRegex = /^[A-Za-z\s.'-]+$/;
    const academicRegex = /^[A-Za-z\s&'(),.-]+$/;

    if (!nameRegex.test(formData.fullName)) {
      alert('Full Name should only contain letters.');
      return;
    }
    if (formData.faculty && !academicRegex.test(formData.faculty)) {
      alert('Faculty should only contain letters.');
      return;
    }
    if (formData.department && !academicRegex.test(formData.department)) {
      alert('Department should only contain letters.');
      return;
    }

    setIsSaving(true);
    await updateProfile(user.id, {
      fullName: formData.fullName,
      faculty: formData.faculty,
      department: formData.department,
    });
    setTimeout(() => {
        setIsSaving(false);
        refreshProfile();
    }, 500);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const { uploadAvatar } = await import('../../lib/db');
      const avatarUrl = await uploadAvatar(file, user.id);
      if (avatarUrl) {
        await updateProfile(user.id, { avatarUrl });
        await refreshProfile();
      } else {
        alert('Failed to upload image. Please ensure the "avatars" bucket is created and public in your Supabase dashboard.');
      }
    } catch (error) {
      console.error(error);
      alert('Error uploading image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-surface lg:pl-64">
      <Sidebar role="student" />
      
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
        <header className="mb-10">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-2">
            <Globe size={14} />
            Account Settings
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Manage your Profile</h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Control your personal information, security preferences, and how you interact with the FUD Alumni Network.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Tabs Navigation */}
          <aside className="lg:col-span-4">
            <div className="sticky top-10 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all
                    ${activeTab === tab.id 
                      ? 'bg-white shadow-xl shadow-primary/5 ring-1 ring-slate-200' 
                      : 'hover:bg-white/50'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      flex h-10 w-10 items-center justify-center rounded-xl transition-all
                      ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                    `}>
                      {tab.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-600'}`}>
                        {tab.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{tab.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`transition-all ${activeTab === tab.id ? 'translate-x-0 text-primary' : '-translate-x-2 opacity-0 text-slate-300'}`} />
                </button>
              ))}

              <div className="mt-8 rounded-2xl bg-primary p-6 text-white shadow-lg">
                <h4 className="text-sm font-bold">Need help?</h4>
                <p className="mt-1 text-[10px] text-primary-light/80">Our support team is available 24/7 to assist you with your account.</p>
                <button className="mt-4 flex items-center gap-2 text-xs font-bold hover:underline">
                  Contact Support <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    {/* Profile Header Card */}
                    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                      <div className="flex flex-col items-center gap-8 sm:flex-row">
                        <div className="relative group">
                          <div className="h-28 w-28 overflow-hidden rounded-[2rem] ring-4 ring-slate-50 shadow-inner">
                            <img src={user?.avatarUrl || `https://picsum.photos/seed/${user?.id || 'student'}/200/200`} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg ring-4 ring-white transition-transform hover:scale-110 disabled:opacity-70 disabled:hover:scale-100">
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                          </button>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-xl font-bold text-slate-900">{user?.fullName}</h3>
                          <p className="text-sm text-slate-500">{user?.department} Student {user?.level ? `• ${user.level}` : ''}</p>
                          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 disabled:opacity-50">
                               {isUploading ? 'Uploading...' : 'Upload New Photo'}
                            </button>
                            <button onClick={async () => {
                                if(!user) return;
                                setIsUploading(true);
                                await updateProfile(user.id, { avatarUrl: undefined });
                                await refreshProfile();
                                setIsUploading(false);
                            }} disabled={isUploading || !user?.avatarUrl} className="rounded-xl border border-red-100 px-4 py-2 text-xs font-bold text-red-500 transition-all hover:bg-red-50 disabled:opacity-50">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Personal Information */}
                    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary">
                          <User size={16} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                          <div className="relative">
                            <User className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full rounded-2xl border-transparent bg-slate-50 py-3.5 pr-4 pl-12 text-sm font-medium ring-1 ring-slate-100 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="email" value={formData.email} disabled className="w-full rounded-2xl border-transparent bg-slate-100 py-3.5 pr-4 pl-12 text-sm font-medium text-slate-500 ring-1 ring-slate-200 cursor-not-allowed transition-all shadow-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                          <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="e.g. +234 800 000 0000" className="w-full rounded-2xl border-transparent bg-slate-50 py-3.5 px-4 text-sm font-medium ring-1 ring-slate-100 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                        </div>
                      </div>
                    </section>

                    {/* Academic Details */}
                    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <BookOpen size={16} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Academic Details</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Faculty</label>
                          <input type="text" value={formData.faculty} onChange={(e) => setFormData({...formData, faculty: e.target.value})} className="w-full rounded-2xl border-transparent bg-slate-50 py-3.5 px-4 text-sm font-medium ring-1 ring-slate-100 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                          <input type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full rounded-2xl border-transparent bg-slate-50 py-3.5 px-4 text-sm font-medium ring-1 ring-slate-100 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Interests & Goals</label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {['Software Development', 'AI', 'Cybersecurity', 'Web Dev'].map(tag => (
                              <span key={tag} className="flex items-center gap-2 rounded-xl bg-primary/5 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-primary/10 shadow-sm transition-all hover:shadow-md hover:ring-primary/20">
                                {tag} <button className="hover:text-primary-dark transition-colors"><Trash2 size={12} /></button>
                              </span>
                            ))}
                            <button className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-400 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                              + Add Interest
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-8">
                    <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Lock size={16} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Security Settings</h3>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Current Password</label>
                          <div className="relative">
                            <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="password" placeholder="••••••••" className="w-full rounded-2xl border-transparent bg-slate-50 py-3.5 pr-4 pl-12 text-sm font-medium ring-1 ring-slate-100 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                            <div className="relative">
                              <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                              <input type="password" placeholder="••••••••" className="w-full rounded-2xl border-transparent bg-slate-50 py-3.5 pr-4 pl-12 text-sm font-medium ring-1 ring-slate-100 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirm New Password</label>
                            <div className="relative">
                              <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
                              <input type="password" placeholder="••••••••" className="w-full rounded-2xl border-transparent bg-slate-50 py-3.5 pr-4 pl-12 text-sm font-medium ring-1 ring-slate-100 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-3xl bg-red-50/30 p-8 shadow-sm ring-1 ring-red-100 backdrop-blur-sm">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 shadow-sm">
                          <Trash2 size={16} />
                        </div>
                        <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
                      </div>
                      <p className="text-sm text-red-700/80">Once you delete your account, there is no going back. Please be certain.</p>
                      <button className="mt-6 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-red-600 shadow-sm ring-1 ring-red-200 transition-all hover:bg-red-50 hover:shadow-md hover:ring-red-300 active:scale-95">
                        Delete Account
                      </button>
                    </section>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary">
                        <Bell size={16} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Notification Preferences</h3>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {[
                        { id: 'n1', label: 'New Message Alerts', desc: 'Get notified when a mentor sends you a message.', icon: <Mail size={18} /> },
                        { id: 'n2', label: 'Session Reminders', desc: 'Receive reminders 1 hour before your scheduled session.', icon: <Calendar size={18} /> },
                        { id: 'n3', label: 'Mentorship Requests', desc: 'Alerts when a mentor accepts your connection request.', icon: <User size={18} /> },
                        { id: 'n4', label: 'Platform Updates', desc: 'Stay informed about platform changes and new features.', icon: <Globe size={18} /> },
                      ].map((n) => (
                        <div key={n.id} className="flex items-center justify-between py-6 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                              {n.icon}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{n.label}</p>
                              <p className="text-xs text-slate-500">{n.desc}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" defaultChecked className="peer sr-only" />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Sticky Action Bar */}
                <div className="sticky bottom-6 z-10 flex items-center justify-between rounded-3xl bg-white/80 p-6 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] ring-1 ring-slate-200/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
                  <p className="hidden text-[10px] font-medium text-slate-400 uppercase tracking-wider sm:block">
                    Last saved: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                    <button className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50">
                      Discard Changes
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-70"
                    >
                      {isSaving ? (
                        <>
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
