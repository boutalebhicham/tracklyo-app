import React, { useState, useRef, useEffect } from 'react';
import { Mic, Check, Loader2, Sparkles, AlertCircle, FileText, Calendar as CalendarIcon, Wallet, ArrowRight, X } from 'lucide-react';
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
  const [detectedItem, setDetectedItem] = useState<any>(null); // Store the parsed object for preview
  const [detectedType, setDetectedType] = useState<'RECAP' | 'EVENT' | 'EXPENSE' | null>(null);

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
        setDetectedItem(null);
        setDetectedType(null);
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
      setDetectedItem(null);
      setDetectedType(null);
      setFeedback({ type: null, message: '' });
      recognitionRef.current?.start();
    }
  };

  const handleProcessText = async (text: string) => {
    if (!aiRef.current) {
        setFeedback({ type: 'error', message: "API Key manquante." });
        return;
    }

    setIsProcessing(true);
    setFeedback({ type: null, message: "Analyse..." });

    try {
        const prompt = `
            Tu es un assistant IA pour une app BTP. Analyse : "${text}".
            Réponds JSON uniquement.
            
            1. Travail/Chantier -> category: "RECAP"
               - title: court.
               - description: reformulé pro.
               - type: "DAILY"
            
            2. RDV/Agenda -> category: "EVENT"
               - title: Titre.
               - date: ISO 8601 (YYYY-MM-DDTHH:mm:ss). Année 2025.
               - description: Détails.
            
            3. Argent/Achat -> category: "EXPENSE"
               - amount: Nombre.
               - reason: Motif.
               - currency: 'EUR', 'USD' ou 'XOF'.
            
            JSON :
        `;

        const response = await aiRef.current.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text);

        // Simulate a small delay for the UX "Wow" effect
        await new Promise(r => setTimeout(r, 800));

        if (result.category === 'RECAP') {
            const newRecap: Recap = {
                id: Date.now().toString(),
                title: result.title || "Rapport Vocal",
                type: 'DAILY',
                description: result.description || text,
                date: new Date().toISOString(),
                authorId: currentUser.id,
                mediaUrls: [],
                comments: []
            };
            onAddRecap(newRecap);
            setDetectedType('RECAP');
            setDetectedItem(newRecap);
            setFeedback({ type: 'success', message: "Rapport généré" });
            setTimeout(() => onNavigate('recaps'), 3500);

        } else if (result.category === 'EVENT') {
            const newEvent: CalendarEvent = {
                id: Date.now().toString(),
                title: result.title || "RDV Vocal",
                description: result.description || text,
                date: result.date || new Date().toISOString(),
                authorId: currentUser.id
            };
            onAddEvent(newEvent);
            setDetectedType('EVENT');
            setDetectedItem(newEvent);
            setFeedback({ type: 'success', message: "Ajouté à l'agenda" });
            setTimeout(() => onNavigate('calendar'), 3500);

        } else if (result.category === 'EXPENSE') {
            const newTransaction: Transaction = {
                id: Date.now().toString(),
                amount: Number(result.amount) || 0,
                reason: result.reason || "Dépense vocale",
                date: new Date().toISOString(),
                type: TransactionType.EXPENSE,
                currency: result.currency || 'EUR',
                authorId: currentUser.id
            };
            onAddTransaction(newTransaction);
            setDetectedType('EXPENSE');
            setDetectedItem(newTransaction);
            setFeedback({ type: 'success', message: "Dépense notée" });
            setTimeout(() => onNavigate('finances'), 3500);
        } else {
             setFeedback({ type: 'error', message: "Pas compris." });
        }

    } catch (error) {
        console.error(error);
        setFeedback({ type: 'error', message: "Erreur analyse." });
    } finally {
        setIsProcessing(false);
    }
  };

  // Render the result card based on type
  const renderResultCard = () => {
      if (!detectedItem || !detectedType) return null;

      return (
          <div className="animate-scale-in mx-auto w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/50 relative overflow-hidden mt-8">
              {/* Card Header Background */}
              <div className={`absolute top-0 left-0 right-0 h-24 ${
                  detectedType === 'RECAP' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' :
                  detectedType === 'EVENT' ? 'bg-gradient-to-br from-indigo-500 to-blue-500' :
                  'bg-gradient-to-br from-emerald-500 to-teal-500'
              } opacity-10`}></div>
              
              {/* Icon */}
              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                   detectedType === 'RECAP' ? 'bg-violet-100 text-violet-600' :
                   detectedType === 'EVENT' ? 'bg-indigo-100 text-indigo-600' :
                   'bg-emerald-100 text-emerald-600'
              }`}>
                  {detectedType === 'RECAP' && <FileText size={32} />}
                  {detectedType === 'EVENT' && <CalendarIcon size={32} />}
                  {detectedType === 'EXPENSE' && <Wallet size={32} />}
                  
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                      <Check size={14} className="text-green-500 stroke-[4]" />
                  </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {detectedType === 'RECAP' ? 'Rapport créé' : detectedType === 'EVENT' ? 'Événement planifié' : 'Dépense ajoutée'}
                  </p>
                  
                  {detectedType === 'EXPENSE' ? (
                      <h3 className="text-3xl font-black text-slate-900 mb-1">
                          -{detectedItem.amount} {detectedItem.currency === 'USD' ? '$' : '€'}
                      </h3>
                  ) : (
                      <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight">
                          {detectedItem.title}
                      </h3>
                  )}

                  {detectedType === 'EVENT' && (
                       <p className="text-indigo-600 font-bold bg-indigo-50 inline-block px-3 py-1 rounded-lg text-sm mt-2">
                           {format(new Date(detectedItem.date), "d MMM 'à' HH:mm", { locale: fr })}
                       </p>
                  )}

                  <p className="text-slate-500 text-sm mt-3 line-clamp-2 leading-relaxed">
                      {detectedType === 'EXPENSE' ? detectedItem.reason : detectedItem.description}
                  </p>
              </div>

              {/* Progress Bar redirection */}
              <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 animate-[width_3s_ease-in-out_forwards] w-0"></div>
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
          
          {/* Header */}
          {!detectedItem && (
            <div className={`text-center space-y-3 mb-12 transition-all duration-500 ${isListening ? 'opacity-50 scale-95' : 'opacity-100'}`}>
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
          {!detectedItem ? (
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
                <div className="mt-12 text-center h-24">
                     {isListening ? (
                         <p className="text-xl font-medium text-slate-800 animate-pulse">Je vous écoute...</p>
                     ) : isProcessing ? (
                         <p className="text-xl font-medium text-slate-800">Un instant...</p>
                     ) : (
                         <div className="flex flex-wrap justify-center gap-3 opacity-60">
                             <span className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-500 shadow-sm">"J'ai fini le chantier..."</span>
                             <span className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-500 shadow-sm">"Ajoute 50€ d'essence"</span>
                         </div>
                     )}
                     
                     {/* Live Transcript Overlay */}
                     {transcript && (
                         <div className="mt-6 px-6">
                            <p className="text-lg text-slate-600 font-medium leading-relaxed">
                                "{transcript}"
                            </p>
                         </div>
                     )}
                     
                     {feedback.type === 'error' && (
                         <div className="mt-4 inline-flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl text-sm font-bold">
                             <AlertCircle size={16} /> {feedback.message}
                         </div>
                     )}
                </div>
              </>
          ) : (
              // --- SUCCESS STATE ---
              renderResultCard()
          )}

      </div>
    </div>
  );
};

export default VoiceAssistant;