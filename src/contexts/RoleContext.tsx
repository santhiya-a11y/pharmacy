import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type AppRole = "admin" | "employee";

interface RoleContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  currentUser: { name: string; avatar: string; employeeId: string };
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("admin");

  const currentUser = useMemo(() => {
    const name = user?.name || user?.email || (role === "admin" ? "Admin User" : "Employee User");
    const avatar = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "US";
    return {
      name,
      avatar,
      employeeId: user?.employeeId || "UNASSIGNED",
    };
  }, [role, user]);

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
