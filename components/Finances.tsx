import React, { useState, useMemo } from 'react';
import { AppData, Transaction, TransactionType, User, UserRole, CurrencyCode } from '../types';
import { Plus, Minus, Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, PieChart, Coins, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface FinancesProps {
  data: AppData;
  currentUser: User;
  onAddTransaction: (t: Transaction) => void;
}

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'Dollar US', symbol: '$' },
  { code: 'XOF', label: 'Franc CFA', symbol: 'CFA' },
];

// Taux de change approximatifs (Base EUR)
const RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.09,
  XOF: 655.96
};

const convert = (amount: number, from: CurrencyCode, to: CurrencyCode) => {
  const rateFrom = RATES[from] || 1;
  const rateTo = RATES[to] || 1;
  return (amount / rateFrom) * rateTo;
};

const Finances: React.FC<FinancesProps> = ({ data, currentUser, onAddTransaction }) => {
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>('EUR');
  
  // Form States
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>('EUR');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);

  const activeCurrencySymbol = CURRENCIES.find(c => c.code === currentCurrency)?.symbol || '';

  // Calculate Global Metrics (Converted to Current View Currency)
  const totalBudget = data.transactions
    .filter(t => t.type === TransactionType.BUDGET_ADD)
    .reduce((sum, t) => sum + convert(t.amount, t.currency, currentCurrency), 0);

  const totalExpenses = data.transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + convert(t.amount, t.currency, currentCurrency), 0);

  const balance = totalBudget - totalExpenses;
  const percentageUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  // Chart Data (Aggregated & Converted)
  const chartData = useMemo(() => {
    // Group by date logic could be added here, for now simpler mapping
    return data.transactions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(t => ({
        date: format(new Date(t.date), 'dd/MM'),
        amount: convert(t.type === TransactionType.EXPENSE ? -t.amount : t.amount, t.currency, currentCurrency),
        originalAmount: t.amount,
        type: t.type,
        currency: t.currency
        }));
  }, [data.transactions, currentCurrency]);

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (transactionType === TransactionType.EXPENSE && !reason) return;

    const val = Number(amount);
    
    // Safety check for expense (Converted check)
    if (transactionType === TransactionType.EXPENSE) {
        const valInViewCurrency = convert(val, formCurrency, currentCurrency);
        if (valInViewCurrency > balance) {
            alert("Fonds insuffisants (Valeur globale estimée trop basse) !");
            return;
        }
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount: val,
      reason: transactionType === TransactionType.BUDGET_ADD ? 'Budget Ajouté' : reason,
      date: new Date().toISOString(),
      type: transactionType,
      currency: formCurrency,
      authorId: currentUser.id
    };

    onAddTransaction(newTransaction);
    setAmount('');
    setReason('');
    setIsFormOpen(false);
  };

  const openForm = (type: TransactionType) => {
    setTransactionType(type);
    setFormCurrency(currentCurrency); // Default to current view currency for convenience
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Finances</h1>
          <p className="text-slate-500">Vue consolidée de votre trésorerie (conversion automatique).</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Currency View Switcher */}
            <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl overflow-x-auto custom-scrollbar shadow-sm">
                <span className="pl-3 pr-1 text-slate-400"><RefreshCw size={16} /></span>
                {CURRENCIES.map(curr => (
                    <button
                        key={curr.code}
                        onClick={() => setCurrentCurrency(curr.code)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                            currentCurrency === curr.code 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {curr.code}
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
            {currentUser.role === UserRole.PATRON && (
                <button
                onClick={() => openForm(TransactionType.BUDGET_ADD)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-medium transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-95 whitespace-nowrap"
                >
                <Plus size={18} /> Créditer
                </button>
            )}
            {currentUser.role === UserRole.RESPONSABLE && (
                <button
                onClick={() => openForm(TransactionType.EXPENSE)}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl font-medium transition-all shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 active:scale-95 whitespace-nowrap"
                >
                <Minus size={18} /> Dépense
                </button>
            )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Virtual Card */}
        <div className="lg:col-span-1">
            <div className="bg-gradient-to-bl from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden min-h-[360px] flex flex-col justify-between group transition-all duration-500">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                        <Wallet className="text-white" size={24} />
                    </div>
                    <div className="text-right">
                        <span className="font-mono text-xs text-slate-400 tracking-widest uppercase block mb-1">Affichage en</span>
                        <span className="font-bold text-white bg-white/10 px-3 py-1 rounded-lg text-xs inline-block border border-white/5">{currentCurrency}</span>
                    </div>
                </div>

                <div className="relative z-10 animate-fade-in" key={currentCurrency}>
                     <span className="text-slate-400 text-sm font-medium tracking-wide">Solde Total Estimé</span>
                     <h2 className="text-3xl lg:text-4xl font-bold mt-2 tracking-tight truncate">
                       {balance.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span className="text-2xl text-slate-500">{activeCurrencySymbol}</span>
                     </h2>
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between text-sm text-slate-400 mb-3 font-medium">
                        <span className="flex items-center gap-1.5"><ArrowDownLeft size={16} className="text-emerald-400"/> {totalBudget.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}{activeCurrencySymbol}</span>
                        <span className="flex items-center gap-1.5"><ArrowUpRight size={16} className="text-rose-400"/> {totalExpenses.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}{activeCurrencySymbol}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                         <div 
                             className={`h-full rounded-full transition-all duration-1000 ease-out ${percentageUsed > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                             style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                         ></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <PieChart size={20} className="text-violet-500"/> Flux de trésorerie ({currentCurrency})
                </h3>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">Vue Globale</span>
                </div>
            </div>
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            formatter={(value: number) => [`${value.toFixed(2)} ${activeCurrencySymbol}`, 'Montant conv.']}
                            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorAmt)" 
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl w-full max-w-lg animate-scale-in border border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {transactionType === TransactionType.BUDGET_ADD ? (
                            <><div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Plus size={20}/></div> Ajouter au budget</>
                        ) : (
                            <><div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><CreditCard size={20}/></div> Nouvelle dépense</>
                        )}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">Fermer</button>
                </div>
                
                <form onSubmit={handleTransaction} className="space-y-6">
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Devise de la transaction</label>
                        <div className="grid grid-cols-3 gap-2">
                        {CURRENCIES.map(c => (
                            <button
                                type="button"
                                key={c.code}
                                onClick={() => setFormCurrency(c.code)}
                                className={`px-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                                    formCurrency === c.code 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                }`}
                            >
                                {c.code}
                            </button>
                        ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Montant ({formCurrency})</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                {CURRENCIES.find(c => c.code === formCurrency)?.symbol}
                            </span>
                            <input
                            type="number"
                            min="1"
                            step="0.01"
                            required
                            autoFocus
                            className="w-full rounded-2xl bg-slate-50 border-slate-200 border pl-10 pr-4 py-4 focus:ring-2 focus:ring-violet-200 focus:border-violet-500 outline-none transition-all font-bold text-xl text-slate-900"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {transactionType === TransactionType.EXPENSE && (
                        <div>
                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Motif</label>
                            <input
                            type="text"
                            required
                            className="w-full rounded-2xl bg-slate-50 border-slate-200 border px-4 py-4 focus:ring-2 focus:ring-violet-200 focus:border-violet-500 outline-none transition-all font-semibold"
                            placeholder="Ex: Matériel, Restaurant..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    )}
                    
                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsFormOpen(false)}
                            className="flex-1 px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-colors"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            className={`flex-1 px-4 py-4 text-white rounded-2xl font-bold transition-all shadow-xl active:scale-95 flex justify-center items-center gap-2 ${
                                transactionType === TransactionType.BUDGET_ADD 
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                            }`}
                        >
                            {transactionType === TransactionType.BUDGET_ADD ? <Plus size={20} /> : <CreditCard size={20} />}
                            Confirmer
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Historique Global</h3>
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Toutes devises</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((t) => {
                const convertedAmount = convert(t.amount, t.currency, currentCurrency);
                const isDifferentCurrency = t.currency !== currentCurrency;
                
                return (
                <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            t.type === TransactionType.BUDGET_ADD ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200' : 'bg-rose-100 text-rose-600 group-hover:bg-rose-200'
                        }`}>
                            {t.type === TransactionType.BUDGET_ADD ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-base">{t.reason}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm text-slate-500">{format(new Date(t.date), 'dd MMM', { locale: fr })}</span>
                                {isDifferentCurrency && (
                                    <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                        Origine: {t.amount.toLocaleString('fr-FR')} {t.currency}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`font-bold text-lg block ${
                            t.type === TransactionType.BUDGET_ADD ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                            {t.type === TransactionType.BUDGET_ADD ? '+' : '-'}{convertedAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeCurrencySymbol}
                        </span>
                    </div>
                </div>
            )})}
            {data.transactions.length === 0 && (
                <div className="p-12 text-center text-slate-400">Aucune transaction enregistrée.</div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Finances;