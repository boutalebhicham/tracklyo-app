import React from 'react';
import { 
  TrendingUp, 
  CalendarClock, 
  FileCheck, 
  ArrowRight,
  Plus,
  ArrowUpRight,
  Zap,
  Mic,
  Sparkles
} from 'lucide-react';
import { AppData, UserRole, User, CurrencyCode, TransactionType } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardProps {
  data: AppData;
  currentUser: User;
  onNavigate: (tab: string) => void;
}

// Taux de change (doit correspondre à Finances.tsx pour la cohérence)
const RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.09,
  XOF: 655.96
};

const convert = (amount: number, from: string, to: string) => {
  const rateFrom = RATES[from] || 1;
  const rateTo = RATES[to] || 1;
  return (amount / rateFrom) * rateTo;
};

const Dashboard: React.FC<DashboardProps> = ({ data, currentUser, onNavigate }) => {
  // Calcul du solde en convertissant tout en EUR par défaut pour l'affichage global
  const totalBudget = data.transactions
    .filter(t => t.type === TransactionType.BUDGET_ADD)
    .reduce((sum, t) => sum + convert(t.amount, t.currency, 'EUR'), 0);

  const totalExpenses = data.transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + convert(t.amount, t.currency, 'EUR'), 0);

  const balance = totalBudget - totalExpenses;
  const lastRecap = data.recaps[0];
  const nextEvent = data.events
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-10 animate-slide-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">{currentUser.name.split(' ')[0]}</span>.
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Voici ce qui se passe aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <p className="text-sm font-bold text-slate-700 capitalize">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Main Balance Card */}
        <div 
          onClick={() => onNavigate('finances')}
          className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-violet-900/20 cursor-pointer group transition-all duration-500 hover:shadow-violet-900/30 hover:-translate-y-1 md:col-span-3 lg:col-span-1 min-h-[320px] flex flex-col justify-between"
        >
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-500/40 transition-colors duration-500"></div>
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-indigo-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 flex justify-between items-start">
             <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <Zap className="text-yellow-300" size={24} fill="currentColor" />
             </div>
             <div className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                <TrendingUp size={14} />
                <span className="text-xs font-bold">+12% cette semaine</span>
             </div>
          </div>
          
          <div className="relative z-10">
            <span className="text-slate-400 font-medium tracking-wide">Trésorerie disponible (Est. EUR)</span>
            <div className="flex items-baseline gap-1 mt-2">
                <h3 className="text-5xl lg:text-6xl font-bold tracking-tight">{balance.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</h3>
                <span className="text-3xl text-violet-300">€</span>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Budget Total</p>
                  <p className="font-semibold">{totalBudget.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpRight size={24} />
              </div>
          </div>
        </div>

        {/* Action Grid & Secondary Widgets */}
        <div className="md:col-span-3 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* NEW: Voice Assistant Shortcut Card */}
            <div 
              onClick={() => onNavigate('assistant')}
              className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] p-6 text-white shadow-lg shadow-indigo-500/25 cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all relative overflow-hidden group flex items-center justify-between"
            >
               {/* Decor */}
               <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

               <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                      <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                          <Sparkles size={14} className="text-yellow-300 fill-yellow-300" />
                      </div>
                      <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Nouveau</span>
                  </div>
                  <h3 className="font-black text-2xl mb-1">Assistant Vocal</h3>
                  <p className="text-indigo-100 font-medium text-sm leading-snug max-w-sm">
                     "J'ai fini le chantier..." Dites-le, l'IA s'occupe de tout noter.
                  </p>
               </div>
               
               <div className="relative z-10 w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-indigo-600 transition-all duration-300 shadow-xl ml-4">
                  <Mic size={32} className="group-hover:scale-110 transition-transform" />
                  {/* Pulse Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse-slow"></div>
               </div>
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-2 flex flex-wrap gap-4">
                 {currentUser.role === UserRole.RESPONSABLE && (
                    <>
                        <button onClick={() => onNavigate('recaps')} className="flex-1 min-w-[160px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-violet-100 transition-all group flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={24} />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800">Récapitulatif</span>
                                <span className="text-xs text-slate-400">Ajouter un rapport</span>
                            </div>
                        </button>
                        <button onClick={() => onNavigate('finances')} className="flex-1 min-w-[160px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-rose-100 transition-all group flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={24} />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800">Dépense</span>
                                <span className="text-xs text-slate-400">Nouvelle transaction</span>
                            </div>
                        </button>
                    </>
                 )}
                 {currentUser.role === UserRole.PATRON && (
                     <button onClick={() => onNavigate('finances')} className="flex-1 min-w-[160px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all group flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-slate-800">Budget</span>
                            <span className="text-xs text-slate-400">Créditer un compte</span>
                        </div>
                    </button>
                 )}
                 <button onClick={() => onNavigate('calendar')} className="flex-1 min-w-[160px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all group flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-slate-800">Événement</span>
                        <span className="text-xs text-slate-400">Planifier une date</span>
                    </div>
                </button>
            </div>

            {/* Last Recap Widget */}
            <div 
                onClick={() => onNavigate('recaps')}
                className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <FileCheck size={100} />
                </div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
                            <FileCheck size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">Dernier rapport</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <ArrowRight size={14} />
                    </div>
                </div>

                {lastRecap ? (
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                             <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${lastRecap.type === 'DAILY' ? 'bg-sky-100 text-sky-700' : 'bg-purple-100 text-purple-700'}`}>
                                 {lastRecap.type === 'DAILY' ? 'Journalier' : 'Hebdo'}
                             </span>
                             <span className="text-xs text-slate-400 font-medium">{format(new Date(lastRecap.date), "d MMM", { locale: fr })}</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 line-clamp-1 mb-2">{lastRecap.title}</h4>
                        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{lastRecap.description}</p>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-slate-400 text-sm italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        Aucun rapport
                    </div>
                )}
            </div>

            {/* Calendar Widget */}
            <div 
                onClick={() => onNavigate('calendar')}
                className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <CalendarClock size={100} />
                </div>
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                            <CalendarClock size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">Prochainement</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <ArrowRight size={14} />
                    </div>
                </div>

                {nextEvent ? (
                    <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-white shadow-sm rounded-xl w-14 h-14 border border-slate-100">
                             <span className="text-[10px] font-bold text-indigo-500 uppercase">{format(new Date(nextEvent.date), 'MMM', { locale: fr })}</span>
                             <span className="text-xl font-bold text-slate-900">{format(new Date(nextEvent.date), 'dd')}</span>
                        </div>
                        <div className="overflow-hidden">
                             <h4 className="font-bold text-slate-900 truncate">{nextEvent.title}</h4>
                             <p className="text-xs text-slate-500 font-medium mt-0.5 capitalize">{format(new Date(nextEvent.date), 'EEEE • HH:mm', { locale: fr })}</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-slate-400 text-sm italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        Rien à l'agenda
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;