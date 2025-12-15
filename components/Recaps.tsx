import React, { useState } from 'react';
import { AppData, Recap, User, UserRole, Comment } from '../types';
import { Plus, Video, Image as ImageIcon, MoreHorizontal, Send, X, MessageCircle, CornerDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecapsProps {
  data: AppData;
  currentUser: User;
  onAddRecap: (recap: Recap) => void;
  onAddComment: (recapId: string, comment: Comment) => void;
}

const Recaps: React.FC<RecapsProps> = ({ data, currentUser, onAddRecap, onAddComment }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRecap, setNewRecap] = useState<Partial<Recap>>({
    type: 'DAILY',
    title: '',
    description: '',
    mediaUrls: [],
    comments: []
  });
  
  // State for new comments input (mapped by recap ID)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleCommentSubmit = (e: React.FormEvent, recapId: string) => {
      e.preventDefault();
      const content = commentInputs[recapId];
      if (!content || !content.trim()) return;

      const newComment: Comment = {
          id: Date.now().toString(),
          authorId: currentUser.id,
          content: content.trim(),
          date: new Date().toISOString()
      };

      onAddComment(recapId, newComment);
      setCommentInputs(prev => ({ ...prev, [recapId]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecap.title || !newRecap.description) return;

    const recap: Recap = {
      id: Date.now().toString(),
      title: newRecap.title,
      type: newRecap.type || 'DAILY',
      description: newRecap.description,
      date: new Date().toISOString(),
      authorId: currentUser.id,
      mediaUrls: [
        `https://picsum.photos/400/300?random=${Math.random()}`,
        `https://picsum.photos/400/300?random=${Math.random()}`
      ],
      comments: []
    };

    onAddRecap(recap);
    setIsAdding(false);
    setNewRecap({ type: 'DAILY', title: '', description: '', mediaUrls: [], comments: [] });
  };

  const getUserName = (id: string) => id === 'u1' ? 'Jean Directeur' : 'Marc Responsable';
  const getUserAvatar = (id: string) => id === 'u1' 
    ? "https://ui-avatars.com/api/?name=Jean+Directeur&background=0D8ABC&color=fff" 
    : "https://ui-avatars.com/api/?name=Marc+Responsable&background=random";

  return (
    <div className="animate-fade-in max-w-4xl mx-auto relative min-h-screen pb-24">
      
      {/* Floating Header with Rounded Corners (Floating Island) */}
      <div className="sticky top-4 z-30 mb-8">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm shadow-slate-200/50 rounded-[2rem] px-6 py-4 flex justify-between items-center transition-all hover:shadow-md hover:bg-white/90">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Activité</h1>
                <p className="text-xs text-slate-500 font-bold">Fil d'actualité et échanges</p>
            </div>
            
            {/* Desktop Button - Made visible on mobile */}
            {currentUser.role === UserRole.RESPONSABLE && (
            <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-violet-500/30 active:scale-95"
            >
                <Plus size={18} /> <span className="hidden md:inline">Publier</span><span className="md:hidden">Ajouter</span>
            </button>
            )}
          </div>
      </div>

      {/* FAB Removed here to avoid overlap with WhatsApp button */}

      {/* Add Form Modal/Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in relative flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-slate-800">Nouveau Rapport</h3>
                    <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X size={20} className="text-slate-600"/>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Type</label>
                        <div className="flex gap-3">
                            {['DAILY', 'WEEKLY'].map((type) => (
                                <button
                                    type="button"
                                    key={type}
                                    onClick={() => setNewRecap({ ...newRecap, type: type as any })}
                                    className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${newRecap.type === type ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'}`}
                                >
                                    {type === 'DAILY' ? 'Journalier' : 'Hebdo'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Titre</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full text-lg font-bold rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-violet-200 focus:border-violet-500 outline-none transition-colors placeholder:text-slate-300"
                            placeholder="Titre du rapport..."
                            value={newRecap.title}
                            onChange={(e) => setNewRecap({ ...newRecap, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Description</label>
                        <textarea
                            required
                            rows={5}
                            className="w-full p-4 bg-slate-50 rounded-[2rem] border border-slate-200 focus:ring-2 focus:ring-violet-200 focus:border-violet-500 outline-none transition-all resize-none text-slate-700 leading-relaxed"
                            placeholder="Détails de l'activité..."
                            value={newRecap.description}
                            onChange={(e) => setNewRecap({ ...newRecap, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4 p-4 border border-dashed border-slate-300 rounded-[2rem] justify-center text-slate-400 hover:text-violet-600 hover:border-violet-400 hover:bg-violet-50 transition-all cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                            <ImageIcon size={24} />
                            <span className="text-xs font-bold">Ajouter Média</span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-xl shadow-slate-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Send size={18} /> Publier le rapport
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-8 relative mt-4">
        
        {data.recaps.map((recap, index) => (
          <div key={recap.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 transition-all">
               
               {/* --- POST CONTENT --- */}
               <div className="p-6 md:p-8">
                   {/* Header User Info */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="relative">
                            <img 
                                src={getUserAvatar(recap.authorId)} 
                                alt="" 
                                className="w-12 h-12 rounded-2xl border border-slate-100 shadow-sm object-cover"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold ${recap.type === 'DAILY' ? 'bg-sky-500' : 'bg-purple-500'}`}>
                                {recap.type === 'DAILY' ? 'J' : 'H'}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{getUserName(recap.authorId)}</p>
                            <p className="text-xs text-slate-400 font-medium">{format(new Date(recap.date), "d MMMM 'à' HH:mm", { locale: fr })}</p>
                        </div>
                        <button className="text-slate-300 p-2 hover:bg-slate-50 rounded-full">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <h3 className="font-bold text-xl text-slate-900 mb-3 leading-tight">{recap.title}</h3>

                    <div className="text-slate-600 leading-relaxed text-sm md:text-base font-medium whitespace-pre-line">
                        {recap.description}
                    </div>

                    {/* Media */}
                    {recap.mediaUrls.length > 0 && (
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            {recap.mediaUrls.map((url, idx) => (
                            <div key={idx} className={`relative rounded-2xl overflow-hidden cursor-pointer group/image bg-slate-100 ${idx === 0 && recap.mediaUrls.length === 3 ? 'col-span-2 aspect-video' : 'aspect-[4/3]'}`}>
                                <img src={url} alt="Recap media" className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105" />
                            </div>
                            ))}
                        </div>
                    )}
               </div>

               {/* --- COMMENT SECTION --- */}
               <div className="bg-slate-50/80 border-t border-slate-100 p-6">
                  
                  {/* Stats/Action Bar */}
                  <div className="flex items-center gap-4 mb-4 text-slate-500 text-sm font-semibold">
                      <div className="flex items-center gap-1.5 text-violet-600">
                          <MessageCircle size={18} className="fill-current opacity-20"/>
                          <span>{recap.comments.length} commentaires</span>
                      </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4 mb-5">
                      {recap.comments.map(comment => (
                          <div key={comment.id} className="flex gap-3 animate-fade-in">
                              <img 
                                  src={getUserAvatar(comment.authorId)} 
                                  alt="" 
                                  className="w-8 h-8 rounded-full border border-white shadow-sm flex-shrink-0"
                              />
                              <div className="flex flex-col items-start max-w-[85%]">
                                  <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100">
                                      <p className="text-xs font-bold text-slate-900 mb-0.5">{getUserName(comment.authorId)}</p>
                                      <p className="text-sm text-slate-700 leading-snug">{comment.content}</p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium ml-2 mt-1">{format(new Date(comment.date), 'HH:mm', { locale: fr })}</span>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={(e) => handleCommentSubmit(e, recap.id)} className="flex gap-3 items-center">
                       <img 
                          src={currentUser.avatar} 
                          alt="Me" 
                          className="w-9 h-9 rounded-full border border-slate-200 shadow-sm hidden md:block"
                        />
                       <div className="flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="Écrire un commentaire..." 
                                className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:ring-2 focus:ring-violet-200 focus:border-violet-500 outline-none transition-all shadow-sm"
                                value={commentInputs[recap.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [recap.id]: e.target.value }))}
                            />
                            <button 
                                type="submit"
                                disabled={!commentInputs[recap.id]}
                                className="absolute right-1 top-1 p-2 bg-slate-900 text-white rounded-full hover:bg-violet-600 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors"
                            >
                                <CornerDownRight size={14} strokeWidth={3} />
                            </button>
                       </div>
                  </form>

               </div>
            </div>
          </div>
        ))}
        
        {data.recaps.length === 0 && (
            <div className="py-12">
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center text-slate-400 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-300">
                        <Send size={24} className="-ml-1"/>
                    </div>
                    <p className="font-semibold">C'est calme par ici.</p>
                    <p className="text-sm mt-1 opacity-70">Aucun rapport pour le moment.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Recaps;