import React from 'react';
import { View, ViewStyle } from 'react-native';

interface StudentIllustrationProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export const StudentIllustration: React.FC<StudentIllustrationProps> = ({
  width = 240,
  height = 130,
  style
}) => {
  return (
    <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
      <svg width={width} height={height} viewBox="0 0 240 130" fill="none">
        {/* Soft Background Circle Glow */}
        <circle cx="120" cy="65" r="55" fill="#E0F2FE" />
        <circle cx="70" cy="70" r="45" fill="#FFF3E0" />
        <circle cx="170" cy="70" r="45" fill="#FFF3E0" />

        {/* --- LEFT STUDENT (Girl in Orange/Yellow Accent) --- */}
        <g id="left-student">
          {/* Backpack straps */}
          <path d="M 60,75 C 55,75 52,90 55,100 C 58,100 62,85 60,75 Z" fill="#F57C00" />
          <path d="M 80,75 C 85,75 88,90 85,100 C 82,100 78,85 80,75 Z" fill="#F57C00" />
          {/* Body / Uniform */}
          <path d="M 52,95 L 88,95 L 82,130 L 58,130 Z" fill="#F57C00" />
          {/* Collar */}
          <path d="M 62,95 L 70,102 L 78,95" fill="#FFFFFF" stroke="#E65100" strokeWidth="1" />
          <circle cx="70" cy="99" r="1.5" fill="#0B5ED7" />
          {/* Neck */}
          <rect x="67" y="88" width="6" height="8" fill="#FDBA74" />
          {/* Face */}
          <circle cx="70" cy="74" r="15" fill="#FDBA74" />
          {/* Hair (Girl - Bob cut) */}
          <path d="M 52,72 C 52,58 88,58 88,72 C 88,76 84,72 82,74 C 80,76 80,68 76,70 C 72,72 70,68 66,70 C 62,72 60,76 58,74 Z" fill="#1E293B" />
          <path d="M 52,72 L 53,82 C 55,84 57,84 57,82 Z" fill="#1E293B" />
          <path d="M 88,72 L 87,82 C 85,84 83,84 83,82 Z" fill="#1E293B" />
          {/* Eyes */}
          <circle cx="65" cy="74" r="1.5" fill="#1E293B" />
          <circle cx="75" cy="74" r="1.5" fill="#1E293B" />
          {/* Smile */}
          <path d="M 68,80 Q 70,82 72,80" stroke="#1E293B" strokeWidth="1" fill="none" />
        </g>

        {/* --- RIGHT STUDENT (Girl in Blue Uniform) --- */}
        <g id="right-student">
          {/* Backpack straps */}
          <path d="M 160,75 C 155,75 152,90 155,100 C 158,100 162,85 160,75 Z" fill="#0B5ED7" />
          <path d="M 180,75 C 185,75 188,90 185,100 C 182,100 178,85 180,75 Z" fill="#0B5ED7" />
          {/* Body / Uniform */}
          <path d="M 152,95 L 188,95 L 182,130 L 158,130 Z" fill="#0B5ED7" />
          {/* Collar */}
          <path d="M 162,95 L 170,102 L 178,95" fill="#FFFFFF" stroke="#0A58CA" strokeWidth="1" />
          <circle cx="170" cy="99" r="1.5" fill="#F57C00" />
          {/* Neck */}
          <rect x="167" y="88" width="6" height="8" fill="#FDBA74" />
          {/* Face */}
          <circle cx="170" cy="74" r="15" fill="#FDBA74" />
          {/* Hair (Ponytail) */}
          <path d="M 152,72 C 152,58 188,58 188,72 C 188,76 182,72 180,74 C 178,76 176,68 170,70 C 164,68 162,76 160,74 Z" fill="#1E293B" />
          <path d="M 186,72 C 192,72 195,80 193,85 C 191,85 189,80 187,77 Z" fill="#1E293B" stroke="#F57C00" strokeWidth="1" />
          {/* Eyes */}
          <circle cx="165" cy="74" r="1.5" fill="#1E293B" />
          <circle cx="175" cy="74" r="1.5" fill="#1E293B" />
          {/* Smile */}
          <path d="M 168,80 Q 170,82 172,80" stroke="#1E293B" strokeWidth="1" fill="none" />
        </g>

        {/* --- CENTER STUDENT (Boy in Blue/Orange Trim) --- */}
        <g id="center-student">
          {/* Backpack Straps */}
          <path d="M 108,68 C 102,68 98,82 102,96 C 105,96 110,82 108,68 Z" fill="#0B5ED7" />
          <path d="M 132,68 C 138,68 142,82 138,96 C 135,96 130,82 132,68 Z" fill="#0B5ED7" />
          {/* Body / Uniform */}
          <path d="M 98,88 L 142,88 L 136,130 L 104,130 Z" fill="#0B5ED7" />
          <path d="M 112,88 L 120,98 L 128,88" fill="#FFFFFF" stroke="#0A58CA" strokeWidth="1.5" />
          <line x1="120" y1="98" x2="120" y2="125" stroke="#FFFFFF" strokeWidth="2.5" />
          {/* Neck */}
          <rect x="117" y="80" width="6" height="9" fill="#FFD8A8" />
          {/* Face */}
          <circle cx="120" cy="65" r="17" fill="#FFD8A8" />
          {/* Short Boy Hair */}
          <path d="M 101,62 C 101,45 139,45 139,62 C 135,58 133,60 130,57 C 127,55 125,58 120,56 C 115,58 113,55 110,57 C 107,60 105,58 101,62 Z" fill="#1E293B" />
          {/* Eyes */}
          <circle cx="114" cy="64" r="1.5" fill="#1E293B" />
          <circle cx="126" cy="64" r="1.5" fill="#1E293B" />
          {/* Smile */}
          <path d="M 117,72 Q 120,75 123,72" stroke="#1E293B" strokeWidth="1.5" fill="none" />
        </g>
      </svg>
    </View>
  );
};
