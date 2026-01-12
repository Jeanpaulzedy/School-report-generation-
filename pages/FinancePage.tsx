
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Class } from '../types';
import { Wallet, Loader2, Save, CreditCard, TrendingUp } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [totalTermFee, setTotalTermFee] = useState(100000);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [stdRes, clsRes, feeRes] = await Promise.all([
      supabase.from('students').select('*').order('last_name', { ascending: true }).order('first_name', { ascending: true }),
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
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = selectedClass === 'all' ? students : students.filter(s => s.class_id === selectedClass);
  const totalCollected = students.reduce((acc, s) => acc + s.paid, 0);
  const totalExpected = students.length * totalTermFee;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/30">
          <div className="flex items-center gap-3 mb-4 opacity-80"><Wallet size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Collected</span></div>
          <h2 className="text-3xl font-black tracking-tighter">{totalCollected.toLocaleString()} RWF</h2>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-400"><TrendingUp size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Rate</span></div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{((totalCollected/totalExpected)*100 || 0).toFixed(1)}%</h2>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CreditCard size={28} /></div>
           <div className="flex-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Term Fee Policy</span>
             <input type="number" className="font-black text-xl text-slate-800 bg-transparent outline-none w-full" value={totalTermFee} onChange={(e) => setTotalTermFee(parseInt(e.target.value))} />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Financial Registry</h3>
          <select className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="all">All Streams</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No.</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student (Alphabetical)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-6 text-center text-[11px] font-black text-slate-300">{idx + 1}</td>
                  <td className="px-8 py-6 font-bold text-slate-800 text-sm uppercase">{s.last_name} {s.first_name}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <input type="number" className="w-32 bg-slate-50 border rounded-xl px-4 py-2 font-black text-sm text-indigo-600 outline-none" value={s.paid} onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setStudents(prev => prev.map(p => p.id === s.id ? { ...p, paid: val } : p));
                        }} />
                      <button onClick={() => updatePayment(s.id, s.paid)} disabled={savingId === s.id} className="text-indigo-600">
                        {savingId === s.id ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase ${s.paid >= totalTermFee ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {s.paid >= totalTermFee ? 'Cleared' : `Debt: ${(totalTermFee - s.paid).toLocaleString()} RWF`}
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
