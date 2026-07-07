import api from './api';

export interface DailyReport {
  _id: string;
  className: string;
  subject: string;
  date: string;
  chapter: string;
  topicCovered: string;
  learningObjectives: string;
  teachingMethod: string;
  activities: string;
  homeworkGiven: string;
  studentsPresent: number;
  completionStatus: 'Completed' | 'In Progress' | 'Delayed';
  notes?: string;
  teacherName: string;
  status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Rejected' | 'Returned';
  submissionTime?: string;
}

export const reportService = {
  fetchReports: async (): Promise<DailyReport[]> => {
    const res = await api.get('/daily-reports');
    return res.data;
  },

  createReport: async (report: Omit<DailyReport, '_id' | 'status' | 'submissionTime'> & { _id?: string }): Promise<DailyReport> => {
    const res = await api.post('/daily-reports', report);
    return res.data;
  },

  saveDraft: async (report: Omit<DailyReport, '_id' | 'status' | 'submissionTime'> & { _id?: string }): Promise<DailyReport> => {
    const res = await api.post('/daily-reports/draft', report);
    return res.data;
  },

  updateStatus: async (reportId: string, newStatus: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Rejected' | 'Returned', notes?: string): Promise<DailyReport> => {
    const res = await api.put(`/daily-reports/${reportId}/status`, { status: newStatus, notes });
    return res.data;
  }
};
