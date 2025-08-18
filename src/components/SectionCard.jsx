// src/components/SectionCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import SelectedSticker from '../SelectedSticker';

export default function SectionCard({
  title,
  headerColor = '#F5D194',
  items = [],
  onItemClick
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const rowRefs = useRef({});

  useEffect(() => {
    items.forEach(exp => {
      if (!rowRefs.current[exp.id]) rowRefs.current[exp.id] = React.createRef();
    });
  }, [items]);

  // 개발용 디버그: 렌더 시 exp 구조 확인 (문제 해결 후 제거 가능)
  useEffect(() => {
    if (items && items.length) {
      // 첫 3개만 찍어두자
      console.log('SectionCard items sample:', items.slice(0, 3));
    }
  }, [items]);

  const renderTags = exp => {
    // support both new and legacy field names
    const isExtended = !!(exp.isExtended || exp.extension);
    return (
      <div className="flex ml-1 space-x-1 font-omni">
        {isExtended && (
          <span
            className="
              px-2 text-[10px] font-medium
              text-white whitespace-nowrap
              transform rotate-0
            "
            style={{
              background: 'repeating-linear-gradient(45deg, #4DA0FF, #4DA0FF 4px, #6EC1FF 4px, #6EC1FF 8px)',
              borderRadius: '8px 12px',
              boxShadow: '0 2px 3px rgba(100, 140, 180, 0.18)',
            }}
          >
            연장
          </span>
        )}
        {exp.isClip && (
          <span
            className="
              px-2 text-[10px] font-medium
              text-white whitespace-nowrap
              transform -rotate-2
            "
            style={{
              background: 'repeating-linear-gradient(45deg, #FF8C00, #FF8C00 4px, #FFA040 4px, #FFA040 8px)',
              borderRadius: '4px 12px 4px 12px',
              boxShadow: '0 2px 3px rgba(146, 141, 141, 0.2)',
            }}
          >
            클립
          </span>
        )}
        {exp.isFamily && (
          <span
            className="
              px-2 text-[10px] font-medium
              text-white whitespace-nowrap
              transform rotate-1
            "
            style={{
              background: 'repeating-linear-gradient(45deg, #6A5ACD, #6A5ACD 4px, #8470FF 4px, #8470FF 8px)',
              borderRadius: '12px 4px 12px 4px',
              boxShadow: '0 2px 3px rgba(150, 139, 139, 0.2)',
            }}
          >
            가족용
          </span>
        )}
        {exp.isPetFriendly && (
          <span
            className="
              px-2 text-[10px] font-medium
              text-white whitespace-nowrap
              transform -rotate-1
            "
            style={{
              background: 'repeating-linear-gradient(45deg, #FF69B4, #FF69B4 4px, #FF85C1 4px, #FF85C1 8px)',
              borderRadius: '4px 12px 4px 12px',
              boxShadow: '0 2px 3px rgba(153, 139, 139, 0.2)',
            }}
          >
            💗무쓰💗
          </span>
        )}
      </div>
    );
  };

  const renderHighlight = (date, fmt) => (
    <span
      className="font-bold text-transparent bg-clip-text animate-gradientText inline-block"
      style={{
        backgroundImage: 'linear-gradient(270deg, #FFC000, #FF5733, #FFC000)',
        backgroundSize: '200% 200%',
      }}
    >
      {format(date, fmt, { locale: ko })}
    </span>
  );

  const gridCols = 'minmax(220px, auto) repeat(5, 1fr)';

  return (
    <div style={{ minWidth: 960, fontSize: '90%', marginLeft: -8 }}>
      <div
        className="relative bg-white rounded shadow-lg border overflow-visible w-full"
        style={{ borderColor: headerColor, borderRadius: 20 }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[78px] rounded-t-[18px]"
          style={{ backgroundColor: headerColor, zIndex: 0 }}
        />
        <div className="relative z-10">
          <div
            className="px-5 py-3 flex justify-between items-center font-extrabold text-white"
            style={{
              backgroundColor: headerColor,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <h2 className="text-lg">{title}</h2>
            <span className="text-xs">총 {items.length}건</span>
          </div>
          <div
            className="grid px-5 py-2.5 gap-4 text-xs font-semibold text-white"
            style={{ backgroundColor: headerColor, gridTemplateColumns: gridCols }}
          >
            <div className="pl-3 text-left">업체명</div>
            <div className="text-center">지역</div>
            <div className="text-center">사이트</div>
            <div className="text-center">발표일</div>
            <div className="text-center">체험기간</div>
            <div className="text-center">경쟁률</div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-5 text-center text-gray-400 text-sm">
            데이터가 없습니다.
          </div>
        ) : (
          items.map((exp, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === items.length - 1;
            const ann = exp.announcementDate && new Date(exp.announcementDate);
            const start = exp.experienceStart && new Date(exp.experienceStart);
            const end = exp.experienceEnd && new Date(exp.experienceEnd);

            return (
              <div
                key={exp.id}
                ref={rowRefs.current[exp.id]}
                style={{ position: 'relative' }}
              >
                {exp.selected && (
                  <div style={{ position: 'absolute', top: 8, left: -28 }}>
                    <SelectedSticker text="선정!" position="left" />
                  </div>
                )}
                <div
                  onClick={() => onItemClick?.(exp)}
                  onMouseEnter={() => setHoveredId(exp.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group cursor-pointer transition-all duration-150 ${!isFirst && 'border-t'}`}
                  style={{ borderColor: headerColor }}
                >
                  <div
                    className="grid px-5 py-4 items-center gap-4 text-gray-800 group-hover:bg-[#FFF1E8]"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <div className="flex items-center pl-3 min-w-0 overflow-hidden">
                      <a
                        href={exp.naverPlaceUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-medium text-blue-600 hover:underline"
                      >
                        {exp.company}
                      </a>
                      {renderTags(exp)}
                    </div>
                    <div className="text-center">{exp.region}</div>
                    <div className="text-center">
                      <a
                        href={exp.siteUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {exp.siteName || '링크'}
                      </a>
                    </div>
                    <div className="text-center">
                      {ann ? (isToday(ann) ? renderHighlight(ann, 'M/d(eee)') : <span>{format(ann, 'M/d(eee)', { locale: ko })}</span>) : ''}
                    </div>
                    <div className="text-center">
                      {start && end ? (
                        <>
                          {isToday(start) ? renderHighlight(start, 'M/d') : format(start, 'M/d')}
                          &nbsp;~&nbsp;
                          {isToday(end) ? renderHighlight(end, 'M/d') : format(end, 'M/d')}
                        </>
                      ) : ('')}
                    </div>
                    <div className="text-center">
                      {exp.competitionRatio || '-'}
                    </div>
                  </div>

                  {hoveredId === exp.id && (
                    <div
                      className="px-5 py-2.5 flex items-center text-sm border-t bg-[#FFF1E8]"
                      style={{
                        borderColor: headerColor,
                        borderBottomLeftRadius: isLast ? 20 : 0,
                        borderBottomRightRadius: isLast ? 20 : 0,
                      }}
                    >
                      <span className="text-[#EB373E] text-[13px]">
                        제공내역:&nbsp;
                        {exp.providedItems ? (
                          <>
                            {exp.providedItems}
                            {exp.additionalInfo && (
                              <span className="text-gray-500">
                                &nbsp;... {exp.additionalInfo}
                              </span>
                            )}
                          </>
                        ) : (
                          '제공 내역이 없습니다.'
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
