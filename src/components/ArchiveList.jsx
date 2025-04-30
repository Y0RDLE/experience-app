import React from 'react';
import { Pencil } from 'lucide-react';

const ArchiveList = ({ list = [], openModal }) => {
  return (
    <div className="w-full space-y-3">
      {list.length === 0 ? (
        <div className="text-sm text-gray-500">체험단 아카이브가 없습니다.</div>
      ) : (
        list.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center justify-between px-4 py-3 bg-white rounded-md shadow-sm border hover:shadow-md transition"
          >
            <div className="flex flex-col text-left">
              <span className="text-[15px] font-bold text-black">{exp.company}</span>
              <span className="text-xs text-gray-500 mt-1">{exp.siteName} · {exp.region}</span>
            </div>
            <button
              onClick={() => openModal(exp)}
              className="flex items-center gap-1 text-sm text-accentOrange hover:text-orange-500"
            >
              <Pencil size={16} /> 수정
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default ArchiveList;
