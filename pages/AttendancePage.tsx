
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Student, Class } from '../types';
import { Loader2, Check, X, Clock, Calendar as CalIcon, Save, Search, AlertCircle } from 'lucide-react';

export const AttendancePage: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { data: studentsData } = await supabase.from('students').select('*').eq('class_id', selectedClass).order('last_name', { ascending: true }).order('first_name', { ascending: true });
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
      alert('Attendance saved.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Class</label>
          <select className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-bold outline-none" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Choose class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Date</label>
          <input type="date" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-bold outline-none" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {selectedClass ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Roster Status</h3>
            <button onClick={saveAttendance} disabled={saving} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Sync
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No.</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student (Alphabetical)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-6 text-center font-black text-slate-300 text-xs">{idx + 1}</td>
                  <td className="px-8 py-6 font-bold text-slate-800 text-sm uppercase">{s.last_name} {s.first_name}</td>
                  <td className="px-8 py-6 flex justify-center gap-2">
                    {[
                      { id: 'present', icon: Check, active: 'bg-emerald-600 text-white', inactive: 'bg-emerald-50 text-emerald-400' },
                      { id: 'absent', icon: X, active: 'bg-rose-600 text-white', inactive: 'bg-rose-50 text-rose-400' },
                      { id: 'late', icon: Clock, active: 'bg-amber-600 text-white', inactive: 'bg-amber-50 text-amber-400' }
                    ].map(st => (
                      <button key={st.id} onClick={() => toggleStatus(s.id, st.id as any)} className={`p-3 rounded-xl transition-all ${attendance[s.id] === st.id ? st.active : st.inactive}`}>
                        <st.icon size={18} />
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]">
          <Search size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Select a class roster</p>
        </div>
      )}
    </div>
  );
};
