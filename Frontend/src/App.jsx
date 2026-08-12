import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import GroupChat from "./pages/GroupChat";
import DevHelp from "./pages/DevHelp";
import TrendingGithub from "./pages/TrendingGithub";
import Settings from "./pages/Settings";
import ProfileDashboard from "./pages/ProfileDashboard";
import UserProfile from "./pages/UserProfile";
import SearchPage from "./pages/SearchPage";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminContent from "./pages/admin/AdminContent";
import AdminTrustSafety from "./pages/admin/AdminTrustSafety";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import { ThemeProvider } from "./contexts/ThemeContext";
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/group-chat" element={<GroupChat />} />
            <Route path="/help" element={<DevHelp />} />
            <Route path="/trending" element={<TrendingGithub />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dashboard" element={<ProfileDashboard />} />
            <Route path="/profile/:username" element={<UserProfile />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="trust-safety" element={<AdminTrustSafety />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
