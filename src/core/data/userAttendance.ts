// =============================================================================
// PROJECT JULIE — OFFICIAL ATTENDANCE REGISTRY (UTTARANCHAL UNIVERSITY CYBORG-ERP)
// Official Attendance Record: From 08/07/2026 To 19/08/2026 (Overall: 60.34%)
// =============================================================================

export interface SubjectAttendanceData {
  subjectId: string;
  code: string;
  name: string;
  faculty: string;
  totalConducted: number;
  totalPresent: number;
  percentage: number;
}

export const OFFICIAL_ATTENDANCE_OVERALL = {
  startDate: '08/07/2026',
  endDate: '19/08/2026',
  totalLectures: 58,
  totalPresent: 35,
  percentage: 60.34,
};

export const OFFICIAL_SUBJECT_ATTENDANCE: SubjectAttendanceData[] = [
  {
    subjectId: 'sub-bba-201',
    code: 'BBA-201',
    name: 'Corporate and Business Law',
    faculty: 'Namita',
    totalConducted: 14,
    totalPresent: 11,
    percentage: 78.57,
  },
  {
    subjectId: 'sub-bba-202',
    code: 'BBA-202 (G1)',
    name: 'Management Accounting',
    faculty: 'Anupam Gupta',
    totalConducted: 3,
    totalPresent: 3,
    percentage: 100.0,
  },
  {
    subjectId: 'sub-bba-203',
    code: 'BBA-203-DM1',
    name: 'Fundamentals of Digital Marketing',
    faculty: 'Mohd Amir',
    totalConducted: 13,
    totalPresent: 4,
    percentage: 30.77,
  },
  {
    subjectId: 'sub-exc-199',
    code: 'EXC-199',
    name: 'Advanced MS-Excel',
    faculty: 'Sahil Gupta',
    totalConducted: 9,
    totalPresent: 5,
    percentage: 55.56,
  },
  {
    subjectId: 'sub-bba-204',
    code: 'BBA-204',
    name: 'Employability and Leadership Language-I',
    faculty: 'Aishwarya Shah',
    totalConducted: 6,
    totalPresent: 3,
    percentage: 50.0,
  },
  {
    subjectId: 'sub-bba-205',
    code: 'BBA-205',
    name: 'Office Management and Secretarial Practices',
    faculty: 'Swati Tiwari',
    totalConducted: 8,
    totalPresent: 4,
    percentage: 50.0,
  },
  {
    subjectId: 'sub-bba-206',
    code: 'BBA-206',
    name: 'Tour Package Operations and Management',
    faculty: 'Rishika Aggarwal',
    totalConducted: 5,
    totalPresent: 5,
    percentage: 100.0,
  },
];
