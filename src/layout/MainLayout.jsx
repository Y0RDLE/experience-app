// src/layout/MainLayout.jsx
import Sidebar from '@/components/Sidebar';

const MainLayout = ({ children, sidebar }) => (
  <div className="relative flex w-screen h-screen overflow-hidden">
    <div className="fixed top-0 left-0 w-[228px] h-screen z-20">
      {sidebar || <Sidebar />}  {/* ✅ 전달된 사이드바가 있으면 그걸 사용 */}
    </div>
    <div className="flex-1 ml-[228px] overflow-y-auto bg-customBg p-6">
      {children}
    </div>
  </div>
);

export default MainLayout;
