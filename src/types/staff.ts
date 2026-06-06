export type StaffRiskStudentRecord = {
  student_id: string;
  student_name: string;
  nis: string;
  class_name: string;
  occurrences: number;
};

export type StaffAttendanceSummary = {
  present: number;
  late: number;
  permission: number;
  sick: number;
  alpha: number;
  repeated_late: StaffRiskStudentRecord[];
  repeated_alpha: StaffRiskStudentRecord[];
};

export type StaffHomeroomContext = {
  assignment_id: string;
  teacher_id: string;
  class_id: string;
  class_name: string;
  school_year_id: string;
  school_year_name: string;
  is_active: boolean;
};

export type StaffSubmission = {
  id: string;
  student_id: string;
  student_name: string;
  nis: string;
  class_id?: string;
  class_name?: string;
  type: string;
  reason: string;
  attachment?: string;
  status: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  review_note?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type StaffSubmissionCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  with_attachment: number;
};

export type StaffHomeroomDashboard = {
  homeroom: StaffHomeroomContext;
  total_students: number;
  today: StaffAttendanceSummary;
  students_needing_attention: StaffRiskStudentRecord[];
  recent_submissions: StaffSubmission[];
};

export type StaffStudentSummary = {
  id: string;
  user_id: string;
  name: string;
  nis: string;
  nisn?: string;
  gender?: string;
  phone?: string;
  class_id?: string;
  class_name?: string;
  school_year_id?: string;
  school_year_name?: string;
  membership_id?: string;
  membership_status?: string;
  entry_year: number;
  is_active: boolean;
  present_count: number;
  late_count: number;
  permission_count: number;
  sick_count: number;
  alpha_count: number;
};

export type StaffAttendanceRecord = {
  id: string;
  student_id: string;
  student_name: string;
  nis: string;
  class_id: string;
  class_name: string;
  school_year_id: string;
  school_year_name: string;
  attendance_date: string;
  check_in_at?: string;
  status: string;
  photo_url?: string;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  verification_note?: string;
};

export type StaffHomeroomAttendanceOverview = {
  homeroom: StaffHomeroomContext;
  date: string;
  status_filter?: string;
  query?: string;
  summary: StaffAttendanceSummary;
  records: StaffAttendanceRecord[];
};

export type StaffAttendanceReviewPayload = {
  status: string;
  verification_note: string;
};

export type StaffHomeroomStudentDetail = {
  student: StaffStudentSummary;
  attendance_summary: StaffAttendanceSummary;
  recent_attendance: StaffAttendanceRecord[];
  recent_submissions: StaffSubmission[];
};

export type StaffHomeroomSubmissionOverview = {
  homeroom: StaffHomeroomContext;
  status_filter?: string;
  type_filter?: string;
  query?: string;
  counts: StaffSubmissionCounts;
  records: StaffSubmission[];
};

export type StaffBKClassSummary = {
  class_id: string;
  class_name: string;
  school_year_id?: string;
  school_year_name?: string;
};

export type StaffStudentOverviewCounts = {
  total: number;
  active: number;
  need_attention: number;
  total_late: number;
  total_alpha: number;
  with_counseling_notes: number;
};

export type StaffCounselingNote = {
  id: string;
  student_id: string;
  student_name: string;
  nis: string;
  class_id?: string;
  class_name?: string;
  created_by: string;
  created_by_name?: string;
  title: string;
  note: string;
  created_at?: string;
  updated_at?: string;
};

export type StaffCounselingOverviewCount = {
  total_notes: number;
  students_covered: number;
  classes_covered: number;
  recent_week_notes: number;
};

export type StaffBKDashboard = {
  total_students: number;
  students_need_attention: number;
  total_counseling_notes: number;
  pending_submissions: number;
  today: StaffAttendanceSummary;
  top_risk_students: StaffRiskStudentRecord[];
  recent_submissions: StaffSubmission[];
  recent_counseling_notes: StaffCounselingNote[];
  classes: StaffBKClassSummary[];
};

export type StaffBKStudentsOverview = {
  class_filter?: string;
  risk_filter?: string;
  query?: string;
  counts: StaffStudentOverviewCounts;
  students: StaffStudentSummary[];
  classes: StaffBKClassSummary[];
};

export type StaffBKStudentDetail = {
  student: StaffStudentSummary;
  attendance_summary: StaffAttendanceSummary;
  recent_attendance: StaffAttendanceRecord[];
  recent_submissions: StaffSubmission[];
  counseling_notes: StaffCounselingNote[];
};

export type StaffBKAttendanceOverview = {
  date: string;
  status_filter?: string;
  class_filter?: string;
  query?: string;
  summary: StaffAttendanceSummary;
  records: StaffAttendanceRecord[];
  classes: StaffBKClassSummary[];
};

export type StaffBKCounselingOverview = {
  class_filter?: string;
  student_id?: string;
  query?: string;
  counts: StaffCounselingOverviewCount;
  records: StaffCounselingNote[];
  classes: StaffBKClassSummary[];
  students: StaffStudentSummary[];
};

export type StaffBKSubmissionOverview = {
  status_filter?: string;
  type_filter?: string;
  class_filter?: string;
  query?: string;
  counts: StaffSubmissionCounts;
  records: StaffSubmission[];
  classes: StaffBKClassSummary[];
};
