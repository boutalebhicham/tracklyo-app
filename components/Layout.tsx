import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  FolderOpen, 
  Wallet, 
  LogOut,
  Zap,
  User as UserIcon,
  Phone,
  ChevronDown,
  Check,
  X,
  Plus,
  Crown,
  Users,
  Star,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User;
  onSwitchRole: () => void;
  responsablesList: User[];
  selectedResponsableId: string;
  onSelectResponsable: (id: string) => void;
  patronUser: User; 
  onAddResponsable: (name: string, phone: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  currentUser,
  onSwitchRole,
  responsablesList,
  selectedResponsableId,
  onSelectResponsable,
  patronUser,
  onAddResponsable
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  
  // Modals States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'assistant', label: 'Assistant IA', icon: Sparkles }, // New Tab
    { id: 'recaps', label: 'Activité', icon: FileText },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'documents', label: 'Fichiers', icon: FolderOpen },
    { id: 'finances', label: 'Budget', icon: Wallet },
  ];

  // Logic to handle "Add Employee" click
  const handleAddClick = () => {
      // 1 employé = Gratuit/Inclus
      // >1 employés = Payant
      if (responsablesList.length >= 1) {
          setIsUpgradeModalOpen(true);
      } else {
          setIsAddUserModalOpen(true);
      }
  };

  const submitAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if(newUserName) {
          onAddResponsable(newUserName, newUserPhone);
          setIsAddUserModalOpen(false);
          setNewUserName('');
          setNewUserPhone('');
          setIsSwitcherOpen(false); // Close mobile sheet if open
      }
  };

  const handleUpgradeConfirm = () => {
      setIsUpgradeModalOpen(false);
      // Simulate successful payment/upgrade -> Open add modal
      setTimeout(() => setIsAddUserModalOpen(true), 300);
  };

  // Déterminer qui appeler sur WhatsApp
  const targetContact = currentUser.role === UserRole.PATRON 
    ? responsablesList.find(r => r.id === selectedResponsableId) // Le patron appelle le responsable sélectionné
    : patronUser; // Le responsable appelle le patron

  const selectedResponsable = responsablesList.find(r => r.id === selectedResponsableId);

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans relative selection:bg-blue-500/30">
      
      {/* --- Background Ambient Effects --- */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply opacity-60 z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply opacity-60 z-0"></div>


      {/* --- DESKTOP NAVIGATION (Floating Dark Glass Sidebar) --- */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-[260px] bg-[#0F172A]/95 backdrop-blur-xl text-slate-300 rounded-[2.5rem] flex-col border border-slate-700/50 shadow-2xl shadow-slate-900/20 z-50 transition-all duration-300">
        
        {/* Logo Area */}
        <div className="p-8 pt-10 flex items-center gap-3 text-white tracking-tight">
          <span className="font-normal text-3xl tracking-tighter"><span className="font-bold">Track</span>lyo<span className="text-blue-500">.</span></span>
        </div>

        {/* User Profile / Switcher Snippet */}
        <div className="px-6 mb-6">
          {currentUser.role === UserRole.PATRON ? (
             <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Suivi de :</p>
                    <button onClick={handleAddClick} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold px-2 py-1 rounded-md transition-colors flex items-center gap-1 group">
                        <Plus size={10} className="group-hover:text-white transition-colors" /> <span className="group-hover:text-white transition-colors">Ajouter</span>
                    </button>
                </div>
                <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                    {responsablesList.map(resp => (
                        <button 
                            key={resp.id}
                            onClick={() => onSelectResponsable(resp.id)}
                            className={`flex items-center gap-3 p-2 rounded-2xl border transition-all ${selectedResponsableId === resp.id ? 'bg-white/10 border-blue-500/50 text-white' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                        >
                            <img src={resp.avatar} alt={resp.name} className="w-8 h-8 rounded-full border border-slate-600 object-cover" />
                            <span className="text-sm font-bold truncate">{resp.name.split(' ')[0]}</span>
                            {selectedResponsableId === resp.id && <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>}
                        </button>
                    ))}
                    {responsablesList.length === 0 && (
                        <div className="text-xs text-slate-600 italic px-2 py-4 text-center border border-dashed border-slate-800 rounded-xl">
                            Aucun responsable
                        </div>
                    )}
                </div>
             </div>
          ) : (
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manager</span>
                </div>
            </div>
          )}
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
            
            {/* Mobile Top Context & Switcher */}
            <div className="lg:hidden flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {currentUser.role === UserRole.PATRON ? (
                        // Mobile Modern Switcher for Patron
                        <button 
                            onClick={() => setIsSwitcherOpen(true)}
                            className="flex items-center gap-2 bg-white/80 backdrop-blur-md pl-1.5 pr-4 py-1.5 rounded-full shadow-sm border border-slate-200 active:scale-95 transition-transform"
                        >
                            <div className="relative">
                                {selectedResponsable ? (
                                    <img src={selectedResponsable.avatar} alt="Current" className="w-9 h-9 rounded-full border border-slate-100 object-cover" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <Users size={16} className="text-slate-400"/>
                                    </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 rounded-full p-0.5 border-2 border-white">
                                    <UserIcon size={8} className="text-white"/>
                                </div>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-none mb-0.5">Suivi de</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-sm leading-none">
                                        {selectedResponsable ? selectedResponsable.name.split(' ')[0] : 'Aucun'}
                                    </span>
                                    <ChevronDown size={14} className="text-indigo-500 stroke-[3]"/>
                                </div>
                            </div>
                        </button>
                    ) : (
                        // Standard Header for Manager
                        <div className="flex items-center gap-3">
                            <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Espace Manager</p>
                                <h2 className="text-lg font-bold text-slate-900 leading-none">{currentUser.name.split(' ')[0]}</h2>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={onSwitchRole} className="p-2.5 bg-white/80 backdrop-blur-md rounded-full text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 active:bg-slate-50">
                    <LogOut size={20} />
                </button>
            </div>

            {children}
        </div>
      </main>

      {/* --- MOBILE DIRECTOR SWITCHER (BOTTOM SHEET) --- */}
      {isSwitcherOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end lg:hidden">
              <div 
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                  onClick={() => setIsSwitcherOpen(false)}
              ></div>
              
              <div className="relative bg-[#F8FAFC] rounded-t-[2.5rem] p-6 pb-12 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.2)] animate-slide-up overflow-hidden max-h-[80vh] flex flex-col">
                   <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-8 opacity-50 flex-shrink-0"></div>
                   
                   <div className="flex justify-between items-center mb-6 px-2 flex-shrink-0">
                       <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Vos Équipes</h3>
                       <button onClick={() => setIsSwitcherOpen(false)} className="p-2 bg-slate-200 rounded-full text-slate-600">
                           <X size={18} />
                       </button>
                   </div>

                   <div className="space-y-3 overflow-y-auto custom-scrollbar">
                       {responsablesList.map(resp => {
                           const isSelected = selectedResponsableId === resp.id;
                           return (
                               <button 
                                   key={resp.id}
                                   onClick={() => {
                                       onSelectResponsable(resp.id);
                                       setIsSwitcherOpen(false);
                                   }}
                                   className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all active:scale-[0.98] ${
                                       isSelected 
                                       ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' 
                                       : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                                   }`}
                               >
                                   <div className={`relative p-0.5 rounded-full border-2 ${isSelected ? 'border-indigo-500' : 'border-transparent'}`}>
                                       <img src={resp.avatar} alt={resp.name} className="w-12 h-12 rounded-full object-cover bg-slate-100" />
                                   </div>
                                   
                                   <div className="flex-1 text-left">
                                       <p className={`text-base font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{resp.name}</p>
                                       <p className={`text-xs font-medium ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>Directeur</p>
                                   </div>

                                   {isSelected && (
                                       <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-md">
                                           <Check size={16} strokeWidth={3} />
                                       </div>
                                   )}
                               </button>
                           )
                       })}
                       
                       <button 
                           onClick={handleAddClick}
                           className="w-full flex items-center justify-center gap-2 p-4 rounded-[1.5rem] border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all"
                       >
                           <Plus size={20} /> Ajouter un collaborateur
                       </button>
                   </div>
              </div>
          </div>
      )}

      {/* --- MODAL: UPGRADE / PAYWALL (PREMIUM LOOK) --- */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
             <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-scale-in relative overflow-hidden border border-white/20">
                
                {/* Premium Header Background */}
                <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-amber-50 to-white/0"></div>
                <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-orange-400 rounded-full blur-[80px] opacity-20"></div>
                <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-yellow-400 rounded-full blur-[80px] opacity-20"></div>

                <div className="relative z-10 p-8 pt-10 text-center">
                    
                    {/* Crown Icon Container */}
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-[2rem] flex items-center justify-center shadow-lg shadow-orange-500/10 border border-white mb-6 relative">
                        <div className="absolute inset-0 rounded-[2rem] bg-white/40 backdrop-blur-sm"></div>
                        <Crown size={32} className="text-amber-500 fill-amber-500 relative z-10 drop-shadow-sm" />
                        <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                            PRO
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Débloquez le potentiel de votre équipe</h3>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
                        Votre offre actuelle est limitée à <span className="text-slate-900 font-bold">1 espace</span>. Passez au Pack Business pour une gestion sans limites.
                    </p>

                    <div className="space-y-4 mb-8">
                        {[
                            { icon: Users, text: "Nombre de responsables illimité" },
                            { icon: ShieldCheck, text: "Permissions & Rôles avancés" },
                            { icon: Star, text: "Support prioritaire 24/7" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                                <div className="bg-white p-2 rounded-xl text-amber-500 shadow-sm">
                                    <item.icon size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 text-left flex-1">{item.text}</span>
                                <Check size={16} className="text-emerald-500" />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleUpgradeConfirm}
                        className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-between items-center px-6 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        
                        <div className="relative flex flex-col items-start">
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pack Business</span>
                            <span className="text-lg leading-none">29,99€ <span className="text-xs font-normal opacity-70">/mois</span></span>
                        </div>
                        <div className="relative bg-white/10 p-2 rounded-full">
                            <ArrowRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    <button 
                        onClick={() => setIsUpgradeModalOpen(false)}
                        className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Non merci, annuler
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* --- MODAL: ADD NEW USER (CLEAN PRO LOOK) --- */}
      {isAddUserModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-scale-in flex flex-col overflow-hidden">
                 
                 {/* Header */}
                 <div className="p-8 pb-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                    <div>
                        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-indigo-600 mb-4">
                            <Users size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nouveau Profil</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">Créez un espace dédié pour un collaborateur.</p>
                    </div>
                    <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 bg-white border border-slate-100 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                 </div>
                 
                 <form onSubmit={submitAddUser} className="p-8 space-y-6">
                    
                    <div className="space-y-4">
                        <div className="group">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Identité</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Nom du responsable"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Contact</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="tel"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Numéro WhatsApp (ex: 336...)"
                                    value={newUserPhone}
                                    onChange={(e) => setNewUserPhone(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button type="submit" className="w-full py-4 text-base font-bold bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex justify-center items-center gap-2">
                             <Plus size={20} strokeWidth={2.5} /> Créer l'accès responsable
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}

      {/* --- WHATSAPP BUBBLE (Fixed Bottom Right) --- */}
      {targetContact?.phoneNumber && (
        <a 
            href={`https://wa.me/${targetContact.phoneNumber.replace(/\s+/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed z-[50] bottom-24 right-4 lg:bottom-8 lg:right-8 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:shadow-green-500/40 hover:-translate-y-1 transition-all active:scale-95 group flex items-center justify-center border-2 border-white/20 backdrop-blur-sm"
            title={`Appeler ${targetContact.name} sur WhatsApp`}
        >
            <Phone size={24} fill="currentColor" className="group-hover:animate-pulse" />
            <span className="absolute right-full mr-3 bg-white text-slate-800 text-xs font-bold px-2 py-1 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Appeler {targetContact.name.split(' ')[0]}
            </span>
        </a>
      )}

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