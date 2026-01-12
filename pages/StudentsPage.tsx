
import React, { useState, useEffect } from 'react';
import { User, Student, UserRole } from '../types';
import { supabase } from '../supabaseClient';
import { 
  Search, 
  UserPlus, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Loader2, 
  ListPlus, 
  Edit3, 
  User as UserIcon
} from 'lucide-react';

export const StudentsPage: React.FC<{ user: User }> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean, student: Student | null }>({ open: false, student: null });
  
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const [formData, setFormData] = useState({ fullName: '', class_id: '' });
  const [bulkData, setBulkData] = useState({ names: '', class_id: '' });
  const [editData, setEditData] = useState({ first_name: '', last_name: '', class_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('students').select('*').order('last_name', { ascending: true }).order('first_name', { ascending: true })
      ]);
      setClasses(classesRes.data || []);
      setStudents(studentsRes.data || []);
      
      const firstClassId = classesRes.data?.[0]?.id || '';
      if (!formData.class_id) setFormData(prev => ({ ...prev, class_id: firstClassId }));
      if (!bulkData.class_id) setBulkData(prev => ({ ...prev, class_id: firstClassId }));
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.class_id) return;
    
    setProcessing(true);
    try {
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Student';

      const payload = {
        student_id: `S${Date.now().toString().slice(-6)}`,
        first_name: firstName,
        last_name: lastName,
        class_id: formData.class_id,
        gender: 'M',
        dob: '2010-01-01'
      };

      const { error: insertError } = await supabase.from('students').insert([payload]);
      if (insertError) throw insertError;
      
      setFeedback({ type: 'success', msg: `${formData.fullName} enrolled.` });
      setShowAddModal(false);
      setFormData({ ...formData, fullName: '' });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleBulkRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkData.names.trim() || !bulkData.class_id) return;
    
    setProcessing(true);
    try {
      const namesList = bulkData.names.split('\n').filter(n => n.trim() !== '');
      const studentsToInsert = namesList.map(name => {
        const parts = name.trim().split(' ');
        return {
          student_id: `S${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          first_name: parts[0] || 'Unknown',
          last_name: parts.slice(1).join(' ') || 'Student',
          class_id: bulkData.class_id,
          gender: 'M',
          dob: '2010-01-01'
        };
      });

      const { error: bulkError } = await supabase.from('students').insert(studentsToInsert);
      if (bulkError) throw bulkError;

      setFeedback({ type: 'success', msg: `${studentsToInsert.length} students enrolled.` });
      setShowBulkModal(false);
      setBulkData({ ...bulkData, names: '' });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.student) return;

    setProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from('students')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          class_id: editData.class_id
        })
        .eq('id', editModal.student.id);

      if (updateError) throw updateError;

      setFeedback({ type: 'success', msg: 'Profile updated successfully.' });
      setEditModal({ open: false, student: null });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const deleteStudent = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (!confirm(`DANGER: Delete ${student?.last_name} ${student?.first_name}? This will erase all their marks permanently.`)) return;
    
    setProcessing(true);
    try {
      await supabase.from('marks').delete().eq('student_id', id);
      const { error: delError } = await supabase.from('students').delete().eq('id', id);
      if (delError) throw delError;
      
      setFeedback({ type: 'success', msg: 'Student records erased.' });
      if (editModal.open) setEditModal({ open: false, student: null });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: `Deletion failed: ${err.message}` });
    } finally {
      setProcessing(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesClass = selectedClassFilter === 'all' || s.class_id === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`fixed top-4 right-4 ${feedback.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] font-black text-sm uppercase tracking-widest`}>
          {feedback.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-70"><X size={18} /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200 w-full max-w-lg shadow-sm">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search student names..."
            className="outline-none bg-transparent w-full text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="flex-1 md:flex-none bg-white border border-slate-200 px-6 py-4 rounded-2xl text-sm font-bold outline-none"
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          {user.role === UserRole.ADMIN && (
            <div className="flex gap-2">
              <button onClick={() => setShowBulkModal(true)} className="bg-slate-800 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"><ListPlus size={18} /> Bulk</button>
              <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg flex items-center gap-2 transition-all"><UserPlus size={18} /> New</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No.</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Class</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-8 py-24 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px]">No Records</td></tr>
            ) : filteredStudents.map((student, index) => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-6 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-[10px] font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {index + 1}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                    {student.last_name} {student.first_name}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase">
                    {classes.find(c => c.id === student.class_id)?.name || 'N/A'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        setEditData({ first_name: student.first_name, last_name: student.last_name, class_id: student.class_id });
                        setEditModal({ open: true, student });
                      }} 
                      className="p-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    {user.role === UserRole.ADMIN && (
                      <button onClick={() => deleteStudent(student.id)} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editModal.open && editModal.student && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-10 text-white flex justify-between items-start">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center text-white">
                  <UserIcon size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">Student Profile</h3>
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-2">Rename or Reassign</p>
                </div>
              </div>
              <button onClick={() => setEditModal({ open: false, student: null })} className="text-white hover:bg-white/10 p-2 rounded-xl transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdateStudent} className="p-10 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Last Name</label>
                  <input required type="text" className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 outline-none font-bold text-slate-700" value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">First Name</label>
                  <input required type="text" className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 outline-none font-bold text-slate-700" value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Class Stream</label>
                  <select required className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 outline-none" value={editData.class_id} onChange={e => setEditData({...editData, class_id: e.target.value})}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => deleteStudent(editModal.student!.id)} className="px-6 py-5 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={20} /></button>
                <button disabled={processing} type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95">{processing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Sync Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 p-10 text-white flex justify-between items-center">
              <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-white/10 p-2 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleRegister} className="p-10 space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Full Name</label>
                <input required autoFocus type="text" className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" placeholder="First and Last name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Class Level</label>
                <select required className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px]">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-indigo-700 shadow-xl transition-all">Enroll</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">Bulk Batch</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Enroll Entire List</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white transition-all"><X size={28} /></button>
            </div>
            <form onSubmit={handleBulkRegister} className="p-10 space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Class Stream</label>
                <select required className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" value={bulkData.class_id} onChange={e => setBulkData({...bulkData, class_id: e.target.value})}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <textarea required className="w-full px-6 py-5 rounded-3xl border-2 border-slate-100 font-mono text-xs h-64 bg-slate-50/50 resize-none outline-none" placeholder="Paste names one per line..." value={bulkData.names} onChange={e => setBulkData({...bulkData, names: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px]">Discard</button>
                <button type="submit" className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-indigo-700 shadow-xl transition-all">Start Batch Process</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
