import { useMemo } from "react";
import { useAttendanceMe, useClockIn, useClockOut } from "@/hooks/api/useApi";

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

export const useAttendance = () => {
  const { data } = useAttendanceMe();
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const records = useMemo(() => ((data as AttendanceRecord[] | undefined) || []), [data]);
  const today = new Date().toISOString().split("T")[0];
  const todayRecord = records.find((r) => r.date === today);
  const clockedIn = Boolean(todayRecord?.clockIn && !todayRecord?.clockOut);
  const clockInTime = todayRecord?.clockIn || null;
  const clockOutTime = todayRecord?.clockOut || null;

  const clockIn = () => clockInMutation.mutate(undefined);
  const clockOut = () => clockOutMutation.mutate(undefined);

  const getEmployeeRecords = (employeeId: string) =>
    records.filter((r) => r.employeeId === employeeId);

  const getTodayRecords = () => {
    const today = new Date().toISOString().split("T")[0];
    return records.filter((r) => r.date === today);
  };

  const getAttendanceSummary = () => {
    const today = getTodayRecords();
    return {
      total: today.length,
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
