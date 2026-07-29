import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import GroupChat from "./pages/GroupChat";
import BattleCode from "./pages/BattleCode";
import DevCompanies from "./pages/DevCompanies";
import Learn from "./pages/Learn";
import DevChallenges from "./pages/DevChallenges";
import DevHelp from "./pages/DevHelp";
import TrendingGithub from "./pages/TrendingGithub";
import Settings from "./pages/Settings";
import MainLayout from "./layouts/MainLayout";
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/group-chat" element={<GroupChat />} />
          <Route path="/battle-code" element={<BattleCode />} />
          <Route path="/companies" element={<DevCompanies />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/challenges" element={<DevChallenges />} />
          <Route path="/help" element={<DevHelp />} />
          <Route path="/trending" element={<TrendingGithub />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
