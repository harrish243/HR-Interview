import { createBrowserRouter } from "react-router";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProcessingScreen from "./pages/ProcessingScreen";
import InterviewRoom from "./pages/InterviewRoom";
import PerformanceReport from "./pages/PerformanceReport";
import ProfileHistory from "./pages/ProfileHistory";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthPage,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/processing",
    Component: ProcessingScreen,
  },
  {
    path: "/interview",
    Component: InterviewRoom,
  },
  {
    path: "/report",
    Component: PerformanceReport,
  },
  {
    path: "/history",
    Component: ProfileHistory,
  },
]);
