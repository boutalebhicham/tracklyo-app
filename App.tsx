import React, { useState } from 'react';
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
const USERS: Record<UserRole, User> = {
  [UserRole.PATRON]: {
    id: 'u1',
    name: 'Jean Directeur',
    role: UserRole.PATRON,
    avatar: 'https://ui-avatars.com/api/?name=Jean+Directeur&background=0D8ABC&color=fff'
  },
  [UserRole.RESPONSABLE]: {
    id: 'u2',
    name: 'Marc Responsable',
    role: UserRole.RESPONSABLE,
    avatar: 'https://ui-avatars.com/api/?name=Marc+Responsable&background=random'
  }
};

// Initial Data
const INITIAL_DATA: AppData = {
  recaps: [
    {
      id: 'r1',
      title: 'Ouverture chantier A',
      type: 'DAILY',
      description: 'Mise en place des échafaudages terminée. Livraison des matériaux reçue à 10h. Aucun incident à signaler.',
      date: new Date(Date.now() - 86400000).toISOString(),
      authorId: 'u2',
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
      authorId: 'u1'
    },
    {
      id: 't2',
      amount: 150.50,
      reason: 'Déjeuner équipe',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      type: TransactionType.EXPENSE,
      currency: 'EUR',
      authorId: 'u2'
    },
    {
      id: 't3',
      amount: 2500,
      reason: 'Fonds Projet Marketing US',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      type: TransactionType.BUDGET_ADD,
      currency: 'USD',
      authorId: 'u1'
    },
    {
      id: 't4',
      amount: 1500000,
      reason: 'Budget Opérationnel Sénégal',
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      type: TransactionType.BUDGET_ADD,
      currency: 'XOF',
      authorId: 'u1'
    }
  ]
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.PATRON);
  const [data, setData] = useState<AppData>(INITIAL_DATA);

  const currentUser = USERS[currentRole];

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
    // Basic permission check: In real app, check owner
    setData(prev => ({ ...prev, events: prev.events.filter(e => e.id !== id) }));
  };

  const addDocument = (doc: DocumentItem) => {
    setData(prev => ({ ...prev, documents: [doc, ...prev.documents] }));
  };

  const addTransaction = (t: Transaction) => {
    setData(prev => ({ ...prev, transactions: [t, ...prev.transactions] }));
  };

  const switchRole = () => {
    setCurrentRole(prev => prev === UserRole.PATRON ? UserRole.RESPONSABLE : UserRole.PATRON);
    setActiveTab('dashboard'); // Reset to dashboard on switch
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} currentUser={currentUser} onNavigate={setActiveTab} />;
      case 'recaps':
        return <Recaps data={data} currentUser={currentUser} onAddRecap={addRecap} onAddComment={addComment} />;
      case 'calendar':
        return <CalendarView data={data} currentUser={currentUser} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />;
      case 'documents':
        return <Documents data={data} currentUser={currentUser} onAddDocument={addDocument} />;
      case 'finances':
        return <Finances data={data} currentUser={currentUser} onAddTransaction={addTransaction} />;
      default:
        return <Dashboard data={data} currentUser={currentUser} onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      currentUser={currentUser}
      onSwitchRole={switchRole}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;