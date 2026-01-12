
import React, { useState, useEffect } from 'react';
import { User, Class } from '../types';
import { FileDown, Search, Loader2, X, MessageSquareQuote, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../supabaseClient';

export const ReportCardsPage: React.FC<{ user: User }> = ({ user }) => {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  
  const [commentModal, setCommentModal] = useState<{ open: boolean, student: any, content: string }>({
    open: false, student: null, content: ''
  });

  const commentTemplates = [
    "A hardworking and disciplined student with excellent academic potential.",
    "Shows remarkable interest in all subjects; a consistent top performer.",
    "A brilliant student who consistently delivers high-quality work.",
    "Displays good character and leadership qualities in class.",
    "Needs to focus more on scientific subjects to improve overall average.",
    "Has shown significant improvement this term; keep up the effort."
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsRes, classesRes] = await Promise.all([
          supabase.from('students').select('*').order('last_name', { ascending: true }).order('first_name', { ascending: true }),
          supabase.from('classes').select('*')
        ]);
        setStudents(studentsRes.data || []);
        setClasses(classesRes.data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGrade = (percentage: number) => {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  };

  const calculateFullReportData = async (student: any) => {
    const { data: classStudents } = await supabase.from('students').select('id').eq('class_id', student.class_id);
    if (!classStudents) return null;
    const classIds = classStudents.map(s => s.id);

    const { data: allMarks } = await supabase.from('marks').select('*').in('student_id', classIds);
    const { data: subjects } = await supabase.from('subjects').select('*').order('name');
    if (!allMarks || !subjects) return null;

    const subjectStats = subjects.map(subject => {
      const studentScore = allMarks.find(m => m.student_id === student.id && m.subject_id === subject.id)?.score || 0;
      const allScoresForSubject = classIds.map(sid => {
        return allMarks.find(m => m.student_id === sid && m.subject_id === subject.id)?.score || 0;
      }).sort((a, b) => b - a);
      const subjectRank = allScoresForSubject.indexOf(studentScore) + 1;
      return { id: subject.id, name: subject.name, obtained: studentScore, max: subject.max_marks || 100, rank: subjectRank, totalInClass: classIds.length };
    });

    const studentAverages = classIds.map(sid => {
      const marks = allMarks.filter(m => m.student_id === sid);
      const obtained = marks.reduce((acc, m) => acc + m.score, 0);
      const totalMax = subjects.reduce((acc, sub) => acc + (sub.max_marks || 100), 0);
      return { id: sid, obtained, totalMax, percentage: totalMax > 0 ? (obtained / totalMax) * 100 : 0 };
    });

    studentAverages.sort((a, b) => b.percentage - a.percentage);
    const finalRank = studentAverages.findIndex(s => s.id === student.id) + 1;
    const myStats = studentAverages.find(s => s.id === student.id);

    return { subjectStats, finalRank, totalInClass: classIds.length, overallObtained: myStats?.obtained || 0, overallMax: myStats?.totalMax || 0, overallPercentage: myStats?.percentage || 0 };
  };

  const generatePDF = async (student: any) => {
    setGeneratingId(student.id);
    try {
      const reportData = await calculateFullReportData(student);
      const { data: settings } = await supabase.from('school_settings').select('*').maybeSingle();
      if (!reportData) throw new Error("Calculation error.");

      const school = settings || { school_name: 'ESP RULI', address: 'Rwanda' };
      const studentClass = classes.find(c => c.id === student.class_id);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138);
      doc.setFont('helvetica', 'bold');
      doc.text(school.school_name.toUpperCase(), pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('REPUBLIC OF RWANDA - MINISTRY OF EDUCATION', pageWidth / 2, 32, { align: 'center' });
      doc.text(school.address?.toUpperCase() || '', pageWidth / 2, 38, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 44, pageWidth - 20, 44);

      doc.setFillColor(248, 250, 252);
      doc.rect(20, 50, pageWidth - 40, 30, 'F');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`STUDENT: ${student.last_name} ${student.first_name}`.toUpperCase(), 25, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(`CLASS: ${studentClass?.name || 'N/A'}`, 25, 70);
      
      doc.text(`ACADEMIC YEAR: 2024/2025`, pageWidth - 85, 60);
      doc.setFont('helvetica', 'bold');
      doc.text(`RANK: ${reportData.finalRank} / ${reportData.totalInClass}`, pageWidth - 85, 70);

      const tableBody = reportData.subjectStats.map(s => [
        s.name.toUpperCase(),
        s.obtained.toFixed(1),
        s.max,
        `${s.rank}/${s.totalInClass}`,
        getGrade((s.obtained / s.max) * 100),
        (s.obtained / s.max) >= 0.5 ? 'PASS' : 'FAIL'
      ]);

      autoTable(doc, {
        startY: 90,
        head: [['SUBJECT', 'OBTAINED', 'MAX', 'POSITION', 'GRADE', 'REMARK']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], halign: 'center' },
        columnStyles: { 0: { cellWidth: 70 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: ${reportData.overallObtained.toFixed(1)} / ${reportData.overallMax} (${reportData.overallPercentage.toFixed(1)}%)`, 20, finalY);
      doc.text(`OVERALL GRADE: ${getGrade(reportData.overallPercentage)}`, 20, finalY + 10);

      doc.save(`ReportCard_${student.last_name}.pdf`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const filtered = students.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Search student roster..." className="w-full bg-white border border-slate-200 rounded-3xl pl-14 pr-8 py-5 outline-none font-semibold shadow-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((student, index) => (
          <div key={student.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group hover:border-indigo-400 transition-all">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight leading-none">{student.last_name} {student.first_name}</h3>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1.5">{classes.find(c => c.id === student.class_id)?.name}</p>
              </div>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button onClick={() => setCommentModal({ open: true, student, content: '' })} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-100">
                <MessageSquareQuote size={16} /> Observation
              </button>
            </div>

            <button onClick={() => generatePDF(student)} disabled={generatingId === student.id} className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg disabled:bg-slate-200 transition-all">
              {generatingId === student.id ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />}
              {generatingId === student.id ? 'Wait...' : 'Export PDF'}
            </button>
          </div>
        ))}
      </div>

      {commentModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Report Observation</h3>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {commentTemplates.map((t, i) => (
                <button key={i} onClick={() => setCommentModal({ ...commentModal, content: t })} className={`text-left p-4 rounded-xl text-[11px] font-bold border-2 ${commentModal.content === t ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50'}`}>{t}</button>
              ))}
            </div>
            <textarea className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium outline-none min-h-[100px]" placeholder="Type custom observation..." value={commentModal.content} onChange={(e) => setCommentModal({...commentModal, content: e.target.value})} />
            <button onClick={() => setCommentModal({ ...commentModal, open: false })} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px]">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
};
