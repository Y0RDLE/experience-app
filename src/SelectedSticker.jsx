import React from 'react';

const SelectedSticker = ({
  text = '선정!',
  width = 55,
  height = 40,
  // 기본값은 기존 색상 (주로 맛집형에 사용)
  startColor = '#F5D194',
  endColor = '#F49D85',
  position = 'left',
  variant = 'default', // variant prop: 'default' 또는 'leisure'
}) => {
  // 만약 variant가 'leisure'이면, 여가형 포인트 컬러로 그라데이션을 변경
  if (variant === 'leisure') {
    startColor = '#AEDFB4'; // 예시: accentGreen
    endColor = '#8CC7A0';   // 예시: 약간 더 어두운 green 계열
  }

  const centerY = Math.round(height / 2);

  const stickerStyle = {
    position: 'absolute',
    top: '0px',
    left: position === 'left' ? '0px' : undefined,
    right: position === 'right' ? '0px' : undefined,
    zIndex: 50,
    pointerEvents: 'none',
    overflow: 'visible',
  };

  return (
    <div style={stickerStyle}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
        shapeRendering="geometricPrecision"
      >
        <defs>
          <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
          <filter id="shapeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(0,0,0,0.1)" />
          </filter>
          <filter id="textShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="rgba(223,126,0,0.5)" />
          </filter>
          <filter id="sparkleShadow">
            <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodColor="rgba(223,126,0,0.5)" />
          </filter>
        </defs>

        {/* 리본 배경 */}
        <path
          d={`M0,0 H${width - 20} L${width},${centerY} L${width - 20},${height} H0 Z`}
          fill="url(#ribbonGradient)"
          filter="url(#shapeShadow)"
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />

        {/* 스파클 4방향 */}
        {[  
          { x: 5, y: 3, begin: '0.3s' },
          { x: 5, y: 32, begin: '0.5s' },
          { x: 40, y: 8, begin: '0.4s' },
          { x: 40, y: 32, begin: '0.6s' },
        ].map((s, i) => (
          <g key={i} transform={`translate(${s.x},${s.y})`}>
            <polygon
              points="5,0 6,4 10,4 7,6 8,10 5,8 2,10 3,6 0,4 4,4"
              fill="#FFFFFF"
              opacity="0"
              filter="url(#sparkleShadow)"
            >
              <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" begin={s.begin} />
              <animateTransform
                attributeName="transform"
                type="scale"
                values="0.7;1.1;0.7"
                dur="1.2s"
                repeatCount="indefinite"
                begin={s.begin}
                additive="sum"
              />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="1.2s"
                repeatCount="indefinite"
                begin={s.begin}
                additive="sum"
              />
            </polygon>
          </g>
        ))}

        {/* 텍스트 */}
        <text
          x={(width - 20) / 2 + 3}
          y={centerY}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="#FFFFFF"
          fontWeight="bold"
          fontSize="12"
          filter="url(#textShadow)"
        >
          {text}
        </text>
      </svg>
    </div>
  );
};

export default SelectedSticker;
