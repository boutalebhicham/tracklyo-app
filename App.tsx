import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Recaps from './components/Recaps';
import CalendarView from './components/CalendarView';
import Documents from './components/Documents';
import Finances from './components/Finances';
import VoiceAssistant from './components/VoiceAssistant';
import { supabase } from './lib/supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';
import { 
  UserRole, 
  User, 
  AppData, 
  Recap, 
  CalendarEvent, 
  DocumentItem, 
  Transaction,
  TransactionType,
  Comment
} from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.PATRON);
  const [data, setData] = useState<AppData>({ recaps: [], events: [], documents: [], transactions: [] });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // État pour savoir quel responsable le patron est en train de consulter
  const [selectedResponsableId, setSelectedResponsableId] = useState<string>('');

  // Chargement initial des données
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      // 1. Fetch Users
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      
      if (usersError) {
          console.warn("Supabase Users Error (Tables likely missing):", usersError.message);
      }

      // Initialisation par défaut si la base est vide ou en erreur
      let currentUsers = usersData as any[] || [];
      
      if (currentUsers.length === 0) {
          const defaultPatron = {
              id: 'u1',
              name: 'Jean Directeur',
              role: 'PATRON',
              avatar: 'https://ui-avatars.com/api/?name=Jean+Directeur&background=0D8ABC&color=fff',
              phone_number: '33612345678'
          };
          const defaultManager = {
              id: 'u2',
              name: 'Marc Responsable',
              role: 'RESPONSABLE',
              avatar: 'https://ui-avatars.com/api/?name=Marc+Responsable&background=random',
              phone_number: '33687654321'
          };
          
          currentUsers = [defaultPatron, defaultManager];
          
          // Tentative d'auto-réparation si la table existe mais est vide
          if (!usersError) {
              await supabase.from('users').insert([defaultPatron, defaultManager]);
          }
      }

      const mappedUsers: User[] = currentUsers.map((u: any) => ({
          id: u.id,
          name: u.name,
          role: u.role as UserRole,
          avatar: u.avatar,
          phoneNumber: u.phone_number
      }));
      setUsers(mappedUsers);

      if (!selectedResponsableId) {
          const firstResp = mappedUsers.find(u => u.role === UserRole.RESPONSABLE);
          if (firstResp) setSelectedResponsableId(firstResp.id);
      }

      // 2. Fetch Recaps & Comments
      const { data: recapsData } = await supabase
        .from('recaps')
        .select(`*, comments (*)`)
        .order('date', { ascending: false });

      const mappedRecaps: Recap[] = (recapsData || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          description: r.description,
          date: r.date,
          authorId: r.author_id,
          mediaUrls: r.media_urls || [],
          comments: (r.comments || []).map((c: any) => ({
              id: c.id,
              authorId: c.author_id,
              content: c.content,
              date: c.date
          }))
      }));

      // 3. Fetch Events
      const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: true });
      const mappedEvents: CalendarEvent[] = (eventsData || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: e.date,
          authorId: e.author_id
      }));

      // 4. Fetch Documents
      const { data: docsData } = await supabase.from('documents').select('*').order('date', { ascending: false });
      const mappedDocs: DocumentItem[] = (docsData || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type as any,
          date: d.date,
          authorId: d.author_id,
          size: d.size
      }));

      // 5. Fetch Transactions
      const { data: transData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      const mappedTrans: Transaction[] = (transData || []).map((t: any) => ({
          id: t.id,
          amount: Number(t.amount),
          reason: t.reason,
          date: t.date,
          type: t.type as TransactionType,
          currency: t.currency,
          authorId: t.author_id
      }));

      setData({
          recaps: mappedRecaps,
          events: mappedEvents,
          documents: mappedDocs,
          transactions: mappedTrans
      });

    } catch (error: any) {
        console.error("CRITICAL ERROR:", error);
        setErrorState(error.message || "Erreur inconnue lors du chargement");
    } finally {
        setLoading(false);
    }
  };

  // Dérivés
  const patronUser = users.find(u => u.role === UserRole.PATRON);
  const responsablesList = users.filter(u => u.role === UserRole.RESPONSABLE);
  
  // Safety Fallback si l'utilisateur n'est pas trouvé malgré le chargement
  const safeCurrentUser = { id: 'temp', name: 'Chargement...', role: UserRole.PATRON, avatar: '' } as User;
  
  const currentUser = currentRole === UserRole.PATRON 
    ? (patronUser || safeCurrentUser)
    : (responsablesList[0] || safeCurrentUser);

  const switchRole = () => {
    setCurrentRole(prev => prev === UserRole.PATRON ? UserRole.RESPONSABLE : UserRole.PATRON);
    setActiveTab('dashboard');
  };

  // --- ACTIONS SUPABASE ---
  // (Inchangées, gardées pour la compatibilité)
  const handleAddResponsable = async (name: string, phone: string) => {
      const newUser = { id: `u${Date.now()}`, name, role: 'RESPONSABLE', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`, phone_number: phone };
      await supabase.from('users').insert([newUser]);
      setUsers(prev => [...prev, { ...newUser, phoneNumber: phone, role: UserRole.RESPONSABLE }]);
  };

  const addRecap = async (recap: Recap) => {
    const dbRecap = { id: recap.id, title: recap.title, type: recap.type, description: recap.description, date: recap.date, author_id: recap.authorId, media_urls: recap.mediaUrls };
    await supabase.from('recaps').insert([dbRecap]);
    setData(prev => ({ ...prev, recaps: [recap, ...prev.recaps] }));
  };

  const addComment = async (recapId: string, comment: Comment) => {
    const dbComment = { id: comment.id, recap_id: recapId, author_id: comment.authorId, content: comment.content, date: comment.date };
    await supabase.from('comments').insert([dbComment]);
    setData(prev => ({ ...prev, recaps: prev.recaps.map(r => r.id === recapId ? { ...r, comments: [...r.comments, comment] } : r) }));
  };

  const addEvent = async (event: CalendarEvent) => {
    const dbEvent = { id: event.id, title: event.title, description: event.description, date: event.date, author_id: event.authorId };
    await supabase.from('events').insert([dbEvent]);
    setData(prev => ({ ...prev, events: [...prev.events, event] }));
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    setData(prev => ({ ...prev, events: prev.events.filter(e => e.id !== id) }));
  };

  const addDocument = async (doc: DocumentItem) => {
    const dbDoc = { id: doc.id, name: doc.name, type: doc.type, date: doc.date, author_id: doc.authorId, size: doc.size };
    await supabase.from('documents').insert([dbDoc]);
    setData(prev => ({ ...prev, documents: [doc, ...prev.documents] }));
  };

  const addTransaction = async (t: Transaction) => {
    const realAuthorId = currentRole === UserRole.PATRON ? selectedResponsableId : currentUser.id;
    const dbTrans = { id: t.id, amount: t.amount, reason: t.reason, date: t.date, type: t.type, currency: t.currency, author_id: realAuthorId };
    await supabase.from('transactions').insert([dbTrans]);
    const transactionWithCorrectAuthor = { ...t, authorId: realAuthorId };
    setData(prev => ({ ...prev, transactions: [transactionWithCorrectAuthor, ...prev.transactions] }));
  };

  const filteredData = useMemo(() => {
    const targetUserId = currentRole === UserRole.PATRON ? selectedResponsableId : currentUser?.id;
    if (!targetUserId) return { recaps: [], events: [], documents: [], transactions: [] };
    return {
        recaps: data.recaps.filter(r => r.authorId === targetUserId),
        events: data.events.filter(e => e.authorId === targetUserId || (patronUser && e.authorId === patronUser.id)),
        documents: data.documents.filter(d => d.authorId === targetUserId || (patronUser && d.authorId === patronUser.id)),
        transactions: data.transactions.filter(t => t.authorId === targetUserId)
    };
  }, [data, currentRole, selectedResponsableId, currentUser, patronUser]);


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={filteredData} currentUser={currentUser} onNavigate={setActiveTab} />;
      case 'assistant': return <VoiceAssistant currentUser={currentUser} onAddRecap={addRecap} onAddEvent={addEvent} onAddTransaction={addTransaction} onNavigate={setActiveTab} />;
      case 'recaps': return <Recaps data={filteredData} currentUser={currentUser} onAddRecap={addRecap} onAddComment={addComment} />;
      case 'calendar': return <CalendarView data={filteredData} currentUser={currentUser} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />;
      case 'documents': return <Documents data={filteredData} currentUser={currentUser} onAddDocument={addDocument} />;
      case 'finances': return <Finances data={filteredData} currentUser={currentUser} onAddTransaction={addTransaction} />;
      default: return <Dashboard data={filteredData} currentUser={currentUser} onNavigate={setActiveTab} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-6">
           <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
           <p className="text-sm font-medium text-slate-400">Initialisation...</p>
        </div>
      </div>
    );
  }

  // Si on a fini de charger mais qu'il n'y a toujours pas de patronUser valide (cas rare si SQL pas runné et fallback échoué)
  if (!patronUser && users.length === 0) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC] p-4">
            <div className="max-w-md text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Configuration requise</h2>
                <p className="text-slate-500 mb-6">La base de données semble vide ou inaccessible. Veuillez exécuter le script SQL fourni dans Supabase.</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">Réessayer</button>
            </div>
          </div>
      );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      currentUser={currentUser}
      onSwitchRole={switchRole}
      responsablesList={responsablesList}
      selectedResponsableId={selectedResponsableId}
      onSelectResponsable={setSelectedResponsableId}
      patronUser={patronUser || safeCurrentUser} 
      onAddResponsable={handleAddResponsable}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;