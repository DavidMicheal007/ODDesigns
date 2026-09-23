/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  auth, db, OperationType, handleFirestoreError 
} from './firebase';
import { 
  signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut 
} from 'firebase/auth';
import { 
  doc, getDoc, setDoc, collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, getDocFromServer, limit, getDocs, runTransaction, increment 
} from 'firebase/firestore';
import { 
  Layout, Palette, ShoppingBag, Users, Wallet, BarChart3, User as UserIcon, 
  Plus, Send, Sparkles, TrendingUp, BookOpen, LogOut, ChevronRight, 
  Image as ImageIcon, Search, Filter, DollarSign, ArrowUpRight, ArrowDownLeft,
  Share2, Twitter, Facebook, Instagram, Copy, Check, Star,
  ShieldCheck, MessageSquare, MapPin, Upload, Cpu, Zap, Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  generateDesignIdeas, getTrendyVibes, getBrandGuide, generateDesignImage, auditDesign 
} from './services/geminiService';
import { UserProfile, Design, MarketplaceItem, Transaction, Collaboration, Review, WarRoom, WarRoomComment } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const variants = {
    primary: 'bg-[#4F46E5] text-white hover:bg-[#4338CA]',
    secondary: 'bg-zinc-100 text-black hover:bg-zinc-200',
    outline: 'border border-[#E5E7EB] text-[#4B5563] hover:bg-zinc-50',
    ghost: 'text-[#6B7280] hover:bg-zinc-100 hover:text-[#1F2937]',
  };
  return (
    <button 
      className={cn('px-4 py-2 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm', variants[variant], className)} 
      {...props} 
    />
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; key?: string; onClick?: () => void }) => (
  <div 
    className={cn('bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]', className)}
    onClick={onClick}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' }) => {
  const variants = {
    default: 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
    success: 'bg-[#DEF7EC] text-[#03543F]',
    warning: 'bg-[#FEF3C7] text-[#92400E]',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check for profile
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Create default profile
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'Anonymous',
            email: u.email || '',
            photoURL: u.photoURL || '',
            role: 'artist',
            walletBalance: 0,
            specialization: 'Streetwear',
            reputationScore: 0,
            bio: "New designer on ODDesigns.",
            socialLinks: {},
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-4xl font-black tracking-tighter"
        >
          ODD
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter">ODD</h1>
            <p className="text-zinc-500 font-medium">Ordinary Designated Designs</p>
          </div>
          <Card className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-zinc-500 text-sm">Sign in to start designing your brand identity.</p>
            </div>
            <Button onClick={handleLogin} className="w-full py-4 text-lg">
              Continue with Google
            </Button>
          </Card>
          <p className="text-xs text-zinc-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col md:flex-row font-sans text-[#1F2937]">
      {/* Sidebar */}
      <nav className="w-full md:w-[240px] bg-white border-b md:border-b-0 md:border-r border-[#E5E7EB] p-6 flex flex-col gap-2 z-10">
        <div className="mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">O<span className="text-[#4F46E5]">DD</span></h1>
        </div>
        
        <NavItem icon={<Layout size={18} />} label="Dashboard" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavItem icon={<Sparkles size={18} />} label="Design Studio" active={activeTab === 'lab'} onClick={() => setActiveTab('lab')} />
        <NavItem icon={<ShoppingBag size={18} />} label="Marketplace" active={activeTab === 'market'} onClick={() => setActiveTab('market')} />
        <NavItem icon={<Users size={18} />} label="Collaborators" active={activeTab === 'collabs'} onClick={() => setActiveTab('collabs')} />
        <NavItem icon={<Wallet size={18} />} label="Wallet" active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
        <NavItem icon={<BarChart3 size={18} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        
        <div className="mt-auto pt-4 border-t border-[#F3F4F6]">
          <NavItem icon={<UserIcon size={18} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#4B5563] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeView key="home" profile={profile} />}
          {activeTab === 'lab' && <LabView key="lab" profile={profile} />}
          {activeTab === 'market' && <MarketView key="market" profile={profile} />}
          {activeTab === 'collabs' && <CollabsView key="collabs" profile={profile} />}
          {activeTab === 'wallet' && <WalletView key="wallet" profile={profile} />}
          {activeTab === 'analytics' && <AnalyticsView key="analytics" profile={profile} />}
          {activeTab === 'profile' && <ProfileView key="profile" profile={profile} setProfile={setProfile} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm",
        active ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-[#4B5563] hover:bg-zinc-50 hover:text-[#111827]"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// --- Views ---

function HomeView({ profile }: { profile: UserProfile | null; key?: string }) {
  const [trends, setTrends] = useState<string>('');
  const [guide, setGuide] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [t, g] = await Promise.all([getTrendyVibes(), getBrandGuide()]);
        setTrends(t);
        setGuide(g);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-48 bg-zinc-200 rounded-3xl w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-96 bg-zinc-200 rounded-3xl" />
      <div className="h-96 bg-zinc-200 rounded-3xl" />
    </div>
  </div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#111827]">Brand Overview</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#1F2937]">{profile?.displayName || 'Studio Aris'}</span>
          <div className="w-8 h-8 bg-[#D1D5DB] rounded-full overflow-hidden">
            {profile?.photoURL && <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Current Trendy Vibes</h3>
            <span className="text-xs font-bold text-[#4F46E5] cursor-pointer">View All</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 bg-[#4F46E5] text-white rounded-full text-xs font-medium">Cyber Minimalist</div>
            <div className="px-3 py-1.5 bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] rounded-full text-xs font-medium">Eco-Canvas</div>
            <div className="px-3 py-1.5 bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] rounded-full text-xs font-medium">Post-Grunge</div>
            <div className="px-3 py-1.5 bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] rounded-full text-xs font-medium">Oversized Utility</div>
            <div className="px-3 py-1.5 bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] rounded-full text-xs font-medium">Neon Bauhaus</div>
          </div>
          <p className="text-sm text-[#6B7280] mt-4">
            Trending up: <strong className="text-[#1F2937]">Boxy silhouettes</strong> and <strong className="text-[#1F2937]">Reflective piping</strong> are seeing a 24% increase in artist interest this week.
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-[#4F46E5] to-[#3730A3] text-white border-none p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Earnings Wallet</h3>
            <div className="text-3xl font-bold">$4,290.50</div>
            <div className="text-[10px] text-white/60">+12% from last month</div>
          </div>
          <button className="w-fit bg-white text-[#4F46E5] border-none px-3 py-1.5 rounded font-bold text-[10px] mt-4 hover:bg-zinc-100 transition-colors">
            Withdraw Funds
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Growth Analytics</h3>
            <div className="text-lg font-bold">1.2k Reach</div>
          </div>
          <div className="flex items-end gap-2 h-32 pt-4">
            <div className="flex-1 bg-[#E5E7EB] rounded-t" style={{ height: '40%' }}></div>
            <div className="flex-1 bg-[#E5E7EB] rounded-t" style={{ height: '65%' }}></div>
            <div className="flex-1 bg-[#4F46E5] rounded-t" style={{ height: '90%' }}></div>
            <div className="flex-1 bg-[#E5E7EB] rounded-t" style={{ height: '55%' }}></div>
            <div className="flex-1 bg-[#4F46E5] rounded-t" style={{ height: '80%' }}></div>
            <div className="flex-1 bg-[#E5E7EB] rounded-t" style={{ height: '70%' }}></div>
            <div className="flex-1 bg-[#E5E7EB] rounded-t" style={{ height: '45%' }}></div>
          </div>
        </Card>

        <Card className="bg-[#111827] text-white border-none flex flex-col items-center justify-center text-center p-6 gap-3">
          <div className="text-2xl">✨</div>
          <h3 className="text-sm font-bold">AI Design Assistant</h3>
          <p className="text-[11px] text-white/60">Generate unique patterns or silhouette ideas.</p>
          <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-xs py-2">Suggest Idea</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
          <strong className="text-sm text-[#1F2937]">Graphic Tee #402</strong>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DEF7EC] text-[#03543F]">Active Sale</span>
        </div>
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
          <strong className="text-sm text-[#1F2937]">Utility Cargo V2</strong>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">In Review</span>
        </div>
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
          <strong className="text-sm text-[#1F2937]">Brand Identity Kit</strong>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DEF7EC] text-[#03543F]">Active Sale</span>
        </div>
      </div>

      <footer className="pt-6 border-t border-[#E5E7EB] flex justify-between text-[11px] text-[#9CA3AF] font-medium">
        <div>Active Connections: 14 Influencers, 3 Designers</div>
        <div className="flex gap-4">
          <span>Twitter</span>
          <span>Instagram</span>
          <span>Pinterest</span>
        </div>
      </footer>
    </motion.div>
  );
}

function LabView({ profile }: { profile: UserProfile | null; key?: string }) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'generate' | 'audit'>('generate');
  const [auditImage, setAuditImage] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setIdeas(null);
    setImageUrl(null);
    setError(null);
    try {
      const [i, img] = await Promise.all([
        generateDesignIdeas(prompt),
        generateDesignImage(prompt)
      ]);
      setIdeas(i);
      setImageUrl(img);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAudit = async () => {
    if (!auditImage) return;
    setAuditing(true);
    setAuditResult(null);
    setError(null);
    try {
      const result = await auditDesign(auditImage, prompt);
      setAuditResult(result);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      console.error(e);
    } finally {
      setAuditing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!imageUrl || !profile) return;
    try {
      const newDesign: Omit<Design, 'id'> = {
        authorId: profile.uid,
        authorName: profile.displayName,
        title: prompt.slice(0, 30),
        description: ideas || '',
        imageUrl: imageUrl,
        prompt: prompt,
        price: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        tags: ['AI Generated', 'Concept']
      };
      await addDoc(collection(db, 'designs'), newDesign);
      alert('Design saved to your portfolio!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'designs');
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out my new design concept on ODDesigns: "${prompt}"`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
    }
    setShowShareModal(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="max-w-4xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-[#111827]">Design Studio</h2>
          <p className="text-sm text-[#6B7280]">Transform your ideas into designated designs.</p>
        </div>
        <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
          <button 
            onClick={() => setMode('generate')}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", mode === 'generate' ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#6B7280]")}
          >
            Generate
          </button>
          <button 
            onClick={() => setMode('audit')}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", mode === 'audit' ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#6B7280]")}
          >
            Audit
          </button>
        </div>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm"
        >
          <Plus className="rotate-45 text-red-400" size={18} />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <Plus className="rotate-45" size={18} />
          </button>
        </motion.div>
      )}

      {mode === 'generate' ? (
        <Card className="p-2 flex flex-col md:flex-row gap-2">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Minimalist streetwear hoodie with cyberpunk accents..."
            className="flex-1 px-6 py-4 bg-transparent outline-none font-medium text-sm"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={generating || !prompt}
            className="md:w-48 py-4"
          >
            {generating ? 'Generating...' : <><Sparkles size={18} /> Generate</>}
          </Button>
        </Card>
      ) : (
        <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center space-y-4 text-center">
          {auditImage ? (
            <div className="relative group">
              <img src={auditImage} alt="Audit target" className="max-h-48 rounded-xl shadow-lg" />
              <button 
                onClick={() => setAuditImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="rotate-45" size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto">
                <Upload size={24} className="text-[#9CA3AF]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#111827]">Upload Design for Audit</h3>
                <p className="text-xs text-[#6B7280]">Get a trend score and professional feedback.</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="hidden" 
                id="audit-upload" 
              />
              <label 
                htmlFor="audit-upload"
                className="inline-block px-6 py-3 bg-[#4F46E5] text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-[#4338CA] transition-colors"
              >
                Choose File
              </label>
            </div>
          )}
          {auditImage && (
            <div className="w-full max-w-md space-y-4">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Add context (optional)..."
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm outline-none"
              />
              <Button 
                onClick={handleAudit} 
                disabled={auditing}
                className="w-full py-4"
              >
                {auditing ? 'Auditing...' : <><Cpu size={18} /> Run AI Audit</>}
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2 uppercase tracking-wider">
            <ImageIcon size={16} className="text-[#6B7280]" /> {mode === 'generate' ? 'Visual Concept' : 'Audit Target'}
          </h3>
          <div className="aspect-square bg-[#F9FAFB] rounded-xl overflow-hidden border border-[#E5E7EB] flex items-center justify-center relative group">
            {mode === 'generate' ? (
              imageUrl ? (
                <img src={imageUrl} alt="Generated Design" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-center space-y-2 text-[#9CA3AF]">
                  <Sparkles size={48} className="mx-auto opacity-20" />
                  <p className="text-xs">Your design will appear here</p>
                </div>
              )
            ) : (
              auditImage ? (
                <img src={auditImage} alt="Audit Target" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2 text-[#9CA3AF]">
                  <Upload size={48} className="mx-auto opacity-20" />
                  <p className="text-xs">Upload an image to audit</p>
                </div>
              )
            )}
            {(generating || auditing) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <Sparkles size={32} className="text-[#4F46E5]" />
                </motion.div>
              </div>
            )}
          </div>
          {imageUrl && mode === 'generate' && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">Save to Portfolio</Button>
                <Button variant="outline" onClick={() => setShowEditor(true)} className="flex-1">
                  <Palette size={16} /> Edit Design
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowShareModal(true)} className="w-full">Share Design</Button>
            </div>
          )}
        </div>

        {showEditor && imageUrl && (
          <ImageEditor 
            imageUrl={imageUrl} 
            onSave={(newUrl) => {
              setImageUrl(newUrl);
              setShowEditor(false);
            }} 
            onClose={() => setShowEditor(false)} 
          />
        )}

        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2 uppercase tracking-wider">
            <Palette size={16} className="text-[#6B7280]" /> {mode === 'generate' ? 'Brand Strategy Package' : 'Audit Report'}
          </h3>
          <Card className="h-[400px] overflow-y-auto bg-[#F9FAFB] border-dashed border-2 p-6">
            {mode === 'generate' ? (
              ideas ? (
                <div className="prose prose-sm max-w-none text-[#4B5563]">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {ideas}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#9CA3AF] space-y-2">
                  <BookOpen size={32} className="opacity-20" />
                  <p className="text-xs">AI will provide a full Brand Strategy Package including color psychology, materiality, and market positioning.</p>
                </div>
              )
            ) : (
              auditResult ? (
                <div className="prose prose-sm max-w-none text-[#4B5563]">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {auditResult}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#9CA3AF] space-y-2">
                  <Cpu size={32} className="opacity-20" />
                  <p className="text-xs">Run an AI Audit to get a trend score and designated tweak suggestions.</p>
                </div>
              )
            )}
          </Card>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#111827]">Share Design</h3>
                <button onClick={() => setShowShareModal(false)} className="text-[#9CA3AF] hover:text-[#111827]">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => handleShare('twitter')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center text-[#1DA1F2] group-hover:scale-110 transition-transform">
                    <Twitter size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Twitter</span>
                </button>
                <button 
                  onClick={() => handleShare('facebook')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] group-hover:scale-110 transition-transform">
                    <Facebook size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Facebook</span>
                </button>
                <button 
                  onClick={() => handleShare('copy')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform",
                    copied ? "bg-[#DEF7EC] text-[#03543F]" : "bg-[#F3F4F6] text-[#4B5563]"
                  )}>
                    {copied ? <Check size={24} /> : <Copy size={24} />}
                  </div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                    {copied ? 'Copied' : 'Link'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import * as fabric from 'fabric';

function ImageEditor({ imageUrl, onSave, onClose }: { imageUrl: string; onSave: (dataUrl: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<'brush' | 'text'>('brush');

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: '#fff'
    });

    fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
      // Scale image to fit canvas
      const scale = Math.min(600 / (img.width || 1), 600 / (img.height || 1));
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: (600 - (img.width || 0) * scale) / 2,
        top: (600 - (img.height || 0) * scale) / 2,
        selectable: false
      });
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;
    
    if (activeTool === 'brush') {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.width = 5;
      fabricCanvas.freeDrawingBrush.color = '#4F46E5';
    } else {
      fabricCanvas.isDrawingMode = false;
    }
  }, [activeTool, fabricCanvas]);

  const addText = () => {
    if (!fabricCanvas) return;
    const text = new fabric.IText('Type here...', {
      left: 100,
      top: 100,
      fontFamily: 'Inter',
      fontSize: 40,
      fill: '#000'
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    setActiveTool('text');
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1
    });
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-w-4xl w-full"
      >
        <header className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-[#111827]">Design Editor</h3>
            <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
              <button 
                onClick={() => setActiveTool('brush')}
                className={cn("p-2 rounded-lg transition-all", activeTool === 'brush' ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#6B7280]")}
              >
                <Palette size={18} />
              </button>
              <button 
                onClick={addText}
                className={cn("p-2 rounded-lg transition-all", activeTool === 'text' ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#6B7280]")}
              >
                <Type size={18} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Apply Changes</Button>
          </div>
        </header>
        <div className="flex-1 bg-[#F9FAFB] p-8 flex items-center justify-center overflow-auto">
          <div className="shadow-xl rounded-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WarRoomView({ warRoom, onClose, profile }: { warRoom: WarRoom; onClose: () => void; profile: UserProfile | null }) {
  const [design, setDesign] = useState<Design | null>(null);
  const [comments, setComments] = useState<WarRoomComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [pinPos, setPinPos] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const fetchDesign = async () => {
      const d = await getDoc(doc(db, 'designs', warRoom.designId));
      if (d.exists()) setDesign({ id: d.id, ...d.data() } as Design);
    };
    fetchDesign();

    const q = query(collection(db, 'warRooms', warRoom.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarRoomComment)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'comments'));
    return unsubscribe;
  }, [warRoom.id, warRoom.designId]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPinPos({ x, y });
  };

  const handleAddComment = async () => {
    if (!profile || !newComment.trim() || !pinPos) return;
    try {
      const comment: Omit<WarRoomComment, 'id'> = {
        warRoomId: warRoom.id,
        userId: profile.uid,
        userName: profile.displayName,
        userPhoto: profile.photoURL,
        text: newComment,
        x: pinPos.x,
        y: pinPos.y,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'warRooms', warRoom.id, 'comments'), comment);
      setNewComment('');
      setPinPos(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

  if (!design) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <header className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
            <Plus className="rotate-45" size={24} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#111827]">War Room: {design.title}</h2>
            <p className="text-xs text-[#6B7280]">Collaborative Design Session</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-4">
            {warRoom.participants.map((p, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#F3F4F6] flex items-center justify-center text-[10px] font-bold">
                {p.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <Button variant="outline" className="text-xs">Invite</Button>
          <Button className="text-xs">Export Feedback</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-[#F9FAFB] p-8 overflow-auto flex items-center justify-center relative">
          <div 
            className="relative max-w-2xl w-full shadow-2xl rounded-2xl overflow-hidden cursor-crosshair"
            onClick={handleImageClick}
          >
            <img src={design.imageUrl} alt={design.title} className="w-full h-auto" referrerPolicy="no-referrer" />
            
            {comments.map(comment => (
              <motion.div 
                key={comment.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute w-6 h-6 bg-[#4F46E5] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white group"
                style={{ left: `${comment.x}%`, top: `${comment.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <MapPin size={12} fill="currentColor" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white text-[#111827] p-3 rounded-xl shadow-xl border border-[#E5E7EB] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={comment.userPhoto} alt={comment.userName} className="w-4 h-4 rounded-full" />
                    <span className="text-[10px] font-bold">{comment.userName}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{comment.text}</p>
                </div>
              </motion.div>
            ))}

            {pinPos && (
              <div 
                className="absolute w-6 h-6 bg-[#EF4444] rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse"
                style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <Plus size={12} className="text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="w-80 border-l border-[#E5E7EB] bg-white flex flex-col">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="font-bold text-sm text-[#111827] mb-4">Comments</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] text-center py-8">Click on the design to leave a pinned comment.</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <img src={comment.userPhoto} alt={comment.userName} className="w-5 h-5 rounded-full" />
                      <span className="text-[10px] font-bold text-[#111827]">{comment.userName}</span>
                    </div>
                    <p className="text-xs text-[#4B5563] bg-[#F3F4F6] p-2 rounded-lg">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 mt-auto space-y-4">
            {pinPos ? (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">New Pin at {Math.round(pinPos.x)}%, {Math.round(pinPos.y)}%</p>
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your feedback..."
                  className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 ring-[#4F46E5]/10 min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPinPos(null)} className="flex-1 text-xs">Cancel</Button>
                  <Button onClick={handleAddComment} className="flex-1 text-xs">Post Pin</Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-[#F3F4F6] rounded-xl">
                <p className="text-xs text-[#6B7280]">Click anywhere on the design to start a discussion.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesignDetailModal({ design, onClose, profile }: { design: Design; onClose: () => void; profile: UserProfile | null }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [minting, setMinting] = useState(false);
  const [isMinted, setIsMinted] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('designId', '==', design.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reviews'));
    return unsubscribe;
  }, [design.id]);

  const handlePurchase = async () => {
    if (!profile) {
      alert("Please sign in to purchase designs.");
      return;
    }
    if (profile.uid === design.authorId) {
      alert("You cannot purchase your own design.");
      return;
    }
    if (profile.walletBalance < design.price) {
      alert("Insufficient funds in your wallet.");
      return;
    }

    setPurchasing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const buyerRef = doc(db, 'users', profile.uid);
        const sellerRef = doc(db, 'users', design.authorId);
        const designRef = doc(db, 'designs', design.id);

        const buyerDoc = await transaction.get(buyerRef);
        if (!buyerDoc.exists()) throw new Error("Buyer profile not found.");
        const buyerData = buyerDoc.data() as UserProfile;

        if (buyerData.walletBalance < design.price) {
          throw new Error("Insufficient funds.");
        }

        const platformFee = design.price * 0.1; // 10% fee
        const sellerEarnings = design.price - platformFee;

        // Update Buyer
        transaction.update(buyerRef, { 
          walletBalance: increment(-design.price) 
        });

        // Update Seller
        transaction.update(sellerRef, { 
          walletBalance: increment(sellerEarnings),
          reputationScore: increment(10) // Boost reputation on sale
        });

        // Update Design
        transaction.update(designRef, { status: 'sold' });

        // Create Transaction Records
        const buyerTxRef = doc(collection(db, 'transactions'));
        transaction.set(buyerTxRef, {
          userId: profile.uid,
          amount: design.price,
          type: 'debit',
          description: `Purchased design: ${design.title}`,
          timestamp: new Date().toISOString()
        });

        const sellerTxRef = doc(collection(db, 'transactions'));
        transaction.set(sellerTxRef, {
          userId: design.authorId,
          amount: sellerEarnings,
          type: 'credit',
          description: `Sold design: ${design.title}`,
          timestamp: new Date().toISOString()
        });
      });
      alert("Purchase successful!");
      onClose();
    } catch (error: any) {
      console.error("Purchase failed:", error);
      alert(error.message || "Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleMint = async () => {
    setMinting(true);
    // Simulate minting delay
    await new Promise(r => setTimeout(r, 2000));
    setIsMinted(true);
    setMinting(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !comment.trim()) return;
    setSubmitting(true);
    try {
      const newReview: Omit<Review, 'id'> = {
        designId: design.id,
        userId: profile.uid,
        userName: profile.displayName,
        userPhoto: profile.photoURL,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'reviews'), newReview);
      setComment('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
      >
        <div className="md:w-1/2 bg-[#F9FAFB] flex items-center justify-center p-8 border-r border-[#E5E7EB]">
          <img src={design.imageUrl} alt={design.title} className="w-full h-auto rounded-2xl shadow-lg object-cover aspect-[3/4]" referrerPolicy="no-referrer" />
        </div>
        
        <div className="md:w-1/2 p-8 flex flex-col h-full overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#111827]">{design.title}</h2>
              <p className="text-sm text-[#6B7280]">by {design.authorName}</p>
            </div>
            <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827] p-2">
              <Plus className="rotate-45" size={24} />
            </button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Description</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">{design.description}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F3F4F6] rounded-2xl">
              <span className="text-2xl font-bold text-[#4F46E5]">${design.price}</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleMint} disabled={minting || isMinted}>
                  {minting ? 'Minting...' : isMinted ? <><ShieldCheck size={16} /> Minted</> : <><Zap size={16} /> Mint NFT</>}
                </Button>
                <Button onClick={handlePurchase} disabled={purchasing}>
                  {purchasing ? 'Processing...' : 'Purchase Design'}
                </Button>
              </div>
            </div>

            {isMinted && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-[10px] text-green-700 font-bold">
                <ShieldCheck size={14} /> Verified Creative Asset on Layer 2 (Base)
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-[#E5E7EB]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Reviews ({reviews.length})</h3>
              
              {profile && (
                <form onSubmit={handleSubmitReview} className="space-y-3 bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E7EB]">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        type="button"
                        onClick={() => setRating(star)}
                        className={cn("transition-colors", star <= rating ? "text-yellow-400" : "text-[#E5E7EB]")}
                      >
                        <Star size={20} fill={star <= rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a review..."
                    className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:ring-2 ring-[#4F46E5]/10 min-h-[80px]"
                  />
                  <Button type="submit" disabled={submitting || !comment.trim()} className="w-full py-2 text-xs">
                    {submitting ? 'Submitting...' : 'Post Review'}
                  </Button>
                </form>
              )}

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center py-8 text-sm text-[#9CA3AF]">No reviews yet. Be the first to rate this design!</p>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={review.userPhoto} alt={review.userName} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                          <span className="text-xs font-bold text-[#111827]">{review.userName}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={12} className={star <= review.rating ? "text-yellow-400" : "text-[#E5E7EB]"} fill={star <= review.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed">{review.comment}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MarketView({ profile }: { profile: UserProfile | null; key?: string }) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let q = query(collection(db, 'designs'), where('status', '==', 'published'));
    
    if (sortBy === 'newest') {
      q = query(q, orderBy('createdAt', 'desc'));
    } else if (sortBy === 'price_low') {
      q = query(q, orderBy('price', 'asc'));
    } else if (sortBy === 'price_high') {
      q = query(q, orderBy('price', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDesigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Design)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'designs'));
    return unsubscribe;
  }, [sortBy]);

  const filteredDesigns = designs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleShare = (design: Design, platform: string) => {
    const url = window.location.href; // In a real app, this would be the design detail URL
    const text = `Check out this awesome design "${design.title}" on ODDesigns!`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      case 'instagram':
        // Instagram doesn't have a direct web sharer, so we copy link
        navigator.clipboard.writeText(url);
        alert("Instagram doesn't support direct web sharing. The link has been copied to your clipboard!");
        break;
    }
    setSharingId(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-[#111827]">Marketplace</h2>
          <p className="text-sm text-[#6B7280]">Discover and buy unique brand designs.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
            <input 
              type="text" 
              placeholder="Search designs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none focus:ring-2 ring-[#4F46E5]/10"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none focus:ring-2 ring-[#4F46E5]/10 font-bold text-[#4B5563]"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] bg-[#E5E7EB] rounded-xl animate-pulse" />)}
        </div>
      ) : filteredDesigns.length === 0 ? (
        <Card className="py-20 text-center space-y-4">
          <ShoppingBag size={48} className="mx-auto text-[#E5E7EB]" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#111827]">No designs found</h3>
            <p className="text-sm text-[#6B7280]">Try a different search or be the first to publish!</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDesigns.map(design => (
            <motion.div 
              key={design.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="group relative"
            >
              <Card 
                className="p-0 overflow-hidden border-[#E5E7EB] shadow-sm group-hover:shadow-md transition-all"
                onClick={() => setSelectedDesign(design)}
              >
                <div className="aspect-[3/4] relative">
                  <img src={design.imageUrl} alt={design.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Badge variant="success">${design.price}</Badge>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingId(sharingId === design.id ? null : design.id);
                      }}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-[#4B5563] hover:text-[#4F46E5] transition-colors"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>

                  {sharingId === design.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-12 right-3 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-2 z-10 flex flex-col gap-1 min-w-[120px]"
                    >
                      <button onClick={() => handleShare(design, 'twitter')} className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] rounded-lg text-[10px] font-bold text-[#4B5563]">
                        <Twitter size={12} className="text-[#1DA1F2]" /> Twitter
                      </button>
                      <button onClick={() => handleShare(design, 'facebook')} className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] rounded-lg text-[10px] font-bold text-[#4B5563]">
                        <Facebook size={12} className="text-[#1877F2]" /> Facebook
                      </button>
                      <button onClick={() => handleShare(design, 'instagram')} className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] rounded-lg text-[10px] font-bold text-[#4B5563]">
                        <Instagram size={12} className="text-[#E4405F]" /> Instagram
                      </button>
                      <button onClick={() => handleShare(design, 'copy')} className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] rounded-lg text-[10px] font-bold text-[#4B5563]">
                        {copied ? <Check size={12} className="text-[#059669]" /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </motion.div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <Button className="w-full bg-white text-[#4F46E5] hover:bg-zinc-100 border-none">Buy Now</Button>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-bold text-sm text-[#111827] truncate">{design.title}</h4>
                  <p className="text-[11px] text-[#6B7280]">by {design.authorName}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedDesign && (
          <DesignDetailModal 
            design={selectedDesign} 
            onClose={() => setSelectedDesign(null)} 
            profile={profile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CollabsView({ profile }: { profile: UserProfile | null; key?: string }) {
  const [collabs, setCollabs] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeWarRoom, setActiveWarRoom] = useState<WarRoom | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'collaborations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCollabs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collaboration)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'collaborations'));
    return unsubscribe;
  }, []);

  const handleStartWarRoom = async (collab: Collaboration) => {
    if (!profile) return;
    // For demo, we'll pick a random design to start a war room
    const q = query(collection(db, 'designs'), where('status', '==', 'published'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      alert("No published designs found to start a War Room. Please publish a design first!");
      return;
    }
    const designId = snapshot.docs[0].id;
    
    const newWarRoom: Omit<WarRoom, 'id'> = {
      designId,
      participants: [profile.uid, collab.authorId],
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    const docRef = await addDoc(collection(db, 'warRooms'), newWarRoom);
    setActiveWarRoom({ id: docRef.id, ...newWarRoom });
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-[#111827]">Collaborators</h2>
          <p className="text-sm text-[#6B7280]">Connect with artists, brands, and influencers.</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Post Opportunity</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {collabs.map(collab => (
          <Card key={collab.id} className="hover:border-[#4F46E5]/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <Badge>{collab.type.replace(/_/g, ' ')}</Badge>
              <span className="text-[10px] text-[#9CA3AF] font-medium">{new Date(collab.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#1F2937] group-hover:text-[#4F46E5] transition-colors">{collab.title}</h3>
            <p className="text-[#6B7280] text-xs line-clamp-3 mb-6 leading-relaxed">{collab.content}</p>
            <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[10px] font-bold text-[#4B5563]">
                  {collab.authorName[0]}
                </div>
                <span className="text-[11px] font-semibold text-[#4B5563]">{collab.authorName}</span>
              </div>
              <Button variant="primary" className="text-[10px] px-3 py-1.5" onClick={() => handleStartWarRoom(collab)}>
                <MessageSquare size={12} /> Start War Room
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {activeWarRoom && (
        <WarRoomView 
          warRoom={activeWarRoom} 
          onClose={() => setActiveWarRoom(null)} 
          profile={profile} 
        />
      )}
    </div>
  );
}

function WalletView({ profile }: { profile: UserProfile | null; key?: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'transactions'), where('userId', '==', profile.uid), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });
    return unsubscribe;
  }, [profile]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-[#111827]">Wallet</h2>
        <p className="text-sm text-[#6B7280]">Manage your earnings and payments.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-[#4F46E5] to-[#3730A3] text-white border-none p-8 flex flex-col justify-between min-h-[200px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="space-y-1 relative">
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Available Balance</p>
            <h3 className="text-4xl font-bold">${profile?.walletBalance.toFixed(2) || '0.00'}</h3>
          </div>
          <div className="flex gap-2 relative">
            <Button variant="secondary" className="flex-1 bg-white text-[#4F46E5] hover:bg-zinc-100 border-none">Withdraw</Button>
            <Button variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10">Add Funds</Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-center items-center text-center p-8 space-y-4">
          <div className="w-14 h-14 bg-[#F3F4F6] rounded-full flex items-center justify-center">
            <DollarSign size={28} className="text-[#9CA3AF]" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Total Earnings</p>
            <p className="text-2xl font-bold text-[#059669]">+$1,240.00</p>
          </div>
        </Card>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-[#111827]">Recent Transactions</h3>
        <Card className="p-0 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-[#9CA3AF] space-y-2">
              <Wallet size={32} className="mx-auto opacity-20" />
              <p className="text-sm">No transactions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      tx.type === 'credit' ? "bg-[#DEF7EC] text-[#03543F]" : "bg-[#FDE8E8] text-[#9B1C1C]"
                    )}>
                      {tx.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1F2937]">{tx.description}</p>
                      <p className="text-[10px] text-[#9CA3AF] font-medium">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={cn(
                    "font-bold text-sm",
                    tx.type === 'credit' ? "text-[#059669]" : "text-[#D33535]"
                  )}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function AnalyticsView({ profile }: { profile: UserProfile | null; key?: string }) {
  const data = [
    { name: 'Mon', sales: 400, views: 2400 },
    { name: 'Tue', sales: 300, views: 1398 },
    { name: 'Wed', sales: 200, views: 9800 },
    { name: 'Thu', sales: 278, views: 3908 },
    { name: 'Fri', sales: 189, views: 4800 },
    { name: 'Sat', sales: 239, views: 3800 },
    { name: 'Sun', sales: 349, views: 4300 },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-[#111827]">Analytics</h2>
        <p className="text-sm text-[#6B7280]">Track your brand's performance and growth.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Views" value="24.5k" change="+12%" />
        <StatCard label="Design Sales" value="142" change="+5%" />
        <StatCard label="Conversion Rate" value="3.2%" change="-2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Sales Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Audience Reach</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, change }: { label: string; value: string; change: string }) {
  const isPositive = change.startsWith('+');
  return (
    <Card className="p-5 space-y-2">
      <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-2xl font-bold text-[#111827]">{value}</h4>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          isPositive ? "bg-[#DEF7EC] text-[#03543F]" : "bg-[#FDE8E8] text-[#9B1C1C]"
        )}>
          {change}
        </span>
      </div>
    </Card>
  );
}

function ProfileView({ profile, setProfile }: { profile: UserProfile | null; setProfile: (p: UserProfile) => void; key?: string }) {
  const [designs, setDesigns] = useState<Design[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'designs'), where('authorId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDesigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Design)));
    });
    return unsubscribe;
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md">
          <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="text-center md:text-left space-y-4 flex-1">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#111827]">{profile.displayName}</h2>
            <p className="text-sm text-[#6B7280] font-medium">{profile.email}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <Badge>{profile.role.replace('_', ' ')}</Badge>
            <Badge variant="success">Verified Creator</Badge>
          </div>
          <p className="text-xs text-[#4B5563] max-w-md leading-relaxed">{profile.bio || "No bio yet. Tell the world about your brand identity."}</p>
          <div className="flex gap-2">
            <Button variant="outline" className="text-[11px] px-3 py-1.5">Edit Profile</Button>
            <Button variant="outline" className="text-[11px] px-3 py-1.5"><Plus size={14} /> Add Portfolio</Button>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#111827]">Your Portfolio</h3>
          <p className="text-[#9CA3AF] text-[11px] font-bold uppercase tracking-wider">{designs.length} Designs</p>
        </div>
        
        {designs.length === 0 ? (
          <Card className="py-20 text-center space-y-4 border-dashed border-2 bg-[#F9FAFB]">
            <ImageIcon size={48} className="mx-auto text-[#E5E7EB]" />
            <p className="text-sm text-[#6B7280]">Your portfolio is empty. Start creating in the Design Lab!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map(design => (
              <Card key={design.id} className="p-0 overflow-hidden border-[#E5E7EB] group">
                <div className="aspect-square relative">
                  <img src={design.imageUrl} alt={design.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <Button className="w-full bg-white text-[#4F46E5] hover:bg-zinc-100 border-none text-xs">View Details</Button>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm text-[#111827] truncate">{design.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={design.status === 'published' ? 'success' : 'default'}>{design.status}</Badge>
                    <span className="text-[10px] font-bold text-[#4F46E5]">${design.price}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

