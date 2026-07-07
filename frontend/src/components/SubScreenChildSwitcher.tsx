import React from 'react';
import { ScrollView, Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface SubScreenChildSwitcherProps {
  children: any[];
  selectedChildId: string | null;
  onSelectChild: (id: string) => void;
  theme: any;
}

export const SubScreenChildSwitcher: React.FC<SubScreenChildSwitcherProps> = ({
  children,
  selectedChildId,
  onSelectChild,
  theme
}) => {
  if (!children || children.length <= 1) return null;

  return (
    <View style={[styles.switcherContainer, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
      <Text style={[styles.switcherLabel, { color: theme.textSecondary }]}>SWITCH CHILD:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
        {children.map((c: any) => {
          const isSelected = c._id === selectedChildId;
          return (
            <Pressable
              key={c._id}
              onPress={() => onSelectChild(c._id)}
              style={[
                styles.childPill,
                {
                  backgroundColor: isSelected ? colors.primary : theme.background,
                  borderColor: isSelected ? colors.primary : theme.border
                }
              ]}
            >
              <Text style={[styles.childName, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                {c.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  switcherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    gap: 8,
  },
  switcherLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollList: {
    gap: 6,
  },
  childPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childName: {
    fontSize: 9,
    fontWeight: '900',
  }
});
