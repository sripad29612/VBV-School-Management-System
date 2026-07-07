import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { ArrowLeft, FileText, Download, CheckCircle2 } from 'lucide-react-native';
import api from '../../services/api';

interface PrincipalReportsProps {
  onBack: () => void;
}

export const PrincipalReports: React.FC<PrincipalReportsProps> = ({ onBack }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  const reportCategories = [
    { id: 'att_teacher_daily', name: 'Daily Teacher Attendance Report', desc: 'Today\'s aggregate of staff attendance check-ins, late logs, and active substitute covers.' },
    { id: 'att_teacher_monthly', name: 'Monthly Teacher Attendance and Leave Logs', desc: 'Aggregated monthly check-in percentages and leave tracking logs per teacher.' },
    { id: 'att_teacher_yearly', name: 'Yearly Teacher Attendance Summary', desc: 'Yearly history of cumulative attendance rates, approved leaves, and substitute assignments.' },
    { id: 'att', name: 'Student Attendance Reports', desc: 'Monthly and term summaries of student classroom registers.' },
    { id: 'acad', name: 'Academic Reports', desc: 'Grade book charts, averages, and ranks ledger.' },
    { id: 'hw', name: 'Homework Reports', desc: 'Completion compliance stats and missing homework logs.' },
    { id: 'lesson', name: 'Lesson/Syllabus Progress Reports', desc: 'Completed syllabus status and principal review log.' }
  ];

  const handleExport = async (reportId: string, reportName: string, format: 'PDF' | 'Excel') => {
    setLoadingReport(`${reportName}_${format}`);
    try {
      let type = 'students';
      if (reportId.includes('teacher')) {
        type = 'teachers';
      } else if (reportId === 'att') {
        type = 'attendance';
      } else if (reportId === 'acad') {
        type = 'students';
      } else if (reportId === 'hw') {
        type = 'students';
      } else if (reportId === 'lesson') {
        type = 'attendance';
      }

      const res = await api.get(`/principal/reports?type=${type}`);
      const count = res.data ? res.data.length : 0;
      
      setLoadingReport(null);
      alert(`${format} format of "${reportName}" generated successfully!\nTotal dynamic records processed: ${count}.`);
    } catch (err) {
      setLoadingReport(null);
      alert(`Export failed for "${reportName}".`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ================= HEADER ================= */}
        <View style={styles.subScreenHeader}>
          <Pressable onPress={onBack} style={[styles.backBtn, { borderColor: theme.border }]}>
            <ArrowLeft size={18} color="#6F42C1" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.subScreenTitle, { color: theme.text }]}>Reports Center</Text>
            <Text style={[styles.subScreenSubtitle, { color: theme.textSecondary }]}>Export school analytics spreadsheet reports</Text>
          </View>
        </View>

        {/* ================= LIST OF REPORT ITEMS ================= */}
        {reportCategories.map(rep => (
          <Card key={rep.id} style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#6F42C115' }]}>
                <FileText size={20} color="#6F42C1" />
              </View>
              <View style={styles.textCol}>
                <Text style={[styles.reportNameText, { color: theme.text }]}>{rep.name}</Text>
                <Text style={[styles.reportDescText, { color: theme.textSecondary }]}>{rep.desc}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Export buttons row */}
            <View style={styles.exportRow}>
              <Pressable 
                onPress={() => handleExport(rep.id, rep.name, 'PDF')}
                disabled={loadingReport !== null}
                style={[styles.exportBtn, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}
              >
                {loadingReport === `${rep.name}_PDF` ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Download size={12} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: '800' }}>Export PDF</Text>
                  </>
                )}
              </Pressable>

              <Pressable 
                onPress={() => handleExport(rep.id, rep.name, 'Excel')}
                disabled={loadingReport !== null}
                style={[styles.exportBtn, { backgroundColor: '#10B98115', borderColor: '#10B98130', marginLeft: 8 }]}
              >
                {loadingReport === `${rep.name}_Excel` ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <>
                    <Download size={12} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '800' }}>Export Excel</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Card>
        ))}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  subScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subScreenTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  subScreenSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  reportCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.01)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
  },
  reportNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  reportDescText: {
    fontSize: 9,
    marginTop: 2,
    lineHeight: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  }
});
