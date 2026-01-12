
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
  Sparkles
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
    { id: 'reports', label: 'Report Cards', icon: FileText, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'ai-assistant', label: 'AI Helper', icon: Sparkles, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'classes', label: 'Classes', icon: Layers, roles: [UserRole.ADMIN] },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, roles: [UserRole.ADMIN] },
    { id: 'exam-types', label: 'Exams', icon: FileSpreadsheet, roles: [UserRole.ADMIN] },
    { id: 'users', label: 'Staff', icon: Users, roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="text-indigo-400" />
            <span>SchoolAMIS</span>
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">
            Academic Focus
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                currentPage === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center font-black shrink-0 text-white">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black uppercase truncate tracking-tight">{user.full_name}</p>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-900/20 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
            {currentPage.replace('-', ' ')}
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              2024/2025 - Term 1
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
