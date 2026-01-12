import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/StudentsPage';
import { MarksEntryPage } from './pages/MarksEntryPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { ClassesPage } from './pages/ClassesPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { ExamTypesPage } from './pages/ExamTypesPage';
import { ReportCardsPage } from './pages/ReportCardsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AttendancePage } from './pages/AttendancePage';
import { FinancePage } from './pages/FinancePage';
import { AuthState, User, UserRole } from './types';
import { supabase } from './supabaseClient';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [schemaError, setSchemaError] = useState<boolean>(false);
  
  const ADMIN_EMAIL = 'jeanpaulnsengimana18@gmail.com';

  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          const email = session.user.email || '';
          const isSystemAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          
          let userData: User = {
            id: session.user.id,
            username: email.split('@')[0],
            full_name: isSystemAdmin ? 'Jean Paul (Admin)' : 'Staff Member',
            role: isSystemAdmin ? UserRole.ADMIN : UserRole.TEACHER,
            email: email
          };
          
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              userData = {
                ...userData,
                ...profile,
                role: isSystemAdmin ? UserRole.ADMIN : (profile.role as UserRole || UserRole.TEACHER)
              };
            }
          } catch (profileErr) {
            console.warn("DB Profile unavailable");
          }

          setAuth({ user: userData, isAuthenticated: true, loading: false });
        } else {
          setAuth({ user: null, isAuthenticated: false, loading: false });
        }
      } catch (err: any) {
        if (err.code === '42P01') setSchemaError(true);
        setAuth({ user: null, isAuthenticated: false, loading: false });
      }
    };

    checkInitialSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuth({ user: null, isAuthenticated: false, loading: false });
  };

  if (schemaError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
        <div className="bg-rose-500 p-4 rounded-3xl shadow-2xl mb-8">
          <AlertTriangle size={48} className="text-white" />
        </div>
        <h1 className="text-white text-3xl font-black uppercase tracking-tighter mb-4">Migration Required</h1>
        <p className="text-slate-400 max-w-md font-medium">Please initialize your database schema in Supabase.</p>
        <button onClick={() => window.location.reload()} className="mt-10 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs">Retry</button>
      </div>
    );
  }

  if (auth.loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Loading Portal...</p>
      </div>
    );
  }

  if (!auth.isAuthenticated || !auth.user) {
    return <LoginPage onLogin={(user) => setAuth({ user, isAuthenticated: true, loading: false })} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard user={auth.user!} />;
      case 'students': return <StudentsPage user={auth.user!} />;
      case 'marks': return <MarksEntryPage user={auth.user!} />;
      case 'attendance': return <AttendancePage user={auth.user!} />;
      case 'finance': return <FinancePage />;
      case 'reports': return <ReportCardsPage user={auth.user!} />;
      case 'ai-assistant': return <AIAssistantPage user={auth.user!} />;
      case 'classes': return <ClassesPage />;
      case 'subjects': return <SubjectsPage />;
      case 'exam-types': return <ExamTypesPage />;
      case 'users': return <UsersPage />;
      case 'settings': return <SettingsPage user={auth.user!} />;
      default: return <Dashboard user={auth.user!} />;
    }
  };

  return (
    <Layout user={auth.user!} onLogout={handleLogout} currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;