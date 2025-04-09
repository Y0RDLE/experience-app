import React, { useRef, useLayoutEffect, useState } from 'react';
import SectionCard from './SectionCard';
import SelectedSticker from './SelectedSticker';

const SectionCardWrapper = ({ title, items, headerColor = '#F5D194', onItemClick }) => {
  const rowRefs = useRef({});
  const wrapperRef = useRef(null);
  const [positions, setPositions] = useState([]);

  useLayoutEffect(() => {
    const newPositions = [];

    items.forEach((item) => {
      if (item.selected && rowRefs.current[item.id]) {
        const el = rowRefs.current[item.id];
        const rect = el.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        newPositions.push({
          id: item.id,
          top: rect.top + scrollTop + 8,
          left: rect.left + scrollLeft - 28,
        });
      }
    });

    setPositions(newPositions);
  }, [items]);

  return (
    <>
      {positions.map((pos) => (
        <div
          key={`ribbon-${pos.id}`}
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            zIndex: 1000,
          }}
        >
          <SelectedSticker text="선정!" position="left" />
        </div>
      ))}

      <div ref={wrapperRef}>
        <SectionCard
          title={title}
          items={items}
          headerColor={headerColor}
          onItemClick={onItemClick}
          rowRefs={rowRefs}
        />
      </div>
    </>
  );
};

export default SectionCardWrapper;
