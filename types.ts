
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  email?: string;
}

export interface SchoolSettings {
  id: string;
  school_name: string;
  academic_year: string;
  current_term: string;
  logo_url?: string;
  address?: string;
}

export interface Class {
  id: string;
  name: string;
  stream: string;
}

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  gender: 'M' | 'F';
  dob: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
  max_marks: number;
}

export interface ExamType {
  id: string;
  name: string;
}

/* Mark interface representing a student's score in a specific subject and exam */
export interface Mark {
  id: string;
  student_id: string;
  subject_id: string;
  exam_type_id: string;
  score: number;
  term: string;
  academic_year: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
