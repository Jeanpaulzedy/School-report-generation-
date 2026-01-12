
import React, { useState, useEffect } from 'react';
import { Settings2, Plus, Info, Loader2, Save, X, AlertCircle, ClipboardCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ExamType } from '../types';

export const ExamTypesPage: React.FC = () => {
  const [exams, setExams] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: ''
  });

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase.from('exam_types').select('*').order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setExams(data || []);
    } catch (err: any) {
      console.error('Error fetching exam types:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('exam_types').insert([formData]);
      if (insertError) throw insertError;
      
      setShowModal(false);
      setFormData({ name: '' });
      fetchExams();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h4 className="font-black text-indigo-900 text-sm uppercase tracking-tight">Independent Assessments</h4>
          <p className="text-indigo-700 text-xs mt-1 leading-relaxed">
            All assessments are recorded out of 100 independently. Use this section to define midterm tests, assignments, or unit tests.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Assessment Registry</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manage midterm and test categories</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={16} />
            Add New Test Type
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Framework...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
               <p className="text-xs font-bold uppercase tracking-widest">No assessment types defined.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grading Basis</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{exam.name}</span>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Status: Active</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">Independent (100%)</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-all">
                        <Settings2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tighter uppercase">Add Assessment</h3>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">Midterm Configuration</p>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:bg-indigo-500 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-10 space-y-8">
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Assessment Name (e.g. Midterm Test 1)</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-black text-slate-700"
                    placeholder="Midterm, Assignment..."
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Calculation Note:</p>
                   <p className="text-xs text-slate-600 mt-1">This assessment will be graded out of 100 independently from other tests.</p>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  Discard
                </button>
                <button 
                  disabled={saving}
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {saving ? 'Saving...' : 'Register Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
