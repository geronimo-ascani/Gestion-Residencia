import { useParams } from "react-router";
import { AdminDashboard } from "../features/dashboard/AdminDashboard";
import { StudentDashboard } from "../features/dashboard/StudentDashboard";
export default function Dashboard() { return useParams().role === "admin" ? <AdminDashboard /> : <StudentDashboard />; }
