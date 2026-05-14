// src/components/UserWrapper.jsx
import React, { useState, useEffect, useRef } from "react";
import { Menu, X, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function UserWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState(
    localStorage.getItem("firstName") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("fullName") ||
      localStorage.getItem("email")?.split("@")[0] ||
      "User"
  );
  const [profilePhoto, setProfilePhoto] = useState(localStorage.getItem("profilePhoto") || null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Sync username + photo from localStorage (listen for updates)
  useEffect(() => {
    const syncData = () => {
      const updatedName =
        localStorage.getItem("firstName") ||
        localStorage.getItem("userName") ||
        localStorage.getItem("fullName") ||
        localStorage.getItem("email")?.split("@")[0] ||
        "User";
      const updatedPhoto = localStorage.getItem("profilePhoto");
      if (updatedName) setUsername(updatedName);
      if (updatedPhoto) setProfilePhoto(updatedPhoto);
    };

    // ✅ Listen to manual trigger (same-tab updates)
    window.addEventListener("storage", syncData);

    // ✅ Trigger once on mount (for fresh load)
    syncData();

    // ✅ Also trigger manually after upload events
    window.addEventListener("profilePhotoUpdated", syncData);

    return () => {
      window.removeEventListener("storage", syncData);
      window.removeEventListener("profilePhotoUpdated", syncData);
    };
  }, []);

  // ✅ Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Simple helper to validate base64 string
  const isValidImage = (data) =>
    typeof data === "string" && data.startsWith("data:image/");

  const styles = `
    :root {
      --bg1: #fce8f3;
      --bg2: #efe7ff;
      --bg3: #e8f7ff;
      --card: rgba(255,255,255,0.9);
      --glass: rgba(255,255,255,0.6);
      --accent: #7b61ff;
    }
    * {
      box-sizing: border-box;
      font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
    }
    html, body, #root { height: 100%; margin: 0; }
    .dashboard {
      position: relative;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: linear-gradient(120deg, var(--bg1), var(--bg2), var(--bg3));
    }
    .bg-animated {
      position: absolute; inset: 0; z-index: 0;
      background: linear-gradient(270deg, #a18cd1, #fbc2eb, #fad0c4, #ffd1ff);
      background-size: 800% 800%;
      animation: gradShift 20s ease infinite;
      filter: blur(40px);
      transform: translateZ(0);
    }
    @keyframes gradShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .layout {
      position: relative;
      z-index: 10;
      display: flex;
      height: 100%;
      width: 100%;
    }
    .sidebar {
      width: 260px;
      background: var(--glass);
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 30px rgba(20,20,40,0.08);
      transform: translateX(0);
      transition: transform 300ms ease-in-out;
      overflow: auto;
      padding: 24px;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 20;
    }
    .sidebar.closed { transform: translateX(-280px); }
    .brand {
      font-weight: 700;
      font-size: 20px;
      color: #3b3b4a;
      margin-bottom: 18px;
    }
    .nav a {
      display: block;
      color: #4b4b59;
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.3s ease;
    }
    .nav a:hover {
      background: rgba(123,97,255,0.1);
      color: var(--accent);
      transform: translateX(5px);
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: auto;
      transition: margin-left 300ms ease-in-out;
      margin-left: 260px;
    }
    .main.expanded { margin-left: 0; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px;
      background: var(--card);
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 18px rgba(20,20,40,0.06);
      transition: all 300ms ease;
      position: relative;
    }
    .toggleBtn { background: transparent; border: 0; cursor: pointer; font-size: 18px; }
    .title { font-size: 18px; color: #3b3b4a; font-weight: 600; }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(180deg, #b894ff, #9b6bff);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
    }
    .userMenu {
      position: absolute;
      right: 22px;
      top: 60px;
      background: white;
      border-radius: 10px;
      padding: 8px 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-size: 14px;
      color: #333;
    }
    .content {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      align-items: center;
    }
    .footer {
      padding: 16px;
      text-align: center;
      color: #6b6b76;
      font-size: 13px;
      background: transparent;
    }
    @media(max-width:960px) { .main { margin-left: 0; } }
  `;

  return (
    <div className="dashboard">
      <style>{styles}</style>
      <div className="bg-animated" />
      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="brand">MoodAngels</div>
          <nav className="nav">
            <Link to="/udashboard">Dashboard</Link>
            <Link to="/therapistf">Find a Therapist</Link>
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
                {isValidImage(profilePhoto) ? (
                  <img
                    src={profilePhoto}
                    alt="User Avatar"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <User color="white" size={22} />
                )}
              </div>

              {showUserMenu && (
                <div className="userMenu">
                  Hello, <b>{username}</b>! <br />
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

          <div className="content">
            {children || <p style={{ color: "gray" }}>⚠️ No content loaded</p>}
          </div>

          <div className="footer">
            © {new Date().getFullYear()} MoodAngels • Crafted with 💜
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserWrapper;
