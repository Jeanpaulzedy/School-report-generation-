
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Student, Class } from '../types';
import { Loader2, Check, X, Clock, Save, Search, AlertCircle, Calendar } from 'lucide-react';

export const AttendancePage: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').order('name');
      setClasses(data || []);
      setLoading(false);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      setLoading(true);
      const { data: studentsData } = await supabase.from('students').select('*').eq('class_id', selectedClass).order('last_name', { ascending: true });
      setStudents(studentsData || []);
      const { data: existingAtt } = await supabase.from('attendance').select('*').eq('class_id', selectedClass).eq('date', date);
      const attMap: Record<string, any> = {};
      existingAtt?.forEach(a => attMap[a.student_id] = a.status);
      setAttendance(attMap);
      setLoading(false);
    };
    fetchStudents();
  }, [selectedClass, date]);

  const toggleStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const payloads = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        date: date,
        status: status,
        class_id: selectedClass
      }));
      await supabase.from('attendance').upsert(payloads, { onConflict: 'student_id,date' });
      setFeedback({ type: 'success', msg: 'Daily attendance synchronized.' });
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      {feedback && (
        <div className={`fixed top-6 right-6 ${feedback.type === 'success' ? 'bg-indigo-600' : 'bg-rose-600'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 text-sm font-semibold`}>
          {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Class Level</label>
          <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Select a class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Session Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-sm font-semibold outline-none" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {selectedClass ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-sm font-bold text-slate-800">Class Roster • {students.length} Students</h3>
            <button onClick={saveAttendance} disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Sync Records
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-16">No.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-center text-slate-400 text-xs font-medium">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{s.last_name} {s.first_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1.5">
                      {[
                        { id: 'present', icon: Check, active: 'bg-emerald-600 text-white shadow-sm', inactive: 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100' },
                        { id: 'absent', icon: X, active: 'bg-rose-600 text-white shadow-sm', inactive: 'bg-rose-50 text-rose-400 hover:bg-rose-100' },
                        { id: 'late', icon: Clock, active: 'bg-amber-600 text-white shadow-sm', inactive: 'bg-amber-50 text-amber-400 hover:bg-amber-100' }
                      ].map(st => (
                        <button key={st.id} onClick={() => toggleStatus(s.id, st.id as any)} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${attendance[s.id] === st.id ? st.active : st.inactive}`}>
                          <st.icon size={16} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-24 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
          <Search size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-semibold text-sm">Select a class to manage daily attendance.</p>
        </div>
      )}
    </div>
  );
};
