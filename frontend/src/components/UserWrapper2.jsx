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
import { Link, useNavigate } from "react-router-dom";


function UserWrapper2({children}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [username, setUsername] = useState("User");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  // Fetch user info from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedName =
          localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("fullName") ||
          localStorage.getItem("email")?.split("@")[0] ||
          "User";
        if (storedName) setUsername(storedName);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cycle quotes

  // Weekly progress and streat

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
    .header.full{width:100%}
    .toggleBtn{background:transparent;border:0;cursor:pointer;font-size:18px}
    .title{font-size:18px;color:#3b3b4a;font-weight:600}
    .avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(180deg,#b894ff,#9b6bff);display:flex;align-items:center;justify-content:center;cursor:pointer;}
    .userMenu{position:absolute;right:22px;top:60px;background:white;border-radius:10px;padding:8px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);font-size:14px;color:#333;}
    .content{padding:28px;display:flex;flex-direction:column;gap:28px;align-items:center;}
    .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:100%}
    .grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;width:100%}
    .card{background:var(--card);padding:20px;border-radius:16px;box-shadow:0 8px 30px rgba(20,20,40,0.06);text-align:center;transition:transform 250ms ease,box-shadow 250ms ease}
    .card:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(20,20,40,0.09)}
    .card .icon{width:48px;height:48px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center}
    .card h3{margin:6px 0 8px;font-size:16px;color:#3b3b4a}
    .card p{margin:0;color:#6b6b76;font-size:14px}
    .quoteCenter{max-width:700px;margin:40px auto;padding:20px 32px;font-style:italic;color:#342f3f;text-align:center;min-height:70px;display:flex;align-items:center;justify-content:center;animation:fadeQuote 1s ease;font-size:18px}
    @keyframes fadeQuote{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .progressWrap{padding:18px;background:linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.9));border-radius:14px;width:100%;}
    .progressBar{height:12px;background:#eee;border-radius:999px;overflow:hidden}
    .progressFill{height:100%;background:linear-gradient(90deg,var(--accent),#c084fc);width:0;border-radius:999px;transition:width 1.2s ease-in-out}
    .progressMeta{margin-top:8px;font-size:13px;color:#6b6b76}
    .streakCalendar{display:flex;justify-content:center;gap:12px;margin-top:14px}
    .dayCircle{width:28px;height:28px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center;font-size:12px;color:#555;transition:all 0.3s ease}
    .dayCircle.active{background:var(--accent);color:#fff;box-shadow:0 4px 10px rgba(123,97,255,0.3)}
    .footer{padding:16px;text-align:center;color:#6b6b76;font-size:13px;background:transparent}
    @media(max-width:960px){.grid3{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}.main{margin-left:0}}
  `;

  return (
    <div className="dashboard">
      <style>{styles}</style>
      <div className="bg-animated" />
      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="brand">MoodAngels</div>
          <nav className="nav">
            <Link to="/pdashboard">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/settings">Settings</Link>
          </nav>
        </aside>

        <div className={`main ${sidebarOpen ? "" : "expanded"}`}>
          <header className={`header ${sidebarOpen ? "" : "full"}`}>
            <button
              className="toggleBtn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="title">MoodAngels</div>

            <div ref={userMenuRef} className="relative">
              <div
                className="avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title="User Menu"
              >
                <User color="white" size={22} />
              </div>
              {showUserMenu && (
                <div className="userMenu">
                  Hello, <b>{username}</b>!<br />
                  <button
                    onClick={() => {
                      localStorage.clear();
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

          {/* ✅ This is where each page’s content will render */}
          <div className="content">
            {children}
          </div>

          <div className="footer">
            © {new Date().getFullYear()} MoodAngels • Crafted with 💜 to support your well-being
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserWrapper2;
