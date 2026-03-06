import { useState } from "react";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: "present" | "absent" | "late" | "half-day";
  hoursWorked: number | null;
  shift: string;
}

const generateRecords = (): AttendanceRecord[] => {
  const employees = [
    { id: "EMP-001", name: "Priya Sharma", shift: "Full Day" },
    { id: "EMP-002", name: "Rahul Kumar", shift: "Morning" },
    { id: "EMP-003", name: "Anita Devi", shift: "Evening" },
    { id: "EMP-004", name: "Suresh Babu", shift: "Morning" },
    { id: "EMP-005", name: "Meera Nair", shift: "Night" },
    { id: "EMP-006", name: "Vikram Singh", shift: "Full Day" },
  ];

  const records: AttendanceRecord[] = [];
  const today = new Date();

  for (let d = 6; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];

    employees.forEach((emp) => {
      const rand = Math.random();
      const status: AttendanceRecord["status"] =
        rand > 0.85 ? "absent" : rand > 0.75 ? "late" : rand > 0.65 ? "half-day" : "present";
      const clockIn =
        status === "absent" ? null : status === "late" ? "10:15 AM" : "09:00 AM";
      const clockOut =
        status === "absent" ? null : status === "half-day" ? "01:00 PM" : "06:00 PM";
      const hoursWorked =
        status === "absent" ? null : status === "half-day" ? 4 : status === "late" ? 7.75 : 9;

      records.push({
        id: `${emp.id}-${dateStr}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: dateStr,
        clockIn,
        clockOut,
        status,
        hoursWorked,
        shift: emp.shift,
      });
    });
  }

  return records;
};

export const useAttendance = () => {
  const [records] = useState<AttendanceRecord[]>(generateRecords);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);

  const clockIn = () => {
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    setClockedIn(true);
    setClockInTime(now);
    setClockOutTime(null);
  };

  const clockOut = () => {
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    setClockedIn(false);
    setClockOutTime(now);
  };

  const getEmployeeRecords = (employeeId: string) =>
    records.filter((r) => r.employeeId === employeeId);

  const getTodayRecords = () => {
    const today = new Date().toISOString().split("T")[0];
    return records.filter((r) => r.date === today);
  };

  const getAttendanceSummary = () => {
    const today = getTodayRecords();
    return {
      total: 6,
      present: today.filter((r) => r.status === "present").length,
      late: today.filter((r) => r.status === "late").length,
      absent: today.filter((r) => r.status === "absent").length,
      halfDay: today.filter((r) => r.status === "half-day").length,
    };
  };

  return {
    records,
    clockedIn,
    clockInTime,
    clockOutTime,
    clockIn,
    clockOut,
    getEmployeeRecords,
    getTodayRecords,
    getAttendanceSummary,
  };
};
