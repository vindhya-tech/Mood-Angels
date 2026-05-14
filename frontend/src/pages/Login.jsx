import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$])[A-Za-z\d@#$]{8,}$/;

  // 🔹 Normal email-password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters, include 1 uppercase letter, 1 digit, and 1 special char (@ # $ _)"
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        // ✅ Correct way to store user info
        localStorage.setItem("token", data.token || "");
        localStorage.setItem("userId", data.user._id);

        // 🧠 Fix name mismatch here:
        localStorage.setItem(
          "firstName",
          data.user.firstName || data.user.name || "User"
        );
        localStorage.setItem(
          "userName",
          data.user.firstName || data.user.name || "User"
        );
        localStorage.setItem(
          "fullName",
          [data.user.firstName, data.user.lastName].filter(Boolean).join(" ")
        );

        localStorage.setItem("email", data.user.email || "");
        localStorage.setItem("profilePhoto", data.user.profilePhoto || "");
        localStorage.setItem("role", data.user.role || "user");

        alert(`Welcome back, ${data.user.firstName || "User"}!`);
        navigate("/UDashboard");
      } else {
        setError(data.msg || data.error || "Invalid email or password");
      }
    } catch (err) {
      console.warn("⚠️ Backend unavailable — navigating for UI testing:", err);
      navigate("/UDashboard");
    }
  };

  // 🔹 Google Login handler
  // 🔹 Google Login handler (FIXED)
const handleGoogleLogin = async (credentialResponse) => {
  try {
    const token = credentialResponse.credential;

    if (!token) {
      setError("No credential received from Google.");
      return;
    }

    // 🚫 REMOVE JWT DECODE — DO NOT DECODE IT
    // const decoded = jwtDecode(token);
    // console.log("Decoded Google Token:", decoded);

    // ✅ Correct backend call
    const res = await axios.post("http://localhost:5000/api/auth/google", {
      token: token, // ⭐ MUST match backend
    });

    if (res.data?.user) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id || "");
      localStorage.setItem(
        "firstName",
        res.data.user.firstName || res.data.user.name || "User"
      );
      localStorage.setItem(
        "userName",
        res.data.user.firstName || res.data.user.name || "User"
      );
      localStorage.setItem(
        "fullName",
        [res.data.user.firstName, res.data.user.lastName].filter(Boolean).join(" ")
      );
      localStorage.setItem("email", res.data.user.email || "");
      localStorage.setItem("profilePhoto", res.data.user.profilePhoto || "");
      localStorage.setItem("role", res.data.user.role || "user");
    }

    navigate("/UDashboard");
  } catch (err) {
    console.error("Google login failed:", err);
    setError("Google login failed. Check console for details.");
  }
};

  return (
    <div className="login-page">
      <style>{css}</style>

      <div className="card">
        {/* LEFT PANEL */}
        <div className="left">
          <div className="left-decor deco1" />
          <div className="left-decor deco2" />
          <div className="left-decor deco3" />
          <div className="brand">
            <h1>Mood</h1>
            <h1>Angles</h1>
          </div>

          <div className="notch">
            <button className="tab active" onClick={() => navigate("/login")}>
              LOGIN
            </button>
            <button className="tab" onClick={() => navigate("/signup")}>
              SIGN UP
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right">
          <h2>LOGIN</h2>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="inputRow">
              <span className="icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#9aa4ad"
                    d="M2 6v12h20V6L12 13 2 6zM20 5c.55 0 1 .45 1 1v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6c0-.55.45-1 1-1h16z"
                  ></path>
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="inputRow">
              <span className="icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#9aa4ad"
                    d="M17 8h-1V6a4 4 0 10-8 0v2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2zm-7 0V6a2 2 0 114 0v2h-4z"
                  ></path>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  marginLeft: "8px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="row between">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="forgot"
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff758c",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
              >
                Forgot Password?
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            <button className="primary" type="submit">
              LOGIN
            </button>

            {/* 🔹 Google Login Button */}
            <div style={{ marginTop: "18px", textAlign: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError("Google Sign-In Failed")}
              />
            </div>

            <p
              style={{
                marginTop: "12px",
                color: "#ff758c",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onClick={() => navigate("/signup")}
            >
              Don’t have an account? Sign Up
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


const css = `
:root {
  --pink1:#ff7eb3;
  --pink2:#ff758c;
  --cardW:980px;
  --cardH:560px;
  --white:#ffffff;
  --dark:#222326;
}
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: #f7cbd4ff;
  font-family: "Poppins", system-ui;
  padding: 10px 150px;
  box-sizing: border-box;
}
.card {
  width: var(--cardW);
  max-width: 95%;
  height: var(--cardH);
  background: transparent;
  display: flex;
  border-radius: 12px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.2);
  overflow: hidden;
  position: relative;
}
.left {
  width: 40%;
  position: relative;
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, var(--pink1), var(--pink2));
}
.left-decor {
  position: absolute;
  border-radius: 18px;
  filter: blur(0.2px);
  opacity: 0.9;
}
.left-decor.deco1 {
  width: 240px;
  height: 240px;
  top: -40px;
  left: -40px;
  transform: rotate(30deg);
  background: linear-gradient(45deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02));
}
.left-decor.deco2 {
  width: 420px;
  height: 420px;
  bottom: -110px;
  left: -110px;
  transform: rotate(18deg);
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0));
}
.left-decor.deco3 {
  width: 380px;
  height: 240px;
  top: 90px;
  left: -80px;
  transform: rotate(-10deg);
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0));
}
.brand {
  position: relative;
  z-index: 2;
  text-align: center;
}
.brand h1 {
  margin: 0;
  font-size: 34px;
  letter-spacing: 1px;
}
.notch {
  position: absolute;
  right: -58px;
  top: 36%;
  width: 168px;
  height: 150px;
  background: #fff;
  border-radius: 90px 0 0 90px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 18px rgba(0,0,0,0.12);
  gap: 6px;
}
.tab {
  font-size: 13px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: #888;
  cursor: pointer;
  padding: 6px 12px;
}
.tab.active {
  background: linear-gradient(90deg, var(--pink1), var(--pink2));
  color: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 12px rgba(255,110,150,0.12);
}
.right {
  width: 60%;
  background: var(--white);
  padding: 44px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.form {
  width: 86%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}
.inputRow {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 4px 8px;
}
.inputRow .icon {
  position: absolute;
  left: 12px;
  pointer-events: none;
}
.inputRow input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: none;
  outline: none;
  color: #333;
  background: transparent;
}
.pw-info {
  margin-left: 8px;
  font-size: 13px;
  color: #999;
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
.pw-info .tooltip {
  position: absolute;
  left: 28px;
  bottom: calc(100% + 6px);
  min-width: 200px;
  background: #222;
  color: #fff;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  display: none;
}
.pw-info:hover .tooltip,
.pw-info:focus .tooltip {
  display: block;
}
.primary {
  margin-top: 8px;
  background: linear-gradient(90deg, var(--pink1), var(--pink2));
  color: #fff;
  border: none;
  padding: 12px 18px;
  border-radius: 28px;
  font-weight: 700;
  cursor: pointer;
}
.primary:hover {
  transform: translateY(-2px);
}
.error {
  color: #b12b2b;
  background: #feecec;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
}
@media (max-width:880px) {
  .card { flex-direction: column; height: auto; }
  .left { width: 100%; height: 220px; }
  .right { width: 100%; padding: 28px; }
  .notch { display: none; }
}
`;
