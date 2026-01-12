
import React, { useState, useEffect, useRef } from 'react';
import { User, Student, Subject, ExamType } from '../types';
import { supabase } from '../supabaseClient';
import { Save, ClipboardList, Loader2, ClipboardPaste, Target } from 'lucide-react';

export const MarksEntryPage: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  const [marks, setMarks] = useState<Record<string, string>>({});
  const [originalMarks, setOriginalMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const currentSubjectMax = subjects.find(s => s.id === selectedSubject)?.max_marks || 100;

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const [classesRes, subjectsRes, examTypesRes] = await Promise.all([
          supabase.from('classes').select('*').order('name'),
          supabase.from('subjects').select('*').order('name'),
          supabase.from('exam_types').select('*').order('name')
        ]);
        setClasses(classesRes.data || []);
        setSubjects(subjectsRes.data || []);
        setExamTypes(examTypesRes.data || []);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchStudentsAndExistingMarks = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      setLoading(true);
      try {
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', selectedClass)
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true });
        
        setStudents(studentsData || []);

        if (selectedSubject && selectedExam) {
          const { data: marksData } = await supabase.from('marks').select('student_id, score').eq('subject_id', selectedSubject).eq('exam_type_id', selectedExam);
          const marksMap: Record<string, string> = {};
          marksData?.forEach(m => { marksMap[m.student_id] = m.score.toString(); });
          setMarks(marksMap);
          setOriginalMarks(marksMap);
        } else {
          setMarks({});
          setOriginalMarks({});
        }
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndExistingMarks();
  }, [selectedClass, selectedSubject, selectedExam]);

  const handleMarkChange = (studentId: string, value: string) => {
    if (value === '') {
      setMarks(prev => ({ ...prev, [studentId]: '' }));
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= currentSubjectMax) {
      setMarks(prev => ({ ...prev, [studentId]: value }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextStudent = students[index + 1];
      if (nextStudent) inputRefs.current[nextStudent.id]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudent = students[index - 1];
      if (prevStudent) inputRefs.current[prevStudent.id]?.focus();
    }
  };

  const applyPaste = () => {
    const lines = pasteContent.split(/[\s,]+/).map(l => l.trim()).filter(l => l !== '');
    const newMarks = { ...marks };
    students.forEach((student, index) => {
      if (lines[index]) {
        const val = parseFloat(lines[index]);
        if (!isNaN(val) && val >= 0 && val <= currentSubjectMax) newMarks[student.id] = lines[index];
      }
    });
    setMarks(newMarks);
    setShowPasteModal(false);
    setPasteContent('');
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) return;
    setSaving(true);
    try {
      const marksToInsert = Object.entries(marks)
        .filter(([_, score]) => score !== '')
        .map(([studentId, score]) => ({
          student_id: studentId,
          subject_id: selectedSubject,
          exam_type_id: selectedExam,
          score: parseFloat(score as string),
          term: 'Term 1',
          academic_year: '2024/2025'
        }));

      const { error } = await supabase.from('marks').upsert(marksToInsert, { onConflict: 'student_id,subject_id,exam_type_id' });
      if (error) throw error;
      setOriginalMarks({...marks});
      setFeedback({ type: 'success', message: 'Marks saved and synced.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target Class</label>
          <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Choose...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject</label>
          <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="">Choose...</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Exam Type</label>
          <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
            <option value="">Choose...</option>
            {examTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {feedback.message}
        </div>
      )}

      {selectedClass ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Grading Sheet</h3>
            <div className="flex gap-3">
              <button onClick={() => setShowPasteModal(true)} className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ClipboardPaste size={16} /> Paste</button>
              <button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Sync</button>
            </div>
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No.</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student (Alphabetical)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-48">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-6 py-6 text-center text-xs font-black text-slate-300">{(idx + 1)}</td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-800 uppercase">{student.last_name} {student.first_name}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <input 
                        ref={(el) => (inputRefs.current[student.id] = el)}
                        type="number"
                        className="w-24 text-center py-3 border-2 rounded-xl font-black text-lg focus:border-indigo-600 outline-none"
                        value={marks[student.id] || ''}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-32 text-center text-slate-300">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="font-black uppercase tracking-widest text-xs">Select class context to start</h3>
        </div>
      )}

      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Bulk Paste</h3>
            <textarea rows={10} className="w-full bg-slate-50 border-2 rounded-2xl p-4 font-mono text-sm outline-none" placeholder="Paste scores column..." value={pasteContent} onChange={(e) => setPasteContent(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => setShowPasteModal(false)} className="flex-1 font-black text-[10px] uppercase">Cancel</button>
              <button onClick={applyPaste} className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
