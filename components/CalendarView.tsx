import React, { useState } from 'react';
import { AppData, CalendarEvent, User } from '../types';
import { Plus, Trash2, Calendar as CalIcon, Clock, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarViewProps {
  data: AppData;
  currentUser: User;
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ data, currentUser, onAddEvent, onDeleteEvent }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    date: ''
  });

  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  // Generate 2 weeks for horizontal scroll feeling
  const calendarDays = Array.from({ length: 14 }).map((_, i) => addDays(startOfCurrentWeek, i));

  // Filter events for the selected day view (Mobile/List view)
  const selectedDayEvents = data.events.filter(e => isSameDay(new Date(e.date), selectedDay));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    onAddEvent({
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description || '',
      date: newEvent.date,
      authorId: currentUser.id
    });
    setIsAdding(false);
    setNewEvent({ title: '', description: '', date: '' });
  };

  return (
    <div className="animate-fade-in relative min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-4 mb-6">
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Agenda</h1>
           <p className="text-xs md:text-base text-slate-500 font-medium">Vos échéances.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
        >
          <Plus size={20} /> <span className="hidden md:inline">Nouvel événement</span><span className="md:hidden">Créer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Calendar Section */}
        <div className="xl:col-span-2 space-y-6">
            
            {/* Desktop Calendar Grid / Mobile Horizontal Swipe */}
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100">
                {/* Month Navigation (Visual Only for now) */}
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"><ChevronLeft size={20} /></button>
                    <h2 className="font-extrabold text-slate-900 text-lg capitalize tracking-tight flex items-center gap-2">
                        <CalIcon size={18} className="text-indigo-500" />
                        {format(today, 'MMMM yyyy', { locale: fr })}
                    </h2>
                    <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"><ChevronRight size={20} /></button>
                </div>

                {/* Mobile: Horizontal Scrollable Days */}
                <div className="md:hidden flex overflow-x-auto gap-3 pb-4 px-1 snap-x scroll-smooth hide-scrollbar">
                    {calendarDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDay);
                        const isToday = isSameDay(day, today);
                        return (
                            <button 
                                key={day.toString()} 
                                onClick={() => setSelectedDay(day)}
                                className={`
                                    min-w-[64px] flex flex-col items-center p-3 rounded-2xl border transition-all snap-start
                                    ${isSelected 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}
                                    ${isToday && !isSelected ? 'border-indigo-200 bg-indigo-50/50 text-indigo-600' : ''}
                                `}
                            >
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{format(day, 'EEE', { locale: fr })}</span>
                                <span className="text-xl font-bold mt-1">{format(day, 'd')}</span>
                                {data.events.some(e => isSameDay(new Date(e.date), day)) && (
                                    <div className={`w-1.5 h-1.5 rounded-full mt-2 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Desktop: Standard Grid */}
                <div className="hidden md:grid grid-cols-7 gap-3">
                    {calendarDays.slice(0, 7).map((day) => {
                        const isToday = isSameDay(day, today);
                        const dayEvents = data.events.filter(e => isSameDay(new Date(e.date), day));
                        return (
                            <div key={day.toString()} className={`min-h-[180px] rounded-2xl p-3 flex flex-col gap-2 transition-all ${isToday ? 'bg-indigo-50/30 border-2 border-indigo-200' : 'bg-slate-50/50 border border-slate-100'}`}>
                                <div className={`text-center py-1 rounded-lg font-bold ${isToday ? 'text-indigo-700' : 'text-slate-400'}`}>
                                    <span className="text-xs uppercase">{format(day, 'EEE', { locale: fr })}</span> <span className="text-lg">{format(day, 'd')}</span>
                                </div>
                                <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                                    {dayEvents.map(evt => (
                                        <div key={evt.id} className="p-2 bg-white rounded-lg border border-slate-100 text-xs shadow-sm truncate border-l-4 border-l-indigo-500 pl-2">
                                            <span className="font-bold text-slate-700">{evt.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Mobile: Selected Day Event List */}
            <div className="md:hidden space-y-4">
                 <h3 className="text-lg font-bold text-slate-800 px-1">
                    {isSameDay(selectedDay, today) ? "Aujourd'hui" : format(selectedDay, 'EEEE d MMMM', { locale: fr })}
                 </h3>
                 {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map(evt => (
                        <div key={evt.id} className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                             <div className="flex flex-col justify-center text-slate-400 font-bold text-xs w-12 text-center leading-tight">
                                <span>{format(new Date(evt.date), 'HH:mm')}</span>
                             </div>
                             <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-base">{evt.title}</h4>
                                {evt.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{evt.description}</p>}
                             </div>
                             <button onClick={() => onDeleteEvent(evt.id)} className="p-2 text-rose-300 hover:text-rose-500">
                                <Trash2 size={18} />
                             </button>
                        </div>
                    ))
                 ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm font-medium">Rien de prévu pour ce jour.</p>
                    </div>
                 )}
            </div>
        </div>

        {/* Desktop Sidebar (Upcoming) */}
        <div className="hidden xl:block space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Clock size={20}/></div>
                    Prochainement
                </h3>
                <div className="space-y-4 relative">
                    <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                    {data.events
                        .filter(e => new Date(e.date) >= new Date())
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, 5) // Limit to 5
                        .map(event => (
                        <div key={event.id} className="relative pl-12 group">
                            <div className="absolute left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-400 rounded-full z-10 group-hover:scale-125 transition-transform"></div>
                            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer">
                                <div className="flex flex-col items-center justify-center w-12 h-12 bg-white text-slate-900 rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                                    <span className="text-[9px] font-black uppercase text-indigo-500">{format(new Date(event.date), 'MMM', { locale: fr })}</span>
                                    <span className="text-lg font-bold leading-none">{format(new Date(event.date), 'dd')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate">{event.title}</h4>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-bold">
                                        <Clock size={12}/> {format(new Date(event.date), 'HH:mm')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}
                </div>
            </div>
        </div>

      </div>

      {/* FAB Removed here to prevent overlap with WhatsApp button */}

      {/* Add Event Modal (Mobile + Desktop) */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Nouvel Événement</h3>
                    <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X size={20} className="text-slate-600"/>
                    </button>
                 </div>
                 
                 <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Titre</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 text-base font-semibold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Réunion..."
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date & Heure</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 text-base font-semibold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Note (Optionnel)</label>
                        <textarea
                            className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 text-base font-semibold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none resize-none transition-all"
                            rows={3}
                            placeholder="Détails..."
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full py-4 text-base font-bold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex justify-center items-center gap-2">
                             <Plus size={20} /> Créer l'événement
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}

    </div>
  );
};

export default CalendarView;