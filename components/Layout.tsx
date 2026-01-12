
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  GraduationCap, 
  ClipboardList,
  Layers,
  FileText,
  Sparkles,
  CalendarCheck,
  Wallet,
  Bell
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'students', label: 'Students', icon: GraduationCap, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'marks', label: 'Marks Entry', icon: ClipboardList, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'finance', label: 'Finance', icon: Wallet, roles: [UserRole.ADMIN] },
    { id: 'reports', label: 'Report Cards', icon: FileText, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'ai-assistant', label: 'AI Helper', icon: Sparkles, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'classes', label: 'Classes', icon: Layers, roles: [UserRole.ADMIN] },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, roles: [UserRole.ADMIN] },
    { id: 'exam-types', label: 'Exams', icon: FileSpreadsheet, roles: [UserRole.ADMIN] },
    { id: 'users', label: 'Staff Management', icon: Users, roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <GraduationCap size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800">SchoolAMIS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                currentPage === item.id 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} className={currentPage === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.full_name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {currentPage.replace('-', ' ')}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span>ESP RULI Academic Portal</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-indigo-600">Active Session</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all border border-slate-100">
              <Bell size={18} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-lg text-xs font-semibold border border-emerald-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Term 1 • 2024/25
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1440px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
