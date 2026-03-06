import { createContext, useContext, useState, ReactNode } from "react";

export type AppRole = "admin" | "employee";

interface RoleContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  currentUser: { name: string; avatar: string; employeeId: string };
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<AppRole>("admin");

  const currentUser = {
    name: role === "admin" ? "Priya Sharma" : "Rahul Kumar",
    avatar: role === "admin" ? "PS" : "RK",
    employeeId: role === "admin" ? "EMP-001" : "EMP-002",
  };

  return (
    <RoleContext.Provider value={{ role, setRole, currentUser }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
