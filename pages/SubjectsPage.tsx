
import React, { useState, useEffect } from 'react';
import { BookPlus, Search, GraduationCap, Languages, Loader2, X, Trash2, Save, AlertCircle, Target } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    max_marks: '100'
  });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });
      
      if (fetchError) throw fetchError;
      setSubjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = formData.title.trim();
    if (!cleanTitle) return;

    setProcessing(true);
    setError(null);
    try {
      const internalCode = `SUB-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const { error: insertError } = await supabase.from('subjects').insert([{
        name: cleanTitle,
        code: internalCode,
        category: 'General',
        max_marks: parseInt(formData.max_marks) || 100
      }]);

      if (insertError) throw insertError;
      
      setShowAddModal(false);
      setFormData({ title: '', max_marks: '100' });
      fetchSubjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Remove this subject from the curriculum?')) return;
    try {
      const { error: delError } = await supabase.from('subjects').delete().eq('id', id);
      if (delError) throw delError;
      fetchSubjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredSubjects = subjects.filter(s => 
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search curriculum..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-4 focus:ring-indigo-100 shadow-sm transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <BookPlus size={18} />
          Define Subject
        </button>
      </div>

      {loading ? (
        <div className="text-center py-24 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Curriculum...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSubjects.map((sub) => (
            <div key={sub.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col group hover:border-indigo-400 transition-all relative overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Languages size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight leading-tight">{sub.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Target size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-500 uppercase">Max Marks: {sub.max_marks || 100}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => deleteSubject(sub.id)} 
                  className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all"
                  title="Remove Subject"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-10 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">New Subject</h3>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-indigo-500 p-2 rounded-xl transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Subject Name</label>
                  <input 
                    required autoFocus
                    type="text" 
                    className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-black text-2xl text-slate-800"
                    placeholder="e.g. Mathematics"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Maximum Marks (Out of)</label>
                  <div className="relative">
                    <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      required
                      type="number" 
                      className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-black text-2xl text-slate-800"
                      placeholder="100"
                      value={formData.max_marks}
                      onChange={e => setFormData({ ...formData, max_marks: e.target.value })}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-3 tracking-widest">Reports will show scores relative to this max.</p>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancel</button>
                <button 
                  disabled={processing}
                  type="submit"
                  className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {processing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Sync Curriculum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
