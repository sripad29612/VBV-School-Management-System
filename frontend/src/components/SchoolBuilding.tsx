import React from 'react';
import { View, ViewStyle } from 'react-native';

interface SchoolBuildingProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export const SchoolBuilding: React.FC<SchoolBuildingProps> = ({
  width = 280,
  height = 120,
  style
}) => {
  return (
    <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
      <svg width={width} height={height} viewBox="0 0 300 130" fill="none">
        {/* Sky Background Soft Shadow/Glow */}
        <circle cx="150" cy="90" r="80" fill="#F8FAFC" fillOpacity="0.8" />
        
        {/* Base Foundation (Grey Steps) */}
        <rect x="20" y="115" width="260" height="8" rx="2" fill="#94A3B8" />
        <rect x="25" y="110" width="250" height="6" rx="1" fill="#cbd5e1" />
        
        {/* Main Building Body (Beige/Yellowish Sand color) */}
        <rect x="40" y="55" width="220" height="56" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="80" y="40" width="140" height="16" fill="#cbd5e1" stroke="#94A3B8" strokeWidth="1.5" />
        
        {/* Columns Facade (Primary Blue Highlights) */}
        <rect x="90" y="55" width="8" height="56" fill="#0B5ED7" />
        <rect x="130" y="55" width="8" height="56" fill="#0B5ED7" />
        <rect x="162" y="55" width="8" height="56" fill="#0B5ED7" />
        <rect x="202" y="55" width="8" height="56" fill="#0B5ED7" />
        
        {/* Central Entrance Pediment (Triangular Blue Roof) */}
        <polygon points="75,40 150,15 225,40" fill="#0B5ED7" stroke="#023E8A" strokeWidth="1.5" />
        
        {/* Clock Tower (Orange Circle) */}
        <circle cx="150" cy="30" r="8" fill="#FFFFFF" stroke="#F57C00" strokeWidth="1.5" />
        <line x1="150" y1="30" x2="150" y2="26" stroke="#334155" strokeWidth="1" />
        <line x1="150" y1="30" x2="154" y2="30" stroke="#334155" strokeWidth="1" />
        
        {/* Side Roof Ribbons (Orange Slate) */}
        <polygon points="35,55 80,45 80,55" fill="#F57C00" />
        <polygon points="265,55 220,45 220,55" fill="#F57C00" />
        
        {/* Windows Grid (White window panes, detailed lines) */}
        <rect x="50" y="65" width="16" height="16" rx="1" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />
        <line x1="58" y1="65" x2="58" y2="81" stroke="#475569" strokeWidth="0.5" />
        <line x1="50" y1="73" x2="66" y2="73" stroke="#475569" strokeWidth="0.5" />
        
        <rect x="50" y="88" width="16" height="16" rx="1" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />
        <line x1="58" y1="88" x2="58" y2="104" stroke="#475569" strokeWidth="0.5" />
        <line x1="50" y1="96" x2="66" y2="96" stroke="#475569" strokeWidth="0.5" />

        <rect x="234" y="65" width="16" height="16" rx="1" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />
        <line x1="242" y1="65" x2="242" y2="81" stroke="#475569" strokeWidth="0.5" />
        <line x1="234" y1="73" x2="250" y2="73" stroke="#475569" strokeWidth="0.5" />
        
        <rect x="234" y="88" width="16" height="16" rx="1" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />
        <line x1="242" y1="88" x2="242" y2="104" stroke="#475569" strokeWidth="0.5" />
        <line x1="234" y1="96" x2="250" y2="96" stroke="#475569" strokeWidth="0.5" />

        {/* Central Entrance Double Door (Wood Orange Panels) */}
        <rect x="140" y="80" width="20" height="31" fill="#F57C00" stroke="#B25300" strokeWidth="1" />
        <line x1="150" y1="80" x2="150" y2="111" stroke="#B25300" strokeWidth="1" />
        <circle cx="147" cy="96" r="1.5" fill="#FFC107" />
        <circle cx="153" cy="96" r="1.5" fill="#FFC107" />
        
        {/* Welcome Text ribbon banner on top of door */}
        <rect x="110" y="47" width="80" height="6" rx="1" fill="#FFFFFF" stroke="#475569" strokeWidth="0.5" />
        <line x1="115" y1="50" x2="185" y2="50" stroke="#475569" strokeWidth="0.5" strokeDasharray="2, 2" />
      </svg>
    </View>
  );
};
