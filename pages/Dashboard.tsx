
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Award, 
  ArrowUpRight,
  Clock,
  ClipboardCheck,
  CalendarDays,
  Activity,
  UserCheck,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';

export const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: '0',
    staff: '0',
    classes: '0',
    performance: '0%'
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [studentsCount, staffCount, classesCount] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('classes').select('*', { count: 'exact', head: true })
        ]);

        const { data: marksData } = await supabase.from('marks').select('score');
        const avg = marksData && marksData.length > 0 
          ? (marksData.reduce((acc, m) => acc + m.score, 0) / marksData.length).toFixed(1) + '%'
          : 'N/A';

        setStats({
          students: (studentsCount.count || 0).toLocaleString(),
          staff: (staffCount.count || 0).toLocaleString(),
          classes: (classesCount.count || 0).toLocaleString(),
          performance: avg
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const adminStatCards = [
    { label: 'Total Enrollment', value: stats.students, icon: GraduationCap, color: 'bg-indigo-600', text: 'text-indigo-600' },
    { label: 'Staff Count', value: stats.staff, icon: Users, color: 'bg-indigo-600', text: 'text-indigo-600' },
    { label: 'Active Streams', value: stats.classes, icon: BookOpen, color: 'bg-indigo-600', text: 'text-indigo-600' },
    { label: 'School Performance', value: stats.performance, icon: Award, color: 'bg-indigo-600', text: 'text-indigo-600' },
  ];

  const teacherStatCards = [
    { label: 'My Subjects', value: '4', icon: BookOpen, color: 'bg-indigo-600', text: 'text-indigo-600' },
    { label: 'Students Taught', value: '156', icon: UserCheck, color: 'bg-indigo-600', text: 'text-indigo-600' },
    { label: 'Marks Pending', value: '12', icon: ClipboardCheck, color: 'bg-indigo-600', text: 'text-indigo-600' },
    { label: 'Avg Subject Score', value: stats.performance, icon: Activity, color: 'bg-indigo-600', text: 'text-indigo-600' },
  ];

  const activeStats = isAdmin ? adminStatCards : teacherStatCards;

  const classAverages = [
    { name: 'S1', avg: 72 }, { name: 'S2', avg: 68 }, { name: 'S3', avg: 81 },
    { name: 'S4', avg: 75 }, { name: 'S5', avg: 85 }, { name: 'S6', avg: 78 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.full_name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            {isAdmin 
              ? "Here's a summary of the school's current academic and operational standing." 
              : "Manage your class assessments and track student progress for Term 1."}
          </p>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Clock</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
          <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2">
            View Schedule <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-slate-50 ${stat.text}`}>
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                +2.4%
              </span>
            </div>
            <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Academic Overview</h3>
              <p className="text-slate-500 text-xs mt-0.5">Performance averages across active class streams.</p>
            </div>
            <button className="text-indigo-600 text-xs font-semibold flex items-center gap-1 hover:underline">
              Detailed reports <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAverages}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dx={-10} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Bar dataKey="avg" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-2xl text-white relative overflow-hidden">
            <h3 className="text-lg font-bold mb-2">School Bulletin</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              National exams are approaching. Please ensure all student marks for Term 1 are synchronized by Friday, Nov 15th.
            </p>
            <button className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all">
              Mark Requirements
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm mb-6">Real-time Feed</h4>
            <div className="space-y-5">
              {[
                { label: 'Marks Updated', desc: 'S4 Physics CAT entry', time: 'Just now', color: 'bg-indigo-500' },
                { label: 'New Student', desc: 'Enrollment: Mutoni A.', time: '2h ago', color: 'bg-emerald-500' },
                { label: 'Report Generated', desc: 'Batch PDF for S1B', time: '5h ago', color: 'bg-amber-500' }
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-1 h-8 rounded-full ${activity.color} shrink-0`}></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800">{activity.label}</p>
                      <span className="text-[10px] text-slate-400">• {activity.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{activity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
