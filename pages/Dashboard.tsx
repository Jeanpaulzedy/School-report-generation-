
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Award, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  ClipboardCheck,
  CalendarDays,
  Activity,
  UserCheck,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
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

        // Attempt to get an average performance from marks
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
    { label: 'Total Enrollment', value: stats.students, icon: GraduationCap, color: 'bg-indigo-500' },
    { label: 'Staff Count', value: stats.staff, icon: Users, color: 'bg-purple-500' },
    { label: 'Active Streams', value: stats.classes, icon: BookOpen, color: 'bg-emerald-500' },
    { label: 'School Performance', value: stats.performance, icon: Award, color: 'bg-amber-500' },
  ];

  const teacherStatCards = [
    { label: 'My Subjects', value: '4', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Students Taught', value: '156', icon: UserCheck, color: 'bg-emerald-500' },
    { label: 'Marks Pending', value: '12', icon: ClipboardCheck, color: 'bg-rose-500' },
    { label: 'Avg Subject Score', value: stats.performance, icon: Activity, color: 'bg-indigo-500' },
  ];

  const activeStats = isAdmin ? adminStatCards : teacherStatCards;

  const classAverages = [
    { name: 'S1', avg: 72 }, { name: 'S2', avg: 68 }, { name: 'S3', avg: 81 },
    { name: 'S4', avg: 75 }, { name: 'S5', avg: 85 }, { name: 'S6', avg: 78 },
  ];

  const performanceData = [
    { term: 'Term 1', score: 65 }, { term: 'Term 2', score: 72 },
    { term: 'Term 3', score: 78 }, { term: 'Current', score: 82 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">
            Mwiriwe, {user.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isAdmin 
              ? "Overseeing school-wide operations and national standard compliance." 
              : "Ready to record today's assessments and track student progress."}
          </p>
        </div>
        <div className="flex gap-4 relative z-10">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Time</p>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5 justify-end mt-1">
              <Clock size={16} className="text-indigo-500" />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block"></div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-indigo-50 rounded-full opacity-50 z-0"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-default group border-b-4 border-b-transparent hover:border-b-indigo-500">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                <stat.icon size={26} />
              </div>
              <div className="flex items-center text-emerald-600 text-[10px] font-black bg-emerald-50 px-2.5 py-1 rounded-lg uppercase">
                <TrendingUp size={12} className="mr-1" />
                Active
              </div>
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
            {loading ? (
              <div className="h-10 w-24 bg-slate-50 animate-pulse rounded-lg mt-1"></div>
            ) : (
              <p className="text-4xl font-black text-slate-800 mt-1 tracking-tight">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Academic Performance</h3>
              <p className="text-slate-500 text-sm mt-1">Distribution across standard class levels.</p>
            </div>
            <button className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 px-5 py-2.5 rounded-2xl transition-all border border-indigo-100 flex items-center gap-2">
              Deep Analytics <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAverages}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} dx={-10} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px'}}
                />
                <Bar dataKey="avg" fill="#4f46e5" radius={[12, 12, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30 overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                  <CalendarDays size={24} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Academic Notice</h3>
              </div>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-6">
                Term 1 National Exams start in <span className="text-white font-black underline">14 days</span>. Ensure all marks are synchronized with NESA portal by Friday.
              </p>
              <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all shadow-xl shadow-black/10">
                View Schedule
              </button>
            </div>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full"></div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-800 uppercase tracking-tight mb-6">Recent Activity</h4>
            <div className="space-y-6">
              {[
                { label: 'Mark Entry', desc: 'S4 Physics CAT recorded', time: '2m ago', color: 'bg-emerald-500' },
                { label: 'New Enrollment', desc: 'S1 student added', time: '45m ago', color: 'bg-blue-500' },
                { label: 'Report Print', desc: 'Batch PDF generated', time: '2h ago', color: 'bg-indigo-500' }
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-1.5 h-10 rounded-full ${activity.color} shrink-0`}></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.time}</p>
                    <p className="text-sm font-bold text-slate-800">{activity.label}</p>
                    <p className="text-xs text-slate-500 font-medium">{activity.desc}</p>
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
