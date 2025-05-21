import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HomeIcon, CalendarIcon } from "lucide-react";
import { FiSearch } from "react-icons/fi";

const Sidebar = ({ searchQuery, setSearchQuery }) => {
  const location = useLocation();

  return (
    <aside className="w-full h-full bg-white flex flex-col justify-between shadow-[0_6px_20px_rgba(0,0,0,0.1)] rounded-0">
      {/* 로고 + 검색 */}
      <div className="flex flex-col items-center px-[24px] pt-[48px] gap-10">
        <div className="flex flex-col items-center gap-2 mt-6 mb-4">
          <img src="/my-icon.png" alt="Site Icon" className="w-[90px] h-[90px]" />
          <span className="text-[35px] font-black text-black leading-none text-center">
            띵동~
          </span>
        </div>
        <div className="relative w-full max-w-[200px]">
          <input
            type="text"
            placeholder="체험단 아카이브"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 text-[15px] text-gray-800 placeholder-gray-500 bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.15)] outline-none border-none"
          />
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-black text-[18px] pointer-events-none" />
        </div>

        {/* 메뉴 */}
        <nav className="flex flex-col gap-4 w-full mt-6">
          <Link
            to="/"
            className={`no-underline flex items-center gap-4 w-full py-2 rounded-md text-[20px] font-semibold transition px-4 ${
              location.pathname === "/" ? "bg-accentOrange text-white" : "text-[#5E5D6F] hover:bg-gray-100"
            }`}
          >
            <HomeIcon size={24} className={location.pathname === "/" ? "text-white" : "text-[#9B9AAD]"} />
            <span className={location.pathname === "/" ? "text-white" : "text-[#5E5D6F]"}>
              홈
            </span>
          </Link>

          <Link
            to="/calendar"
            className={`no-underline flex items-center gap-4 w-full py-2 rounded-md text-[20px] font-semibold transition px-4 ${
              location.pathname === "/calendar" ? "bg-accentOrange text-white" : "text-[#5E5D6F] hover:bg-gray-100"
            }`}
          >
            <CalendarIcon size={24} className={location.pathname === "/calendar" ? "text-white" : "text-[#9B9AAD]"} />
            <span className={location.pathname === "/calendar" ? "text-white" : "text-[#5E5D6F]"}>
              캘린더
            </span>
          </Link>
        </nav>
      </div>

      {/* 푸터 */}
      <div className="text-xs text-gray-400 text-left px-[20px] py-[15px] mt-auto">
        © yordle's grace
      </div>
    </aside>
  );
};

export default Sidebar;
