
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Class } from '../types';
import { Wallet, Loader2, Save, CreditCard, TrendingUp, Filter, CheckCircle } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [totalTermFee, setTotalTermFee] = useState(100000);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{msg: string} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [stdRes, clsRes, feeRes] = await Promise.all([
      supabase.from('students').select('*').order('last_name', { ascending: true }),
      supabase.from('classes').select('*'),
      supabase.from('fee_payments').select('*')
    ]);

    const stdList = (stdRes.data || []).map(s => {
      const payment = feeRes.data?.find(p => p.student_id === s.id);
      return { ...s, paid: payment?.amount_paid || 0, total: payment?.total_expected || totalTermFee };
    });

    setStudents(stdList);
    setClasses(clsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updatePayment = async (studentId: string, amount: number) => {
    setSavingId(studentId);
    try {
      await supabase.from('fee_payments').upsert({
        student_id: studentId,
        amount_paid: amount,
        total_expected: totalTermFee,
        term: 'Term 1',
        date: new Date().toISOString()
      }, { onConflict: 'student_id,term' });
      setFeedback({ msg: 'Payment updated.' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const filtered = selectedClass === 'all' ? students : students.filter(s => s.class_id === selectedClass);
  const totalCollected = students.reduce((acc, s) => acc + s.paid, 0);
  const totalExpected = students.length * totalTermFee;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {feedback && (
        <div className="fixed top-6 right-6 bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-lg z-50 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={14} /> {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-6 rounded-xl text-white shadow-md">
          <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Total Revenue Collected</p>
          <h2 className="text-2xl font-bold tracking-tight">{totalCollected.toLocaleString()} RWF</h2>
          <div className="mt-4 h-1 w-full bg-indigo-800 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${(totalCollected/totalExpected)*100}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Collection Efficiency</p>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {((totalCollected/totalExpected)*100 || 0).toFixed(1)}%
          </h2>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Against targeted {totalExpected.toLocaleString()} RWF</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
             <CreditCard size={24} />
           </div>
           <div className="flex-1">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Policy: Term Fee</span>
             <input type="number" className="font-bold text-lg text-slate-800 bg-transparent outline-none w-full border-b border-dashed border-slate-200 focus:border-indigo-600" value={totalTermFee} onChange={(e) => setTotalTermFee(parseInt(e.target.value))} />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/20">
          <h3 className="text-sm font-bold text-slate-800">Financial Roster</h3>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select className="bg-white border border-slate-200 rounded-lg pl-9 pr-6 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-100" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="all">Global (All Streams)</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount Paid (RWF)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status & Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 text-center text-xs font-medium text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-5 font-semibold text-slate-800 text-sm">{s.last_name} {s.first_name}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <input type="number" className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-sm text-slate-700 outline-none focus:border-indigo-500" value={s.paid} onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setStudents(prev => prev.map(p => p.id === s.id ? { ...p, paid: val } : p));
                        }} />
                      <button onClick={() => updatePayment(s.id, s.paid)} disabled={savingId === s.id} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-all">
                        {savingId === s.id ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${s.paid >= totalTermFee ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {s.paid >= totalTermFee ? 'Fully Paid' : `Balance: ${(totalTermFee - s.paid).toLocaleString()}`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
