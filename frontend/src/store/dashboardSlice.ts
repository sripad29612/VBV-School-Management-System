import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DashboardState {
  studentData: {
    dashboard: any | null;
    timetable: any[];
    homework: any[];
    studyMaterials: any[];
    results: any[];
    attendance: any[];
    fees: any | null;
    digitalId: any | null;
  };
  parentData: {
    dashboard: any | null;
    selectedChildId: string | null;
    snapshots: { enabled: boolean; latestImage: string; timeline: any[] } | null;
    attendance: any[];
    homework: any[];
    results: any[];
    fees: any | null;
  };
  teacherData: {
    dashboard: any | null;
    classStudents: any[];
    reports: any[];
    timetable: any[];
  };
  principalData: {
    dashboard: any | null;
    students: any[];
    teachers: any[];
    classes: any[];
    snapshotsMonitor: any[];
  };
  chat: {
    contacts: any[];
    messages: any[];
    loading: boolean;
  };
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  studentData: {
    dashboard: null,
    timetable: [],
    homework: [],
    studyMaterials: [],
    results: [],
    attendance: [],
    fees: null,
    digitalId: null,
  },
  parentData: {
    dashboard: null,
    selectedChildId: null,
    snapshots: null,
    attendance: [],
    homework: [],
    results: [],
    fees: null,
  },
  teacherData: {
    dashboard: null,
    classStudents: [],
    reports: [],
    timetable: [],
  },
  principalData: {
    dashboard: null,
    students: [],
    teachers: [],
    classes: [],
    snapshotsMonitor: [],
  },
  chat: {
    contacts: [],
    messages: [],
    loading: false,
  },
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDataRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    setDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // Student Actions
    setStudentDashboard: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.studentData.dashboard = action.payload;
    },
    setStudentTimetable: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.studentData.timetable = action.payload;
    },
    setStudentHomework: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.studentData.homework = action.payload;
    },
    setStudentStudyMaterials: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.studentData.studyMaterials = action.payload;
    },
    setStudentResults: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.studentData.results = action.payload;
    },
    setStudentAttendance: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.studentData.attendance = action.payload;
    },
    setStudentFees: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.studentData.fees = action.payload;
    },
    setStudentDigitalId: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.studentData.digitalId = action.payload;
    },
    
    // Parent Actions
    setParentDashboard: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.parentData.dashboard = action.payload;
      if (action.payload.children && action.payload.children.length > 0 && !state.parentData.selectedChildId) {
        state.parentData.selectedChildId = action.payload.children[0]._id;
      }
    },
    setSelectedChildId: (state, action: PayloadAction<string>) => {
      state.parentData.selectedChildId = action.payload;
      state.parentData.snapshots = null;
      state.parentData.attendance = [];
      state.parentData.homework = [];
      state.parentData.results = [];
      state.parentData.fees = null;
    },
    setChildSnapshots: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.parentData.snapshots = action.payload;
    },
    setChildAttendance: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.parentData.attendance = action.payload;
    },
    setChildHomework: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.parentData.homework = action.payload;
    },
    setChildResults: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.parentData.results = action.payload;
    },
    setChildFees: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.parentData.fees = action.payload;
    },

    // Teacher Actions
    setTeacherDashboard: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.teacherData.dashboard = action.payload;
    },
    setTeacherClassStudents: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.teacherData.classStudents = action.payload;
    },
    setTeacherReports: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.teacherData.reports = action.payload;
    },

    // Principal Actions
    setPrincipalDashboard: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.principalData.dashboard = action.payload;
    },
    setPrincipalSnapshotsMonitor: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.principalData.snapshotsMonitor = action.payload;
    },
    setPrincipalStudents: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.principalData.students = action.payload;
    },
    setPrincipalTeachers: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.principalData.teachers = action.payload;
    },
    setPrincipalClasses: (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.principalData.classes = action.payload;
    },

    // Chat Actions
    setChatLoading: (state, action: PayloadAction<boolean>) => {
      state.chat.loading = action.payload;
    },
    setChatContacts: (state, action: PayloadAction<any[]>) => {
      state.chat.contacts = action.payload;
    },
    setChatMessages: (state, action: PayloadAction<any[]>) => {
      state.chat.messages = action.payload;
    },
    addChatMessage: (state, action: PayloadAction<any>) => {
      state.chat.messages.push(action.payload);
    }
  },
});

export const {
  setDataRequest,
  setDataFailure,
  setStudentDashboard,
  setStudentTimetable,
  setStudentHomework,
  setStudentStudyMaterials,
  setStudentResults,
  setStudentAttendance,
  setStudentFees,
  setStudentDigitalId,
  setParentDashboard,
  setSelectedChildId,
  setChildSnapshots,
  setChildAttendance,
  setChildHomework,
  setChildResults,
  setChildFees,
  setTeacherDashboard,
  setTeacherClassStudents,
  setTeacherReports,
  setPrincipalDashboard,
  setPrincipalSnapshotsMonitor,
  setPrincipalStudents,
  setPrincipalTeachers,
  setPrincipalClasses,
  setChatLoading,
  setChatContacts,
  setChatMessages,
  addChatMessage
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
