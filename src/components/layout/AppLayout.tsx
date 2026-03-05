import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto bg-background p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
