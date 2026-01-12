
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
  User as UserIcon,
  Filter,
  MoreHorizontal
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

  const [formData, setFormData] = useState({ first_name: '', last_name: '', class_id: '', gender: 'M' });
  const [bulkData, setBulkData] = useState({ names: '', class_id: '' });
  const [editData, setEditData] = useState({ first_name: '', last_name: '', class_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('students').select('*').order('last_name', { ascending: true })
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const { error } = await supabase.from('students').insert([formData]);
      if (error) throw error;
      setFeedback({ type: 'success', msg: 'Student enrolled successfully.' });
      setShowAddModal(false);
      setFormData({ first_name: '', last_name: '', class_id: classes[0]?.id || '', gender: 'M' });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = bulkData.names.split('\n').filter(n => n.trim() !== '');
    if (names.length === 0) return;

    setProcessing(true);
    try {
      const payloads = names.map(name => {
        const parts = name.trim().split(/\s+/);
        const last = parts[0] || 'Unknown';
        const first = parts.slice(1).join(' ') || '-';
        return { first_name: first, last_name: last, class_id: bulkData.class_id, gender: 'M' };
      });

      const { error } = await supabase.from('students').insert(payloads);
      if (error) throw error;
      setFeedback({ type: 'success', msg: `${names.length} students imported.` });
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

  const deleteStudent = async (id: string) => {
    if (!confirm(`Delete student record? This cannot be undone.`)) return;
    
    setProcessing(true);
    try {
      await Promise.all([
        supabase.from('marks').delete().eq('student_id', id),
        supabase.from('attendance').delete().eq('student_id', id),
        supabase.from('fee_payments').delete().eq('student_id', id)
      ]);
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      setFeedback({ type: 'success', msg: 'Student record deleted.' });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setProcessing(false);
      setTimeout(() => setFeedback(null), 3000);
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
        <div className={`fixed top-6 right-6 ${feedback.type === 'success' ? 'bg-indigo-600' : 'bg-rose-600'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 text-sm font-semibold animate-in slide-in-from-right-8`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="bg-white border border-slate-200 pl-10 pr-8 py-2.5 rounded-lg text-sm font-medium outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-100"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {user.role === UserRole.ADMIN && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBulkModal(true)} 
              className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <ListPlus size={18} /> Bulk Import
            </button>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus size={18} /> Enroll Student
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm">No students found.</td></tr>
            ) : filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
                      {student.first_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{student.last_name} {student.first_name}</p>
                      <p className="text-[11px] text-slate-500">Reg ID: {student.id.split('-')[0]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 font-medium">
                    {classes.find(c => c.id === student.class_id)?.name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100">
                    Enrolled
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"><Edit3 size={16} /></button>
                    {user.role === UserRole.ADMIN && (
                      <button onClick={() => deleteStudent(student.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simplified Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">New Student Enrollment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Last Name</label>
                  <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">First Name</label>
                  <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Assign to Class</label>
                <select required className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none" value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button disabled={processing} type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                {processing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                Confirm Enrollment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Simplified Bulk Import */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">Bulk Roster Import</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleBulkAdd} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Target Class</label>
                <select required className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none" value={bulkData.class_id} onChange={e => setBulkData({...bulkData, class_id: e.target.value})}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Student Names (One per line: SURNAME GivenName)</label>
                <textarea 
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm font-mono focus:border-indigo-500 outline-none resize-none"
                  placeholder="NSENGIMANA Jean-Paul&#10;KARENZI Alice"
                  value={bulkData.names}
                  onChange={e => setBulkData({...bulkData, names: e.target.value})}
                />
              </div>
              <button disabled={processing} type="submit" className="w-full bg-slate-800 text-white py-3 rounded-lg font-semibold text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                {processing ? <Loader2 size={16} className="animate-spin" /> : <ListPlus size={16} />} 
                Process Roster
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
