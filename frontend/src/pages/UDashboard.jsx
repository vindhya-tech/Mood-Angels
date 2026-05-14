import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  FileText,
  Upload,
  MessageCircle,
  HeartHandshake,
  Info,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function UDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [username, setUsername] = useState("User");
  const [profilePhoto, setProfilePhoto] = useState(null); // ✅ new
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const quotes = [
    "Every day may not be good, but there is something good in every day.",
    "Your present circumstances don’t determine where you can go; they merely determine where you start.",
    "Believe you can and you're halfway there.",
    "Happiness is not something ready made. It comes from your own actions.",
    "Keep going, because you did not come this far just to come this far."
  ];

  // ✅ Fetch username + photo if stored
  useEffect(() => {
    const storedName = localStorage.getItem("firstName");
    const storedPhoto = localStorage.getItem("profilePhoto");
    if (storedName) setUsername(storedName);
    if (storedPhoto) setProfilePhoto(storedPhoto);
  }, []);

  // ✅ Auto-close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Rotate motivational quotes every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  // ✅ Dynamic Streak Logic
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    const lastLogin = localStorage.getItem("lastLoginDate");
    let savedStreak = parseInt(localStorage.getItem("moodStreak")) || 0;

    if (!lastLogin) {
      savedStreak = 1;
    } else {
      const lastDate = new Date(lastLogin);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        savedStreak += 1;
      } else if (diffDays > 1) {
        savedStreak = 1;
      }
    }

    localStorage.setItem("moodStreak", savedStreak);
    localStorage.setItem("lastLoginDate", todayStr);
    setStreak(savedStreak);

    const calcProgress = Math.min((savedStreak / 7) * 100, 100);
    setProgress(calcProgress);
  }, []);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const styles = `
    :root{
      --bg1: #fce8f3;
      --bg2: #efe7ff;
      --bg3: #e8f7ff;
      --card: rgba(255,255,255,0.9);
      --glass: rgba(255,255,255,0.6);
      --accent: #7b61ff;
    }
    *{box-sizing:border-box;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial}
    html,body,#root{height:100%;margin:0}
    .dashboard{position:relative;height:100vh;width:100vw;overflow:hidden;background: linear-gradient(120deg,var(--bg1),var(--bg2),var(--bg3));}
    .bg-animated{position:absolute;inset:0;z-index:0;background: linear-gradient(270deg, #a18cd1, #fbc2eb, #fad0c4, #ffd1ff);background-size:800% 800%;animation:gradShift 20s ease infinite;filter: blur(40px);transform: translateZ(0);}
    @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    .layout{position:relative;z-index:10;display:flex;height:100%;width:100%;}
    .sidebar{width:260px;background:var(--glass);backdrop-filter:blur(8px);box-shadow:0 8px 30px rgba(20,20,40,0.08);transform:translateX(0);transition:transform 300ms ease-in-out;overflow:auto;padding:24px;position:fixed;left:0;top:0;bottom:0;z-index:20;}
    .sidebar.closed{transform:translateX(-280px)}
    .brand{font-weight:700;font-size:20px;color:#3b3b4a;margin-bottom:18px}
    .nav a{display:block;color:#4b4b59;text-decoration:none;padding:8px 12px;border-radius:6px;transition:all 0.3s ease}
    .nav a:hover{background:rgba(123,97,255,0.1);color:var(--accent);transform:translateX(5px)}
    .main{flex:1;display:flex;flex-direction:column;min-width:0;overflow:auto;transition:margin-left 300ms ease-in-out;margin-left:260px;}
    .main.expanded{margin-left:0}
    .header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;background:var(--card);backdrop-filter:blur(6px);box-shadow:0 4px 18px rgba(20,20,40,0.06);transition:all 300ms ease;position:relative;}
    .toggleBtn{background:transparent;border:0;cursor:pointer;font-size:18px}
    .title{font-size:18px;color:#3b3b4a;font-weight:600}
    .avatar{width:40px;height:40px;border-radius:50%;overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#b894ff,#9b6bff);}
    .avatar img{width:100%;height:100%;object-fit:cover;}
    .userMenu{position:absolute;right:22px;top:60px;background:white;border-radius:10px;padding:8px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);font-size:14px;color:#333;}
    .content{padding:28px;display:flex;flex-direction:column;gap:28px;align-items:center;}
    .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:100%}
    .grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;width:100%}
    .card{background:var(--card);padding:20px;border-radius:16px;box-shadow:0 8px 30px rgba(20,20,40,0.06);text-align:center;transition:transform 250ms ease,box-shadow 250ms ease}
    .card:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(20,20,40,0.09)}
    .quoteCenter{max-width:700px;margin:40px auto;padding:20px 32px;font-style:italic;color:#342f3f;text-align:center;min-height:70px;display:flex;align-items:center;justify-content:center;animation:fadeQuote 1s ease;font-size:18px}
    @keyframes fadeQuote{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .progressWrap{padding:18px;background:linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.9));border-radius:14px;width:100%;text-align:center;}
    .progressBar{height:12px;background:#eee;border-radius:999px;overflow:hidden;margin-top:8px;}
    .progressFill{height:100%;background:linear-gradient(90deg,var(--accent),#c084fc);width:0;border-radius:999px;transition:width 1.2s ease-in-out}
    .streakCalendar{display:flex;justify-content:center;gap:12px;margin-top:14px}
    .dayCircle{width:28px;height:28px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center;font-size:12px;color:#555;transition:all 0.3s ease}
    .dayCircle.active{background:#ff69b4;color:#fff;box-shadow:0 4px 10px rgba(255,105,180,0.3)}
    .footer{padding:16px;text-align:center;color:#6b6b76;font-size:13px;background:transparent}
  `;

  return (
    <div className="dashboard">
      <style>{styles}</style>
      <div className="bg-animated" />
      <div className="layout">
        {/* === Sidebar === */}
        <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="brand">MoodAngels</div>
          <nav className="nav">
            <a href="/udashboard">Dashboard</a>
            <a href="/therapistf">Find a Therapist?</a>
            <a href="/profile">Profile</a>
            <a href="/settings">Settings</a>
          </nav>
        </aside>

        {/* === Main Content === */}
        <div className={`main ${sidebarOpen ? "" : "expanded"}`}>
          <header className="header">
            <button className="toggleBtn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="title">Welcome Back 💜</div>

            {/* ✅ Avatar with uploaded photo */}
            <div ref={userMenuRef}>
              <div
                className="avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title="User Menu"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="User" />
                ) : (
                  <User color="white" size={22} />
                )}
              </div>
              {showUserMenu && (
                <div className="userMenu">
                  Hello, <b>{username}</b>! <br />
                  <button
                    onClick={() => {
                      // ✅ preserve photo on logout
                      const savedPhoto = localStorage.getItem("profilePhoto");
                      localStorage.clear();
                      if (savedPhoto) localStorage.setItem("profilePhoto", savedPhoto);
                      navigate("/");
                    }}
                    style={{
                      marginTop: "8px",
                      padding: "6px 12px",
                      background: "red",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* === Dashboard Body === */}
          <div className="content">
            <div key={quoteIndex} className="quoteCenter">
              “{quotes[quoteIndex]}”
            </div>

            {/* === Feature Cards === */}
            <div className="grid3">
              <FeatureCard title="Take a Test" icon={<FileText />} desc="Assess your mood with a quick test." onClick={() => navigate("/test")} />
              <FeatureCard title="Upload Documents" icon={<Upload />} desc="Keep your important files in one place." onClick={() => navigate("/Upload")} />
              <FeatureCard title="Talk to Someone" icon={<MessageCircle />} desc="Connect with a counselor instantly." onClick={() => navigate("/Help")} />
            </div>

            <div className="grid2">
              <FeatureCard title="Resources & Tips" icon={<Info />} desc="Read articles and guides for better mental health." onClick={() => navigate("/articles")} />
              <FeatureCard title="Community Support" icon={<HeartHandshake />} desc="Join group sessions and support circles." onClick={() => navigate("/Support")} />
            </div>

            {/* === Weekly Progress / Streak === */}
            <div className="progressWrap">
              <h4 style={{ marginBottom: 8, color: "#3b3b4a" }}>Your Weekly Progress</h4>
              <div className="progressBar">
                <div className="progressFill" style={{ width: progress + "%" }} />
              </div>
              <div style={{ marginTop: 8, fontSize: "14px", color: "#555" }}>
                {streak > 0
                  ? `You’ve logged in ${streak} day${streak > 1 ? "s" : ""} in a row ✨`
                  : "Start your streak today!"}
              </div>

              <div className="streakCalendar">
                {daysOfWeek.map((day, idx) => (
                  <div key={idx} className={`dayCircle ${idx === todayIndex ? "active" : ""}`}>
                    {day[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="footer">
            © {new Date().getFullYear()} MoodAngels • Crafted with 💜 to support your well-being
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, icon, desc, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="icon">{React.cloneElement(icon, { size: 28, color: "#6b46ff" })}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

export default UDashboard;
