import React, { useState, useRef, useEffect } from 'react';
import { format, isToday, startOfDay } from 'date-fns';
import SelectedSticker from './SelectedSticker';

const SectionCard = ({ title, headerColor = '#F5D194', items = [], onItemClick }) => {
  const [showProvidedItems, setShowProvidedItems] = useState(null);
  const borderRadius = 20;
  const rowRefs = useRef({});

  const handleMouseEnter = (id) => setShowProvidedItems(id);
  const handleMouseLeave = () => setShowProvidedItems(null);

  const renderTags = (exp) => {
    const tags = [];
    if (exp.isClip) tags.push('클립');
    if (exp.isFamily) tags.push('가족용');
    if (exp.isPetFriendly) tags.push('반려동물');
    return tags.map((tag, idx) => (
      <span
        key={idx}
        className="ml-2 px-1.5 py-[1px] text-[11px] rounded-full bg-[#FFEFDB] text-[#F49D85] font-semibold whitespace-nowrap"
      >
        {tag}
      </span>
    ));
  };

  const gridTemplate = 'minmax(220px, auto) repeat(5, 1fr)';

  useEffect(() => {
    items.forEach(exp => {
      if (!rowRefs.current[exp.id]) {
        rowRefs.current[exp.id] = React.createRef();
      }
    });
  }, [items]);

  const today = startOfDay(new Date());

  // 오늘 날짜이면 그라데이션 텍스트 효과 적용
  const renderHighlightedText = (date) => {
    return (
      <span
        className="font-bold text-transparent bg-clip-text animate-gradientText"
        style={{
          backgroundImage: 'linear-gradient(270deg, rgb(255, 0, 0), rgba(255, 65, 65, 0.48), rgb(255, 0, 0))',
          backgroundSize: '1500% 1500%',
        }}
      >
        {format(date, 'M/d')}
      </span>
    );
  };

  return (
    <div style={{ minWidth: '960px', fontSize: '90%', marginLeft: '-8px' }}>
      <div
        className="relative bg-white rounded shadow-[0_4px_12px_rgba(0,0,0,0.06)] border overflow-visible w-full"
        style={{
          borderColor: headerColor,
          borderRadius: `${borderRadius}px`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[78px] rounded-t-[18px]"
          style={{
            backgroundColor: headerColor,
            zIndex: 0,
          }}
        />
        <div className="relative z-10">
          <div
            className="px-5 py-3 font-extrabold flex justify-between items-center"
            style={{
              backgroundColor: headerColor,
              borderTopLeftRadius: `${borderRadius}px`,
              borderTopRightRadius: `${borderRadius}px`,
            }}
          >
            <h2 className="text-[18px] text-white">{title}</h2>
            <span className="text-xs text-white">총 {items.length}건</span>
          </div>
          <div
            className="grid px-5 py-2.5 text-[11px] font-semibold text-white gap-4"
            style={{
              backgroundColor: headerColor,
              gridTemplateColumns: gridTemplate,
            }}
          >
            <div className="text-left pl-3">업체명</div>
            <div className="text-center">지역</div>
            <div className="text-center">사이트</div>
            <div className="text-center">발표일</div>
            <div className="text-center">체험기간</div>
            <div className="text-center">경쟁률</div>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="p-5 text-center text-gray-400 text-sm">데이터가 없습니다.</div>
        ) : (
          items.map((exp, index) => {
            const isHovered = showProvidedItems === exp.id;
            const isLast = exp.id === items[items.length - 1]?.id;
            const isFirst = index === 0;
            const annDate = exp.announcementDate ? new Date(exp.announcementDate) : null;
            const expEndDate = exp.experienceEnd ? new Date(exp.experienceEnd) : null;

            return (
              <div key={exp.id} ref={rowRefs.current[exp.id]} style={{ position: 'relative' }}>
                {exp.selected === true && (
                  <div style={{ position: 'absolute', top: 9, left: -28 }}>
                    <SelectedSticker text="선정!" position="left" />
                  </div>
                )}
                <div
                  onClick={() => onItemClick?.(exp)}
                  onMouseEnter={() => handleMouseEnter(exp.id)}
                  onMouseLeave={handleMouseLeave}
                  className={`group transition-all duration-150 cursor-pointer ${isFirst ? '' : 'border-t'}`}
                  style={{ borderColor: headerColor }}
                >
                  <div
                    className="grid px-5 py-4 items-center leading-relaxed text-gray-800 group-hover:bg-[#FFF1E8] gap-4"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    <div className="text-left flex flex-wrap items-center min-w-0 relative">
                      <a
                        href={exp.naverPlaceUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium truncate max-w-full ml-3"
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
                      {annDate ? (isToday(annDate) ? renderHighlightedText(annDate) : <span>{format(annDate, 'M/d')}</span>) : ''}
                    </div>
                    <div className="text-center">
                      {exp.experienceStart && exp.experienceEnd ? (
                        <>
                          {format(new Date(exp.experienceStart), 'M/d')} ~{' '}
                          {expEndDate ? (isToday(expEndDate) ? renderHighlightedText(expEndDate) : <span>{format(expEndDate, 'M/d')}</span>) : ''}
                        </>
                      ) : ''}
                    </div>
                    <div className="text-center">{exp.competitionRatio || '-'}</div>
                  </div>
                  {isHovered && (
                    <div
                      className="px-5 py-2.5 border-t flex items-center text-sm group-hover:bg-[#FFF1E8]"
                      style={{
                        borderColor: headerColor,
                        backgroundColor: '#FFF1E8',
                        borderBottomLeftRadius: isLast ? `${borderRadius}px` : '0',
                        borderBottomRightRadius: isLast ? `${borderRadius}px` : '0',
                      }}
                    >
                      <span className="text-[#EB373E] text-[13px]">
                        제공내역:&nbsp;
                        {exp.providedItems ? (
                          <>
                            {exp.providedItems}
                            {exp.additionalInfo && (
                              <span className="text-gray-500">&nbsp;... {exp.additionalInfo}</span>
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
};

export default SectionCard;
