import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { colors } from '../theme/colors';

// Custom SVG Progress Ring Component
export const ProgressRing: React.FC<{ percentage: number; size?: number; strokeWidth?: number; color?: string }> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = colors.primary
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      {/* Fallback layout using standard HTML SVG for web compatibility */}
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDarkMode ? '#334155' : '#E2E8F0'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <View style={styles.ringLabelContainer}>
        <Text style={[styles.ringText, { color: theme.text }]}>{percentage.toFixed(0)}%</Text>
        <Text style={[styles.ringSub, { color: theme.textSecondary }]}>Attendance</Text>
      </View>
    </View>
  );
};

// Custom SVG Bar Chart Component
interface BarData {
  label: string;
  value: number;
}
export const BarChart: React.FC<{ data: BarData[]; height?: number; color?: string }> = ({
  data,
  height = 180,
  color = colors.primary
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.chartContainer}>
      <View style={[styles.barRow, { height }]}>
        {data.map((item, idx) => {
          const barHeightPct = (item.value / maxVal) * 100;
          return (
            <View key={idx} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barValue, { height: `${barHeightPct}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.barValText, { color: theme.textSecondary }]}>{item.value}</Text>
              <Text style={[styles.barLabelText, { color: theme.text }]} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Custom SVG Donut/Pie Chart Component
export const PieChart: React.FC<{ collected: number; pending: number; size?: number }> = ({
  collected,
  pending,
  size = 140
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const total = collected + pending;
  const colPct = total > 0 ? (collected / total) * 100 : 70;
  const pendPct = 100 - colPct;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  // Dash offsets
  const strokeDashoffsetCol = 0;
  const strokeDashoffsetPend = circumference - (colPct / 100) * circumference;

  return (
    <View style={styles.pieWrapper}>
      <View style={[styles.pieContainer, { width: size, height: size }]}>
        <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Collected Segment */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={colors.primary}
            strokeWidth="15"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffsetCol}
          />
          {/* Pending Segment */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={colors.secondary}
            strokeWidth="15"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffsetPend}
          />
        </svg>
      </View>
      
      {/* Legends */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: theme.text }]}>
            Collected: {colPct.toFixed(0)}% (Rs. {collected.toLocaleString()})
          </Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.legendText, { color: theme.text }]}>
            Pending: {pendPct.toFixed(0)}% (Rs. {pending.toLocaleString()})
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  ringLabelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringText: {
    fontSize: 22,
    fontWeight: '800',
  },
  ringSub: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  chartContainer: {
    width: '100%',
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 3,
  },
  barTrack: {
    width: 14,
    height: '75%',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barValue: {
    width: '100%',
    borderRadius: 8,
  },
  barValText: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 4,
  },
  barLabelText: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    maxWidth: 35,
    textAlign: 'center',
  },
  pieWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 12,
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
