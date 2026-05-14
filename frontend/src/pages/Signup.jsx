import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    age: "",
    city: "",
    password: "",
    terms: false,
  });
  const [error, setError] = useState("");

  // Password rule: 8+ chars, 1 uppercase, 1 digit, 1 special (@ # $ _)
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$_])[A-Za-z\d@#$_]{8,}$/;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ==========================================================
     🔹 NORMAL SIGNUP
  ========================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordRegex.test(formData.password)) {
      setError(
        "Password must be at least 8 chars, include 1 uppercase, 1 digit & 1 special char (@ # $ _)"
      );
      return;
    }
    if (!formData.terms) {
      setError("Please agree to Terms & Conditions");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup successful!");

        // 🧠 Save user info for consistency across login/signup
        if (data.user) {
          localStorage.setItem("token", data.token || "");
          localStorage.setItem("role", data.user.role || "user");
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
          localStorage.setItem("userId", data.user._id || "");
        }

        navigate("/UDashboard");
      } else {
        setError(data.msg || data.error || data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Backend not reachable. Check if server is running.");
    }
  };

 /* ==========================================================
   🔹 GOOGLE SIGNUP / LOGIN (FIXED)
========================================================== */
const handleGoogleSignup = async (credentialResponse) => {
  try {
    const token = credentialResponse.credential;

    if (!token) {
      setError("No credential received from Google.");
      return;
    }

    // 🚫 DO NOT DECODE THE TOKEN
    // const decoded = jwtDecode(token);
    // console.log("Decoded Google Token:", decoded);

    // ⭐ Correct backend call
    const res = await axios.post("http://localhost:5000/api/auth/google", {
      token: token, // MUST match backend
    });

    // ⭐ Store user data
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.user.role || "user");
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
    localStorage.setItem("userId", res.data.user._id || "");
    localStorage.setItem("profilePhoto", res.data.user.profilePhoto || "");

    navigate("/UDashboard");
  } catch (err) {
    console.error("Google signup failed:", err);
    setError("Google signup failed. Check console for details.");
  }
};

  return (
    <div className="login-page">
      <style>{css}</style>

      <div className="card">
        {/* LEFT PANEL */}
        <div className="left">
          <div className="brand">
            <h1>Mood</h1>
            <h1>Angles</h1>
          </div>
          <div className="notch notch-signup">
            <button className="tab" onClick={() => navigate("/login")}>
              LOGIN
            </button>
            <button className="tab active">SIGN UP</button>
          </div>
          <div className="left-decor deco1"></div>
          <div className="left-decor deco2"></div>
          <div className="left-decor deco3"></div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right">
          <h2>SIGN UP</h2>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            {/* Gender */}
            <div className="form-group">
              <label>Gender:</label>
              <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
                {["male", "female", "other"].map((g) => (
                  <label key={g}>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={formData.gender === g}
                      onChange={handleChange}
                      required
                    />{" "}
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
              min="1"
              max="120"
              required
            />

            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            >
              <option value="">Select your city</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="bangalore">Bangalore</option>
              <option value="mumbai">Mumbai</option>
              <option value="chennai">Chennai</option>
              <option value="pune">Pune</option>
              <option value="delhi">Delhi</option>
            </select>

            {/* Password field */}
            <div className="inputRow">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span className="pw-info" tabIndex={0} aria-label="password rules">
                ⓘ
                <span className="tooltip">
                  Password rules:
                  <br />• Minimum 8 characters
                  <br />• At least 1 uppercase letter
                  <br />• At least 1 digit
                  <br />• One special char: <b>@ # $ _</b>
                </span>
              </span>
            </div>

            <label style={{ fontSize: "13px", color: "#555" }}>
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                required
              />{" "}
              I agree to the Terms & Conditions
            </label>

            {error && <div className="error">{error}</div>}

            <button className="primary" type="submit">
              SIGN UP
            </button>

            <div className="divider" />
            <div className="social">
              <span>or</span>
              <GoogleLogin
                onSuccess={handleGoogleSignup}
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
              onClick={() => navigate("/login")}
            >
              Already have an account? Login
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const css = `
:root{
  --pink1:#ff7eb3;
  --pink2:#ff758c;
  --cardW:980px;
  --cardH:560px;
  --white:#ffffff;
  --dark:#222326;
}

.form label {
  font-size: 14px;
  color: #222;  /* darker, readable */
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}

/* Page */
.login-page{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background: #f7cbd4ff;
  font-family: "Poppins", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  padding: 10px 150px 10px 150px;
}

/* Card */
.card{
  width:var(--cardW);
  max-width:95%;
  height:var(--cardH);
  background:transparent;
  display:flex;
  border-radius:12px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.7);
  overflow:hidden;
  position:relative;
}

// .login-page {
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   min-height: 100vh;
//   width: 100%;
//   background: #2f3132;
//   font-family: "Poppins", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
//   padding: 24px;
//   box-sizing: border-box;
// }

// .card {
//   margin: 0 auto;
// }


/* LEFT PANEL */
.left{
  width:40%;
  position:relative;
  padding:36px 28px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  color:white;
  background: linear-gradient(135deg, var(--pink1), var(--pink2));
}

/* layered diagonal bands */
.left-decor{
  position:absolute;
  border-radius:18px;
  filter: blur(0.2px);
  opacity:0.9;
}
.left-decor.deco1{
  width:240px;
  height:240px;
  top:-40px;
  left:-40px;
  transform: rotate(30deg);
  background:linear-gradient(45deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02));
}
.left-decor.deco2{
  width:420px;
  height:420px;
  bottom:-110px;
  left:-110px;
  transform: rotate(18deg);
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0));
}
.left-decor.deco3{
  width:380px;
  height:240px;
  top:90px;
  left:-80px;
  transform: rotate(-10deg);
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0));
}

/* brand text on the left */
.brand{
  position:relative;
  z-index:2;
  text-align:center;
}
.brand h1{ margin:0; font-size:34px; letter-spacing:1px; }
.brand p{ margin:6px 0 0; opacity:0.95; font-weight:500; }

/* white curved notch that overlaps into right panel */
.notch{
  position:absolute;
  right:-58px;
  top:36%;
  width:168px;
  height:150px;
  background: #fff;
  border-radius:90px 0 0 90px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  box-shadow: 0 8px 18px rgba(0,0,0,0.12);
  z-index:3;
  gap:6px;
  padding-left:6px;
}
.notch .tab{
  font-size:13px;
  font-weight:700;
  border:none;
  background:transparent;
  color:#888;
  cursor:pointer;
  padding:6px 12px;
}
.notch .tab.active{
  background:linear-gradient(90deg, var(--pink1), var(--pink2));
  color:#fff;
  border-radius:18px;
  box-shadow: 0 6px 12px rgba(255,110,150,0.12);
}
.notch-signup{ right:-64px; } /* small tweak when sign up active */

/* RIGHT PANEL */
/* RIGHT PANEL */
.right{
  width:60%;
  background:var(--white);
  padding:44px 48px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:12px;
  position:relative;
  overflow-y:auto;     /* enable vertical scrolling */
  max-height:100%;     /* keeps scroll within the card */
  scrollbar-width: thin;       /* Firefox */
  scrollbar-color: #ccc transparent;
}

/* Optional: nicer scrollbar for WebKit browsers */
.right::-webkit-scrollbar {
  width: 6px;
}
.right::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}
.right::-webkit-scrollbar-track {
  background: transparent;
}


/* logo placeholder */
.logo{
  width:88px;
  height:88px;
  object-fit:cover;
  border-radius:12px;
  margin-top:8px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
}

/* title */
.right h2{
  margin:8px 0 18px;
  color: #ff758c;
  letter-spacing:2px;
}

/* form */
.form{ width:86%; display:flex; flex-direction:column; gap:12px; align-items:stretch; }

/* Input row with left icon */
.inputRow{
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;              /* white background */
  border: 1px solid #e6e6e6;     /* light border */
  border-radius: 8px;            /* rounded edges */
  padding: 4px 8px;              /* inner spacing */
}
.inputRow .icon{
  position: absolute;
  left: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  height: 100%;
}
.inputRow input{
  width: 100%;
  padding: 10px 12px 10px 36px;  /* more left padding to fit icon */
  border: none;                  /* remove bottom-only border */
  font-size: 14px;
  outline: none;
  color: #333;
  background: transparent;       /* let parent white show through */
}
.inputRow input:focus{
  border: none;
  box-shadow: 0 0 0 2px rgba(255,117,140,0.25); /* subtle focus glow */
  transform: translateY(-1px);
}
/* Form inputs (Signup page) */
.form input[type="text"],
.form input[type="email"],
.form input[type="tel"],
.form input[type="number"],
.form select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #fff;   /* white container */
  color: #333;
  transition: all 0.18s ease;
}
.form input:focus,
.form select:focus {
  border-color: #ff758c;
  box-shadow: 0 0 0 2px rgba(255,117,140,0.25); /* subtle pink glow */
  transform: translateY(-1px);
}
/* Clean up radio & checkbox spacing */
.form input[type="radio"],
.form input[type="checkbox"] {
  margin-right: 6px;
}

/* password info tooltip */
.pw-info{
  margin-left:8px;
  font-size:13px;
  color:#999;
  cursor:default;
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:24px;
  height:24px;
  border-radius:50%;
  background:transparent;
  border:none;
}
.pw-info .tooltip{
  position:absolute;
  left:28px;
  bottom:calc(100% + 6px);
  min-width:200px;
  background:#222;
  color:#fff;
  padding:10px;
  border-radius:8px;
  font-size:12px;
  line-height:1.2;
  display:none;
  box-shadow: 0 12px 30px rgba(0,0,0,0.28);
  z-index:40;
}
.pw-info:hover .tooltip,
.pw-info:focus .tooltip{
  display:block;
}

/* forgot link & layout helpers */
.row.between{
  display:flex;
  justify-content:flex-end;
  align-items:center;
}
.forgot{
  font-size:13px;
  color:#ff758c;
  cursor:pointer;
  text-decoration:none;
}
.forgot:hover{ text-decoration:underline; }

/* primary button */
.primary{
  margin-top:8px;
  background: linear-gradient(90deg,var(--pink1),var(--pink2));
  color:#fff;
  border:none;
  padding:12px 18px;
  border-radius:28px;
  font-weight:700;
  cursor:pointer;
  font-size:15px;
  box-shadow: 0 10px 26px rgba(255,110,150,0.12);
}
.primary:hover{ transform:translateY(-2px); }

/* error */
.error{
  color:#b12b2b;
  background: #feecec;
  padding:8px 10px;
  border-radius:6px;
  font-size:13px;
}

/* divider */
.divider{
  width:86%;
  height:1px;
  background:#f0f0f0;
  margin-top:10px;
  margin-bottom:8px;
}

/* social area (google) */
.social{
  width:86%;
  display:flex;
  flex-direction:column;
  gap:10px;
  align-items:center;
}
.social span{ color:#888; font-size:13px; }

.google{
  border:1px solid #e7e7e7;
  background:#fff;
  padding:10px 16px;
  border-radius:28px;
  display:inline-flex;
  gap:10px;
  align-items:center;
  cursor:pointer;
  font-weight:600;
  font-size:14px;
}
.google svg{ display:block; }
.google:hover{ background:#fbfbfb; }

/* small screens */
@media (max-width:880px){
  .card{ flex-direction:column; height:auto; width:95%; }
  .left{ width:100%; height:220px; border-radius:12px 12px 0 0; }
  .right{ width:100%; border-radius:0 0 12px 12px; padding:28px; }
  .notch{ display:none; }
}
` ;
