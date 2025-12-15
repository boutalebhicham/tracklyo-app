import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  FolderOpen, 
  Wallet, 
  LogOut,
  Zap,
  User as UserIcon
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User;
  onSwitchRole: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  currentUser,
  onSwitchRole
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'recaps', label: 'Activité', icon: FileText },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'documents', label: 'Fichiers', icon: FolderOpen },
    { id: 'finances', label: 'Budget', icon: Wallet },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans relative selection:bg-blue-500/30">
      
      {/* --- Background Ambient Effects --- */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply opacity-60 z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply opacity-60 z-0"></div>


      {/* --- DESKTOP NAVIGATION (Floating Dark Glass Sidebar) --- */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-[260px] bg-[#0F172A]/95 backdrop-blur-xl text-slate-300 rounded-[2.5rem] flex-col border border-slate-700/50 shadow-2xl shadow-slate-900/20 z-50 transition-all duration-300">
        
        {/* Logo Area (Icon Removed) */}
        <div className="p-8 pt-10 flex items-center gap-3 text-white tracking-tight">
          <span className="font-normal text-3xl tracking-tighter"><span className="font-bold">Track</span>lyo<span className="text-blue-500">.</span></span>
        </div>

        {/* User Profile Snippet (Compact) */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="relative">
              <img 
                src={currentUser.avatar} 
                alt="User" 
                className="w-10 h-10 rounded-full border-2 border-slate-700 group-hover:border-blue-500 transition-colors object-cover"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0F172A] rounded-full"></div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentUser.role === 'PATRON' ? 'Admin' : 'Manager'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/20' 
                    : 'hover:bg-white/5 hover:text-white text-slate-400'}
                `}
              >
                <item.icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-white' : 'group-hover:text-blue-400'}`} />
                <span>{item.label}</span>
                {isActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
              </button>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-6">
          <button 
            onClick={onSwitchRole}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl text-sm font-semibold transition-all border border-white/5 group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/>
            <span>Changer de Rôle</span>
          </button>
        </div>
      </aside>


      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 w-full lg:pl-[290px] relative z-10">
        <div className="max-w-7xl mx-auto h-full px-4 pt-8 lg:px-8 lg:pt-8 pb-32 lg:pb-8">
            
            {/* Mobile Top Context (User Greeting only, minimal) */}
            <div className="lg:hidden flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200 shadow-sm" />
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{currentUser.role === 'PATRON' ? 'Espace Patron' : 'Espace Manager'}</p>
                        <h2 className="text-lg font-bold text-slate-900 leading-none">{currentUser.name.split(' ')[0]}</h2>
                    </div>
                </div>
                <button onClick={onSwitchRole} className="p-2 bg-white rounded-full text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100">
                    <UserIcon size={20} />
                </button>
            </div>

            {children}
        </div>
      </main>


      {/* --- MOBILE NAVIGATION (Fixed Bottom Bar) --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 pb-safe px-2 z-50 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Background Watermark (Massive, Bold, Centered) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
            <span className="text-[3.5rem] font-black text-slate-900/5 tracking-wider uppercase select-none font-sans leading-none transform scale-y-110">
                Tracklyo
            </span>
        </div>

        <div className="flex items-center justify-around w-full max-w-md mx-auto relative z-10 py-2">
           {navItems.map((item) => {
             const isActive = activeTab === item.id;
             return (
               <button
                 key={item.id}
                 onClick={() => onTabChange(item.id)}
                 className={`
                    relative flex flex-col items-center justify-center gap-1 py-3 px-2 w-full transition-all duration-300 group
                    ${isActive ? 'text-blue-600' : 'text-slate-500 active:text-slate-700'}
                 `}
               >
                 {/* Active Indicator Background Pill */}
                 {isActive && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-10 bg-blue-50/80 rounded-2xl -z-10 animate-scale-in"></div>
                 )}
                 
                 <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-active:scale-95'}`}
                 />
                 <span className={`text-[9px] font-bold tracking-tight transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {item.label}
                 </span>
               </button>
             )
           })}
        </div>
      </nav>

    </div>
  );
};

export default Layout;