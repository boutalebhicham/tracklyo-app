import React, { useState, useRef, useEffect } from 'react';
import { Mic, Check, Loader2, Sparkles, AlertCircle, FileText, Calendar as CalendarIcon, Wallet, ArrowRight, X, Layers, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { User, Recap, CalendarEvent, Transaction, TransactionType } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VoiceAssistantProps {
  currentUser: User;
  onAddRecap: (recap: Recap) => void;
  onAddEvent: (event: CalendarEvent) => void;
  onAddTransaction: (t: Transaction) => void;
  onNavigate: (tab: string) => void;
}

// Type definitions for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  currentUser, 
  onAddRecap, 
  onAddEvent, 
  onAddTransaction,
  onNavigate
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  
  // On stocke désormais une liste d'actions détectées
  const [detectedItems, setDetectedItems] = useState<any[]>([]); 

  const recognitionRef = useRef<any>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.lang = 'fr-FR';
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback({ type: null, message: '' });
        setTranscript('');
        setDetectedItems([]);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalTranscript = recognition.transcript || (document.getElementById('transcript-display')?.innerText);
        if (finalTranscript && finalTranscript.trim().length > 2) {
            handleProcessText(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
        setFeedback({ type: 'error', message: "Micro non détecté." });
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setDetectedItems([]);
      setFeedback({ type: null, message: '' });
      recognitionRef.current?.start();
    }
  };

  const handleProcessText = async (text: string) => {
    if (!aiRef.current) {
        setFeedback({ type: 'error', message: "Clé API manquante." });
        return;
    }

    setIsProcessing(true);
    setFeedback({ type: null, message: "Analyse intelligente..." });

    try {
        const now = new Date();
        
        // Prompt optimisé pour le découpage d'intentions multiples
        const prompt = `
            Tu es l'intelligence artificielle de l'application de gestion BTP 'Tracklyo'.
            Date et heure actuelles : ${now.toLocaleString('fr-FR')}.
            
            TA MISSION :
            Analyser la commande vocale ci-dessous et extraire TOUTES les actions distinctes demandées.
            L'utilisateur peut combiner plusieurs demandes (ex: "J'ai acheté du ciment ET on a une réunion demain") dans la même phrase.
            
            COMMANDE VOCALE : "${text}"
            
            Retourne STRICTEMENT un objet JSON avec la structure suivante (pas de markdown) :
            {
              "items": [
                // Liste des objets détectés
              ]
            }

            CATÉGORIES D'ACTIONS POSSIBLES :
            
            1. "EXPENSE" (Dépense, achat, paiement, facture, coût)
               - amount: nombre (ex: 200).
               - currency: 'EUR', 'USD' ou 'XOF' (déduire selon contexte ou défaut EUR).
               - reason: motif court (ex: "Matériel peinture").
            
            2. "EVENT" (Réunion, rendez-vous, visite, planning, agenda)
               - title: titre court.
               - date: Format ISO 8601 complet (YYYY-MM-DDTHH:mm:ss). 
                 IMPORTANT: Calcule la date relative si nécessaire (ex: "dans 3 jours" -> ajoute 3 jours à la date actuelle).
               - description: détails.

            3. "RECAP" (Rapport, journal, "j'ai fini", "on a fait", activité, chantier)
               - title: titre résumant l'action.
               - description: texte reformulé de manière professionnelle.
               - type: "DAILY" (par défaut) ou "WEEKLY".

            Exemple de sortie JSON valide :
            {
              "items": [
                { "category": "EXPENSE", "amount": 45.50, "currency": "EUR", "reason": "Essence" },
                { "category": "EVENT", "title": "Point Chantier", "date": "2024-10-12T14:00:00" }
              ]
            }
        `;

        const response = await aiRef.current.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        // Nettoyage robuste du JSON (suppression des balises markdown éventuelles)
        const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);
        const items = result.items || [];
        
        if (items.length === 0) {
             setFeedback({ type: 'error', message: "Je n'ai pas compris l'action." });
             setIsProcessing(false);
             return;
        }

        const processedItems: any[] = [];

        // Exécution automatique des actions détectées
        for (const item of items) {
            if (item.category === 'RECAP') {
                const newRecap: Recap = {
                    id: Date.now().toString() + Math.random(),
                    title: item.title || "Rapport Vocal",
                    type: 'DAILY',
                    description: item.description || text,
                    date: new Date().toISOString(),
                    authorId: currentUser.id,
                    mediaUrls: [],
                    comments: []
                };
                onAddRecap(newRecap);
                processedItems.push({ ...item, internalId: newRecap.id });

            } else if (item.category === 'EVENT') {
                const newEvent: CalendarEvent = {
                    id: Date.now().toString() + Math.random(),
                    title: item.title || "RDV Vocal",
                    description: item.description || text,
                    date: item.date || new Date().toISOString(),
                    authorId: currentUser.id
                };
                onAddEvent(newEvent);
                processedItems.push({ ...item, internalId: newEvent.id });

            } else if (item.category === 'EXPENSE') {
                const newTransaction: Transaction = {
                    id: Date.now().toString() + Math.random(),
                    amount: Number(item.amount) || 0,
                    reason: item.reason || "Dépense vocale",
                    date: new Date().toISOString(),
                    type: TransactionType.EXPENSE,
                    currency: item.currency || 'EUR',
                    authorId: currentUser.id
                };
                onAddTransaction(newTransaction);
                processedItems.push({ ...item, internalId: newTransaction.id });
            }
        }

        // Petit délai pour l'effet "Traitement"
        await new Promise(r => setTimeout(r, 600));

        setDetectedItems(processedItems);
        setFeedback({ type: 'success', message: "Actions effectuées !" });

        // Redirection automatique si une seule action, sinon affichage du résumé
        if (processedItems.length === 1) {
             const type = processedItems[0].category;
             setTimeout(() => {
                 if (type === 'RECAP') onNavigate('recaps');
                 if (type === 'EVENT') onNavigate('calendar');
                 if (type === 'EXPENSE') onNavigate('finances');
             }, 2500); // Délai réduit pour fluidité
        }

    } catch (error) {
        console.error("Erreur IA:", error);
        setFeedback({ type: 'error', message: "Désolé, une erreur est survenue." });
    } finally {
        setIsProcessing(false);
    }
  };

  // Affichage des résultats avec confirmation visuelle
  const renderResults = () => {
      if (detectedItems.length === 0) return null;

      return (
          <div className="w-full max-w-md mt-8 space-y-4 animate-scale-in px-2">
              <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full text-sm font-bold shadow-sm animate-pulse-slow">
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                      {detectedItems.length} élément{detectedItems.length > 1 ? 's' : ''} enregistré{detectedItems.length > 1 ? 's' : ''} avec succès
                  </div>
              </div>

              {detectedItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-slate-100 flex items-center gap-4 animate-slide-up hover:scale-[1.02] transition-transform duration-300"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                      {/* Icon Box */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                           item.category === 'RECAP' ? 'bg-violet-100 text-violet-600' :
                           item.category === 'EVENT' ? 'bg-indigo-100 text-indigo-600' :
                           'bg-rose-100 text-rose-600'
                      }`}>
                          {item.category === 'RECAP' && <FileText size={24} />}
                          {item.category === 'EVENT' && <CalendarIcon size={24} />}
                          {item.category === 'EXPENSE' && <Wallet size={24} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                          {/* Label de destination explicite */}
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${
                               item.category === 'RECAP' ? 'text-violet-600' :
                               item.category === 'EVENT' ? 'text-indigo-600' :
                               'text-rose-600'
                          }`}>
                              <Check size={10} strokeWidth={4} />
                              {item.category === 'RECAP' ? 'Ajouté aux Rapports' : item.category === 'EVENT' ? 'Ajouté à l\'Agenda' : 'Débité du Budget'}
                          </p>
                          
                          <h4 className="font-bold text-slate-900 truncate text-base">
                              {item.category === 'EXPENSE' ? `-${item.amount} ${item.currency === 'USD' ? '$' : '€'}` : item.title}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                              {item.category === 'EXPENSE' ? item.reason : (item.date ? format(new Date(item.date), "d MMM 'à' HH:mm", {locale:fr}) : item.description)}
                          </p>
                      </div>

                      {/* Link Action */}
                      <button 
                        onClick={() => {
                             if (item.category === 'RECAP') onNavigate('recaps');
                             if (item.category === 'EVENT') onNavigate('calendar');
                             if (item.category === 'EXPENSE') onNavigate('finances');
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors border border-slate-100"
                        title="Voir dans l'onglet"
                      >
                          <ArrowRight size={18} />
                      </button>
                  </div>
              ))}
              
              <div className="pt-6 text-center">
                   <button 
                     onClick={() => {
                        setDetectedItems([]);
                        setTranscript('');
                        setFeedback({ type: null, message: '' });
                     }}
                     className="px-6 py-3 rounded-full bg-white/50 hover:bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                   >
                       Nouvelle demande
                   </button>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] relative px-4 py-8 overflow-hidden rounded-[3rem]">
      
      {/* --- Ambient Background --- */}
      <div className="absolute inset-0 bg-slate-50/50">
          <div className="absolute top-[-20%] left-[20%] w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-80 h-80 bg-violet-400/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
          
          {/* Header (Hide when showing results to save space) */}
          {detectedItems.length === 0 && (
            <div className={`text-center space-y-3 mb-10 transition-all duration-500 ${isListening ? 'opacity-50 scale-95' : 'opacity-100'}`}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-4">
                    <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tracklyo AI</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    Comment puis-je <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">vous aider ?</span>
                </h1>
            </div>
          )}

          {/* Interaction Area */}
          {detectedItems.length === 0 ? (
              <>
                {/* Visualizer (Fake bars) */}
                <div className={`flex items-end justify-center gap-1.5 h-16 mb-8 transition-opacity duration-300 ${isListening ? 'opacity-100' : 'opacity-0'}`}>
                    {[1,2,3,4,5,4,3,2,1].map((n, i) => (
                        <div 
                            key={i} 
                            className="w-2 bg-slate-900 rounded-full animate-pulse"
                            style={{ 
                                height: `${n * 20}%`, 
                                animationDuration: `${0.4 + Math.random() * 0.5}s` 
                            }}
                        ></div>
                    ))}
                </div>

                {/* The Button */}
                <div className="relative group">
                    {/* Glow Rings */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 blur-xl transition-all duration-500 ${isListening || isProcessing ? 'opacity-60 scale-150' : 'opacity-0 scale-100'}`}></div>
                    
                    <button
                        onClick={toggleListening}
                        disabled={isProcessing}
                        className={`
                            relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 z-10
                            ${isListening 
                                ? 'bg-white shadow-[0_0_40px_rgba(99,102,241,0.3)] scale-110' 
                                : 'bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl hover:scale-105 active:scale-95'
                            }
                        `}
                    >
                        {isProcessing ? (
                            <Loader2 size={40} className={`animate-spin ${isListening ? 'text-indigo-600' : 'text-white'}`} />
                        ) : (
                            <Mic size={40} className={`transition-colors ${isListening ? 'text-indigo-600' : 'text-white'}`} />
                        )}
                    </button>
                </div>

                {/* Hints / Status */}
                <div className="mt-12 text-center min-h-[100px] w-full">
                     {isListening ? (
                         <p className="text-xl font-medium text-slate-800 animate-pulse">Je vous écoute...</p>
                     ) : isProcessing ? (
                         <p className="text-xl font-medium text-slate-800">Je trie vos informations...</p>
                     ) : (
                         <div className="flex flex-col items-center gap-3 opacity-70">
                             <div className="flex gap-2">
                                <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] md:text-xs font-bold text-slate-500 shadow-sm">"Dépense 200€ matériel..."</span>
                                <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] md:text-xs font-bold text-slate-500 shadow-sm">"Réunion Lundi 14h..."</span>
                             </div>
                             <p className="text-xs text-slate-400 mt-2">Dites tout d'un coup, je m'occupe de ranger.</p>
                         </div>
                     )}
                     
                     {/* Live Transcript Overlay */}
                     {transcript && (
                         <div className="mt-6 px-4 py-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm mx-auto max-w-sm">
                            <p className="text-base text-slate-700 font-medium leading-relaxed">
                                "{transcript}"
                            </p>
                         </div>
                     )}
                     
                     {feedback.type === 'error' && (
                         <div className="mt-4 inline-flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl text-sm font-bold animate-shake">
                             <AlertCircle size={16} /> {feedback.message}
                         </div>
                     )}
                </div>
              </>
          ) : (
              // --- RESULTS LIST ---
              renderResults()
          )}

      </div>
    </div>
  );
};

export default VoiceAssistant;