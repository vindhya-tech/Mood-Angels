import React, { useState, useEffect } from "react";
import UserWrapper from "../components/UserWrapper";

function Profile() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profilePic, setProfilePic] = useState(null);
  const [mood, setMood] = useState("");
  const [history, setHistory] = useState([]);

  const userId = localStorage.getItem("userId");

  if (!userId) {
    return (
      <div style={{ fontSize: 22, textAlign: "center", padding: 60 }}>
        Please log in to view your profile.
      </div>
    );
  }

  // ✅ Fetch User Data + Mood History
  useEffect(() => {
    if (!userId) return;

    // Fetch profile data
    fetch(`http://localhost:5000/api/profile/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        // Load mood history from backend if available
        if (data.user?.moodHistory) {
          setHistory(data.user.moodHistory);
          localStorage.setItem("moodHistory", JSON.stringify(data.user.moodHistory));
        } else {
          const saved = localStorage.getItem("moodHistory");
          if (saved) setHistory(JSON.parse(saved));
        }
      })
      .catch((err) => console.error("Fetch user failed:", err));
  }, [userId]);

  // ✅ Load saved photo when returning to page
  useEffect(() => {
    const storedPhoto = localStorage.getItem("profilePhoto");
    if (storedPhoto) setProfilePic(storedPhoto);
  }, []);

  // ✅ Save updated profile
  const handleProfileUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/profile/update/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName || "",
          city: user.city || "",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Profile Updated");
        setUser(data.user);
        setEditMode(false);
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Server error");
    }
  };

  // ✅ Fixed + Safe + Compressed Profile Photo Upload
  const handlePhotoUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) {
      console.warn("⚠️ No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 300;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

        try {
          localStorage.setItem("profilePhoto", compressedDataUrl);
          setProfilePic(compressedDataUrl);
          alert("✅ Profile photo updated successfully!");
        } catch (err) {
          console.error("Upload failed:", err);
          alert("⚠️ Upload failed: Image too large even after compression.");
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // ✅ Mood Check-in (now saved to backend + local)
  const handleMoodCheckin = async () => {
    if (!mood) return alert("Please select your mood!");

    const entry = {
      date: new Date().toLocaleDateString(),
      mood,
    };

    const updatedHistory = [entry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("moodHistory", JSON.stringify(updatedHistory));

    // Save mood to backend too ✅
    try {
      const res = await fetch(`http://localhost:5000/api/profile/mood/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodHistory: updatedHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save mood history");
    } catch (err) {
      console.error("Failed to sync mood history:", err);
    }

    alert("✅ Mood check-in saved!");
    setMood("");
    setActiveTab("history");
  };

  if (!user)
    return (
      <div style={{ fontSize: 22, textAlign: "center", padding: 60 }}>
        Loading...
      </div>
    );

  return (
    <UserWrapper>
      <div style={styles.page}>
        {/* Header Banner */}
        <div style={styles.banner}>
          <div style={styles.avatarBox}>
            <img
              src={
                localStorage.getItem("profilePhoto") ||
                profilePic ||
                user?.profilePhoto ||
                "https://via.placeholder.com/120"
              }
              style={styles.avatar}
              alt="profile"
            />
            <div>
              <h3 style={{ color: "#fff", fontSize: "22px", marginBottom: 5 }}>
                {user.firstName} {user.lastName}
              </h3>
              <p style={{ color: "#fff", opacity: 0.9 }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["profile", "medical", "wellness", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? styles.activeTab : styles.tab}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div style={styles.section}>
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <>
              <label>Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />

              <label>First Name</label>
              <input
                style={styles.input}
                disabled={!editMode}
                value={user.firstName}
                onChange={(e) =>
                  setUser({ ...user, firstName: e.target.value })
                }
              />

              <label>Last Name</label>
              <input
                style={styles.input}
                disabled={!editMode}
                value={user.lastName || ""}
                onChange={(e) =>
                  setUser({ ...user, lastName: e.target.value })
                }
              />

              <label>City</label>
              <input
                style={styles.input}
                disabled={!editMode}
                value={user.city || ""}
                onChange={(e) => setUser({ ...user, city: e.target.value })}
              />

              <label>Phone</label>
              <input
                style={{ ...styles.input, background: "#eee" }}
                disabled
                value={user.phone}
              />

              <button
                onClick={() =>
                  editMode ? handleProfileUpdate() : setEditMode(true)
                }
                style={editMode ? styles.saveBtn : styles.editBtn}
              >
                {editMode ? "Save ✅" : "Edit ✏"}
              </button>
            </>
          )}

          {/* Wellness Tab */}
          {activeTab === "wellness" && (
            <div>
              <h3>🌤️ Daily Mood Check-in</h3>
              <select
                style={styles.input}
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                <option value="">Select your mood</option>
                <option value="Happy 😀">Happy 😀</option>
                <option value="Sad 😔">Sad 😔</option>
                <option value="Calm 😌">Calm 😌</option>
                <option value="Tired 😴">Tired 😴</option>
                <option value="Energetic ⚡">Energetic ⚡</option>
                <option value="Stressed 😣">Stressed 😣</option>
              </select>
              <button style={styles.saveBtn} onClick={handleMoodCheckin}>
                Save Check-in ✅
              </button>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              <h3>📅 Mood Check-in History</h3>
              {history.length === 0 ? (
                <p>No mood check-ins yet.</p>
              ) : (
                <ul>
                  {history.map((entry, i) => (
                    <li key={i}>
                      {entry.date} — <b>{entry.mood}</b>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "medical" && <p>Medical info coming soon</p>}
        </div>
      </div>
    </UserWrapper>
  );
}
const styles = {
  // The full page background — use your preferred color here
  page: {
    padding: "30px",
    background: "#f8c8dc", // 💖 use your pink or remove for transparent
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  banner: {
    height: "160px",
    background: "linear-gradient(45deg,#8e44ad,#6c5ce7)",
    display: "flex",
    alignItems: "flex-end",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
    maxWidth: "800px",
    width: "100%",
    marginBottom: "20px",
  },

  avatarBox: { display: "flex", gap: "15px", alignItems: "center" },

  avatar: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    border: "4px solid white",
    objectFit: "cover",
  },

  tabs: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    width: "100%",
    maxWidth: "800px",
    marginBottom: "10px",
  },

  tab: {
    padding: "8px 14px",
    background: "#ddd",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
  },

  activeTab: {
    padding: "8px 14px",
    background: "#6c5ce7",
    color: "#fff",
    borderRadius: "20px",
    border: "none",
  },

  // ✅ Fixed section — no background, no box, no shadow
  section: {
    padding: "20px",
    width: "100%",
    maxWidth: "800px",
    background: "transparent", // 🔥 removes white panel
    boxShadow: "none",         // 🔥 removes shadow
    borderRadius: "0",         // optional: remove rounded edge
  },

  input: {
    width: "100%",
    padding: "10px",
    margin: "6px 0 12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },

  editBtn: {
    background: "#6c5ce7",
    color: "#fff",
    padding: "10px",
    width: "100%",
    borderRadius: "8px",
    cursor: "pointer",
  },

  saveBtn: {
    background: "green",
    color: "#fff",
    padding: "10px",
    width: "100%",
    borderRadius: "8px",
    cursor: "pointer",
  },
};


export default Profile;
