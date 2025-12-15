import React, { useRef } from 'react';
import { AppData, DocumentItem, User } from '../types';
import { FileText, Download, Upload, File, FileSpreadsheet, FileImage, MoreVertical, Search, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DocumentsProps {
  data: AppData;
  currentUser: User;
  onAddDocument: (doc: DocumentItem) => void;
}

const Documents: React.FC<DocumentsProps> = ({ data, currentUser, onAddDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc: DocumentItem = {
        id: Date.now().toString(),
        name: file.name,
        type: 'OTHER',
        date: new Date().toISOString(),
        authorId: currentUser.id,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      };
      onAddDocument(newDoc);
    }
  };

  const getIcon = (name: string) => {
      if (name.endsWith('.pdf')) return <FileText size={28} className="text-rose-500" />;
      if (name.endsWith('.xls') || name.endsWith('.xlsx')) return <FileSpreadsheet size={28} className="text-emerald-500" />;
      if (name.endsWith('.jpg') || name.endsWith('.png')) return <FileImage size={28} className="text-sky-500" />;
      return <File size={28} className="text-slate-400" />;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             Documents
             <span className="text-sm font-medium bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{data.documents.length} fichiers</span>
           </h1>
           <p className="text-slate-500 mt-2 font-medium">Centralisez vos contrats et justificatifs.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Rechercher un fichier..." 
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-violet-100 focus:border-violet-500 outline-none shadow-sm transition-all"
                />
            </div>
            <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
            />
            <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/20 active:scale-95 whitespace-nowrap"
            >
            <Upload size={20} /> <span className="hidden sm:inline">Upload</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Upload Card */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group border-2 border-dashed border-slate-300 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-violet-600 hover:border-violet-400 hover:bg-violet-50/50 transition-all cursor-pointer min-h-[220px]"
          >
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                 <Upload size={28} />
              </div>
              <span className="font-bold text-sm">Ajouter un document</span>
          </div>

          {data.documents.map((doc) => (
              <div key={doc.id} className="group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between min-h-[220px]">
                  <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                          <MoreVertical size={18} />
                      </button>
                  </div>

                  <div>
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 border border-slate-100 shadow-sm">
                          {getIcon(doc.name)}
                      </div>
                      
                      <h4 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 mb-1" title={doc.name}>{doc.name}</h4>
                      <p className="text-xs font-semibold text-slate-400">{doc.size}</p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-50 flex justify-between items-end">
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ajouté le</span>
                          <span className="text-xs font-semibold text-slate-600">{format(new Date(doc.date), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                      <button className="w-10 h-10 bg-slate-50 text-slate-600 hover:bg-violet-600 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm group/btn">
                          <Download size={18} className="group-hover/btn:scale-110 transition-transform"/>
                      </button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default Documents;