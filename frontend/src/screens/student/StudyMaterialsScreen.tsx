import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { colors } from '../../theme/colors';
import { Search, ArrowLeft, Layers, FileText, Download, Video, BookOpen, FileCheck } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';

interface StudyMaterialsScreenProps {
  onBack: () => void;
}

export const StudyMaterialsScreen: React.FC<StudyMaterialsScreenProps> = ({ onBack }) => {
  const { studentData } = useSelector((state: RootState) => state.dashboard);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Notes' | 'PDF' | 'Worksheet' | 'Practice' | 'Video'>('All');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const rawMaterials = studentData.studyMaterials || [];

  // Map / expand raw materials to fit category tags and metadata
  const processedMaterials = rawMaterials.map((mat: any, idx: number) => {
    // Determine category based on file type or naming
    let category: 'Notes' | 'PDF' | 'Worksheet' | 'Practice' | 'Video' = 'PDF';
    const titleLower = mat.title.toLowerCase();
    
    if (titleLower.includes('video') || titleLower.includes('lecture')) category = 'Video';
    else if (titleLower.includes('worksheet') || titleLower.includes('hw')) category = 'Worksheet';
    else if (titleLower.includes('practice') || titleLower.includes('test')) category = 'Practice';
    else if (titleLower.includes('notes') || titleLower.includes('chapter')) category = 'Notes';

    const teacherName = mat.uploadedBy?.name || mat.uploadedBy?.username || 'Teacher';
    const fileSize = mat.fileSize || '1.8 MB';

    // Subject color details
    const subjectColors: { [key: string]: string } = {
      'Mathematics': '#2563EB',
      'Science': '#10B981',
      'English': '#F97316',
      'Social Studies': '#8B5CF6',
      'Telugu': '#F43F5E',
      'Computer': '#06B6D4'
    };
    const subjectColor = subjectColors[mat.subject?.name] || colors.primary;

    return {
      ...mat,
      category,
      teacherName,
      fileSize,
      subjectColor
    };
  });

  const finalMaterials = processedMaterials;

  // Filter items
  const filteredMaterials = finalMaterials.filter(mat => {
    const matchesSearch = mat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (mat.subject?.name && mat.subject.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'All' || mat.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Video': return Video;
      case 'Worksheet': return FileCheck;
      case 'Practice': return BookOpen;
      case 'Notes': return FileText;
      default: return FileText;
    }
  };

  const handleDownload = (title: string) => {
    alert(`Downloading "${title}"... Please monitor progress in task notifications.`);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ArrowLeft size={18} color={colors.primary} />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Study Materials</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Notes, worksheets & lectures</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Layers size={20} color={colors.primary} />
        </View>
      </View>

      {/* ================= SEARCH BAR ================= */}
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }]}>
        <Search size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search materials, subjects..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ================= CATEGORY CHIPS ================= */}
      <View style={styles.chipsOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {(['All', 'Notes', 'PDF', 'Worksheet', 'Practice', 'Video'] as const).map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryPill,
                { backgroundColor: theme.surface, borderColor: theme.border },
                activeCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
            >
              <Text style={[
                styles.categoryText,
                { color: theme.textSecondary },
                activeCategory === cat && { color: '#FFFFFF' }
              ]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ================= MATERIALS LIST ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((mat) => {
            const IconComponent = getCategoryIcon(mat.category);
            return (
              <View 
                key={mat._id} 
                style={[
                  styles.materialCard, 
                  { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.cardShadow }
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: mat.subjectColor + '10' }]}>
                  <IconComponent size={22} color={mat.subjectColor} />
                </View>

                <View style={styles.cardInfo}>
                  <Text style={[styles.subjectTag, { color: mat.subjectColor }]}>
                    {mat.subject?.name || 'Subject'}
                  </Text>
                  <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>
                    {mat.title}
                  </Text>
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {mat.teacherName} · {mat.fileSize}
                  </Text>
                </View>

                <Pressable 
                  onPress={() => handleDownload(mat.title)}
                  style={[styles.downloadBtn, { backgroundColor: mat.subjectColor }]}
                >
                  <Download size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            );
          })
        ) : (
          <EmptyState
            title="Study Materials"
            message="No study materials uploaded."
            iconName="Layers"
          />
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 48,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    height: '100%',
    outlineStyle: 'none' as any,
  },
  chipsOuter: {
    marginBottom: 18,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  subjectTag: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
