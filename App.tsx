import React, { useState, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Recaps from './components/Recaps';
import CalendarView from './components/CalendarView';
import Documents from './components/Documents';
import Finances from './components/Finances';
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

// Mock Users
const PATRON_USER: User = {
  id: 'u1',
  name: 'Jean Directeur',
  role: UserRole.PATRON,
  avatar: 'https://ui-avatars.com/api/?name=Jean+Directeur&background=0D8ABC&color=fff',
  phoneNumber: '33612345678' // Format international pour WhatsApp
};

// Liste initiale (Pour la démo, on imagine qu'il en a déjà 1 ou 2)
const INITIAL_RESPONSABLES: User[] = [
    {
        id: 'u2',
        name: 'Marc Responsable',
        role: UserRole.RESPONSABLE,
        avatar: 'https://ui-avatars.com/api/?name=Marc+Responsable&background=random',
        phoneNumber: '33687654321'
    }
    // On commente Sophie pour tester l'ajout du 2ème employé et voir le Paywall
    /*,
    {
        id: 'u3',
        name: 'Sophie Martin',
        role: UserRole.RESPONSABLE,
        avatar: 'https://ui-avatars.com/api/?name=Sophie+Martin&background=f472b6&color=fff',
        phoneNumber: '33699887766'
    }*/
];

// Initial Data
const INITIAL_DATA: AppData = {
  recaps: [
    {
      id: 'r1',
      title: 'Ouverture chantier A',
      type: 'DAILY',
      description: 'Mise en place des échafaudages terminée. Livraison des matériaux reçue à 10h. Aucun incident à signaler.',
      date: new Date(Date.now() - 86400000).toISOString(),
      authorId: 'u2', // Marc
      mediaUrls: ['https://picsum.photos/400/300'],
      comments: [
        {
            id: 'c1',
            authorId: 'u1',
            content: 'Super, merci pour le suivi Marc. N\'oublie pas les photos du stock demain.',
            date: new Date(Date.now() - 80000000).toISOString()
        }
      ]
    }
  ],
  events: [
    {
      id: 'e1',
      title: 'Réunion Chantier',
      description: 'Point hebdomadaire avec le client.',
      date: new Date(Date.now() + 86400000 * 2).toISOString(),
      authorId: 'u1' 
    }
  ],
  documents: [
    {
      id: 'd1',
      name: 'Contrat_Prestation_2024.pdf',
      type: 'CONTRACT',
      date: new Date().toISOString(),
      authorId: 'u1',
      size: '2.4 MB'
    }
  ],
  transactions: [
    {
      id: 't1',
      amount: 5000,
      reason: 'Budget Initial Mai (Siège)',
      date: new Date(Date.now() - 86400000 * 10).toISOString(),
      type: TransactionType.BUDGET_ADD,
      currency: 'EUR',
      authorId: 'u2'
    },
    {
      id: 't2',
      amount: 150.50,
      reason: 'Déjeuner équipe',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      type: TransactionType.EXPENSE,
      currency: 'EUR',
      authorId: 'u2'
    }
  ]
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.PATRON);
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [responsablesList, setResponsablesList] = useState<User[]>(INITIAL_RESPONSABLES);
  
  // État pour savoir quel responsable le patron est en train de consulter
  const [selectedResponsableId, setSelectedResponsableId] = useState<string>(INITIAL_RESPONSABLES[0]?.id || '');

  // Déterminer l'utilisateur courant (Celui qui est connecté)
  const currentUser = currentRole === UserRole.PATRON 
    ? PATRON_USER 
    : responsablesList[0]; // Par défaut on connecte le premier responsable

  const switchRole = () => {
    setCurrentRole(prev => prev === UserRole.PATRON ? UserRole.RESPONSABLE : UserRole.PATRON);
    setActiveTab('dashboard');
  };

  const handleAddResponsable = (name: string, phone: string) => {
      const newId = `u${Date.now()}`;
      const newUser: User = {
          id: newId,
          name: name,
          role: UserRole.RESPONSABLE,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          phoneNumber: phone
      };
      setResponsablesList(prev => [...prev, newUser]);
      // Si c'était le premier, on le sélectionne par défaut
      if (responsablesList.length === 0) {
          setSelectedResponsableId(newId);
      }
  };

  // Filtrage des données en fonction de la vue
  const filteredData = useMemo(() => {
    // Si aucun responsable n'existe ou n'est sélectionné, on montre une vue vide ou générique
    const targetUserId = currentRole === UserRole.PATRON ? selectedResponsableId : currentUser?.id;

    if (!targetUserId) return { recaps: [], events: [], documents: [], transactions: [] };

    return {
        recaps: data.recaps.filter(r => r.authorId === targetUserId),
        events: data.events.filter(e => e.authorId === targetUserId || e.authorId === PATRON_USER.id),
        documents: data.documents.filter(d => d.authorId === targetUserId || d.authorId === PATRON_USER.id),
        transactions: data.transactions.filter(t => t.authorId === targetUserId)
    };
  }, [data, currentRole, selectedResponsableId, currentUser, responsablesList]);


  // Handlers for Data Updates
  const addRecap = (recap: Recap) => {
    setData(prev => ({ ...prev, recaps: [recap, ...prev.recaps] }));
  };

  const addComment = (recapId: string, comment: Comment) => {
    setData(prev => ({
        ...prev,
        recaps: prev.recaps.map(r => 
            r.id === recapId 
            ? { ...r, comments: [...r.comments, comment] }
            : r
        )
    }));
  };

  const addEvent = (event: CalendarEvent) => {
    setData(prev => ({ ...prev, events: [...prev.events, event] }));
  };

  const deleteEvent = (id: string) => {
    setData(prev => ({ ...prev, events: prev.events.filter(e => e.id !== id) }));
  };

  const addDocument = (doc: DocumentItem) => {
    setData(prev => ({ ...prev, documents: [doc, ...prev.documents] }));
  };

  const addTransaction = (t: Transaction) => {
    const transactionWithCorrectAuthor = {
        ...t,
        authorId: currentRole === UserRole.PATRON ? selectedResponsableId : currentUser.id
    };
    setData(prev => ({ ...prev, transactions: [transactionWithCorrectAuthor, ...prev.transactions] }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={filteredData} currentUser={currentUser} onNavigate={setActiveTab} />;
      case 'recaps':
        return <Recaps data={filteredData} currentUser={currentUser} onAddRecap={addRecap} onAddComment={addComment} />;
      case 'calendar':
        return <CalendarView data={filteredData} currentUser={currentUser} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />;
      case 'documents':
        return <Documents data={filteredData} currentUser={currentUser} onAddDocument={addDocument} />;
      case 'finances':
        return <Finances data={filteredData} currentUser={currentUser} onAddTransaction={addTransaction} />;
      default:
        return <Dashboard data={filteredData} currentUser={currentUser} onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      currentUser={currentUser}
      onSwitchRole={switchRole}
      responsablesList={responsablesList}
      selectedResponsableId={selectedResponsableId}
      onSelectResponsable={setSelectedResponsableId}
      patronUser={PATRON_USER}
      onAddResponsable={handleAddResponsable}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;