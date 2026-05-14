// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

// 👩‍💻 Core User Pages
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard2 from "./pages/Dashboard.jsx";
import UDashboard from "./pages/UDashboard.jsx";
import Landing from "./pages/Landing.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";

// 🧠 Psychiatrist Pages
import PLogin from "./pages/PLogin.jsx";
import PSignup from "./pages/PSignup.jsx";
import PDashboard from "./pages/PDashboard.jsx";
import RequestInvite from "./pages/RequestInvite.jsx";
import AdminInvites from "./pages/AdminInvites.jsx"; // ✅ now included

// 💬 Support / Chat / Articles / Upload
import ChatBot from "./pages/ChatBot.jsx";
import FindTherapist from "./pages/TherapistF.jsx";
import Support from "./pages/Support.jsx";
import Upload from "./pages/UploadD.jsx";
import Articles from "./pages/Articles.jsx";
import Help from "./pages/Help.jsx";

// 🧩 Mental Health Tests
import TestPage from "./pages/TestPage.jsx";
import DepressionTest from "./pages/tests/DepressionTest.jsx";
import AnxietyTest from "./pages/tests/AnxietyTest.jsx";
import ADHDTest from "./pages/tests/ADHDTest.jsx";
import AutismTest from "./pages/tests/AutismTest.jsx";
import BipolarTest from "./pages/tests/BipolarTest.jsx";
import NeuroTest from "./pages/tests/NeuroTest.jsx";
import PersonalityTest from "./pages/tests/PersonalityTest.jsx";
import EQTest from "./pages/tests/EQTest.jsx";
import MentalHealthTodayTest from "./pages/tests/MentalHeathTodayTest.jsx";

// 🌍 Global navigation injector (for cross-page navigation)
function NavigatorInjector({ children }) {
  const navigate = useNavigate();
  useEffect(() => {
    window.__navigate = navigate;
    return () => {
      // optional cleanup
      // window.__navigate = undefined;
    };
  }, [navigate]);
  return children;
}

function App() {
  return (
    <Router>
      <NavigatorInjector>
        <Routes>

          {/* ========================== 👩‍💻 USER ROUTES ========================== */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard2 />} />
          <Route path="/udashboard" element={<UDashboard />} />
          <Route path="/UDashboard" element={<UDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ========================== 🧠 PSYCHIATRIST ROUTES ========================== */}
          <Route path="/plogin" element={<PLogin />} />
          <Route path="/psignup" element={<PSignup />} />
          <Route path="/pdashboard" element={<PDashboard />} />
          <Route path="/PDashboard" element={<PDashboard />} />

          {/* 🆕 Invite System */}
          <Route path="/request-invite" element={<RequestInvite />} />
          <Route path="/admin/invites" element={<AdminInvites />} />

          {/* ========================== 💬 UTILITIES / FEATURES ========================== */}
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/therapistf" element={<FindTherapist />} />
          <Route path="/TherapistF" element={<FindTherapist />} />
          <Route path="/support" element={<Support />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/help" element={<Help />} />

          {/* ========================== 🧩 TEST ROUTES ========================== */}
          <Route path="/test" element={<TestPage />} />
          <Route path="/test/depression" element={<DepressionTest />} />
          <Route path="/test/anxiety" element={<AnxietyTest />} />
          <Route path="/test/adhd" element={<ADHDTest />} />
          <Route path="/test/autism" element={<AutismTest />} />
          <Route path="/test/bipolar" element={<BipolarTest />} />
          <Route path="/test/neuro" element={<NeuroTest />} />
          <Route path="/test/personality" element={<PersonalityTest />} />
          <Route path="/test/eq" element={<EQTest />} />
          <Route path="/test/mentalhealth" element={<MentalHealthTodayTest />} />

          {/* ========================== 🌐 FALLBACK ========================== */}
          <Route path="*" element={<Landing />} />

        </Routes>
      </NavigatorInjector>
    </Router>
  );
}

export default App;
