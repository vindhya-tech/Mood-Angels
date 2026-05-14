import React, { useState } from "react";
import UserWrapper from "../../components/UserWrapper";

export default function NeuroTest() {
  const API_BASE = "http://localhost:5000";
  const testName = "Neuroticism Traits";

  
  const questions = [
    "I get stressed or overwhelmed easily.",
    "It takes a lot for me to feel embarrassed or self-conscious.",
    "My mood tends to change quickly and often.",
    "I stay calm and steady when things go wrong.",
    "I generally feel positive and relaxed most of the time.",
    "I’m easily startled or on edge in unexpected situations.",
    "It’s easy for other people’s emotions to affect my own mood.",
    "When I worry, it can feel hard to stop thinking about it.",
    "There aren’t many things that make me feel afraid.",
    "Once I start feeling anxious or sad, it takes time for me to calm down.",
    "I feel down or low more often than I’d like to.",
    "I often imagine worst-case scenarios or focus on what might go wrong.",
    "Small problems rarely upset me for long.",
    "I can be very self-critical, even over small mistakes.",
    "I get irritated or frustrated more easily than others.",
    "I sometimes doubt my ability to handle difficult situations.",
    "I usually feel secure and not easily threatened by others.",
    "I tend to overthink or exaggerate small issues.",
    "When I face major obstacles, I sometimes feel like giving up.",
    "I can usually keep my emotions steady, even under stress."
  ];

  const [answers, setAnswers] = useState(Array(questions.length).fill(null)); // storing 1..5
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = ["#ef4444", "#f97316", "#facc15", "#3b82f6", "#22c55e"];

  const handleSelect = (qIndex, value) => {
    if (qIndex < 0 || qIndex >= questions.length) return;
    const updated = [...answers];
    updated[qIndex] = value; // value should be 1..5 (UI uses j+1)
    setAnswers(updated);
  };

  const buildAnswersPayload = () =>
    questions.reduce((acc, q, i) => {
      acc[`Q${i + 1}`] = `${q} → Answer: ${answers[i]}`;
      return acc;
    }, {});

  // compute percent (0..100) when answers are 1..5
  const computePercent = () => {
    const raw = answers.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
    const maxRaw = questions.length * 5;
    if (maxRaw === 0) return 0;
    return Math.round((raw / maxRaw) * 100);
  };

  // compute 0..10 normalized with one decimal
  const computeNormalized10 = () => {
    const percent = computePercent();
    const norm10 = Math.round(((percent / 100) * 10) * 10) / 10;
    return norm10;
  };

  const interpretLevel = (percent) => {
    if (percent < 33) return "Low level of Neuroticism";
    if (percent < 66) return "Moderate level of Neuroticism";
    return "High level of Neuroticism";
  };

  const safeText = (x) => {
    if (x === undefined || x === null) return "";
    if (typeof x === "string") return x;
    try {
      return JSON.stringify(x);
    } catch {
      return String(x);
    }
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      setResult({
        score: null,
        level: "Please answer all questions before submitting!",
      });
      return;
    }

    setLoading(true);

    const percentScore = computePercent(); // 0..100
    const normalized10 = computeNormalized10(); // 0..10 one decimal
    const level = interpretLevel(percentScore);

    // show immediate local result
    setResult({ scorePercent: percentScore, score10: normalized10, level });

    // Angel chain variables
    let AngelR_summary = "";
    let dData = null;
    let cData = null;
    let eData = null;
    let cSummary = "";
    let eSummary = "";

    try {
      // ---------- Angel R ----------
      const rPayload = {
        testName,
        condition: "neuroticism",
        score_percent: percentScore,
        score_10: normalized10,
        answers: buildAnswersPayload(),
      };

      const rRes = await fetch(`${API_BASE}/api/angelR`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rPayload),
      });

      if (!rRes.ok) {
        const txt = await rRes.text();
        throw new Error(`Angel R failed: ${rRes.status} ${rRes.statusText} — ${txt}`);
      }
      const rJson = await rRes.json();
      AngelR_summary = String(rJson.result || rJson.Result || safeText(rJson)).trim();
      setResult((prev) => ({ ...prev, AngelRDiagnosis: AngelR_summary }));

      // ---------- Angel D ----------
      const dRes = await fetch(`${API_BASE}/api/angelD`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName,
          AngelR_result: AngelR_summary,
          score_percent: percentScore,
          score_10: normalized10,
        }),
      });

      if (!dRes.ok) {
        const txt = await dRes.text();
        throw new Error(`Angel D failed: ${dRes.status} ${dRes.statusText} — ${txt}`);
      }
      dData = await dRes.json();
      setResult((prev) => ({ ...prev, AngelDExplanation: dData.result || dData.Result || safeText(dData) }));

      // ---------- Angel C ----------
      const cRes = await fetch(`${API_BASE}/api/angelC`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName,
          AngelR_result: AngelR_summary,
          AngelD_result: dData.result || dData.Result || safeText(dData),
          score_percent: percentScore,
          score_10: normalized10,
          answers: buildAnswersPayload(),
        }),
      });

      if (!cRes.ok) {
        const txt = await cRes.text();
        throw new Error(`Angel C failed: ${cRes.status} ${cRes.statusText} — ${txt}`);
      }
      cData = await cRes.json();
      cSummary = cData.result || cData.Result || safeText(cData);
      setResult((prev) => ({ ...prev, AngelCComparison: cSummary }));

      // ---------- Angel E (Debate / Consensus) ----------
      const eRes = await fetch(`${API_BASE}/api/angelE`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName,
          AngelR_result: AngelR_summary,
          AngelD_result: dData.result || dData.Result || safeText(dData),
          AngelC_result: cSummary,
        }),
      });

      if (!eRes.ok) {
        const txt = await eRes.text();
        throw new Error(`Angel E failed: ${eRes.status} ${eRes.statusText} — ${txt}`);
      }
      eData = await eRes.json();
      eSummary = eData.final_consensus || eData.result || `${eData.supportive_argument || ""} ${eData.counter_argument || ""}`.trim();
      setResult((prev) => ({ ...prev, AngelEDebate: eSummary }));

      // ---------- Angel J (Judge) ----------
      const jRes = await fetch(`${API_BASE}/api/angelJ`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName,
          AngelR_result: AngelR_summary,
          AngelD_result: dData.result || dData.Result || safeText(dData),
          AngelC_result: cSummary,
          AngelE_result: eSummary,
          score_percent: percentScore,
          score_10: normalized10,
        }),
      });

      if (!jRes.ok) {
        const txt = await jRes.text();
        setResult((prev) => ({ ...prev, AngelJDecision: `⚠️ Angel J failed: ${jRes.status} ${jRes.statusText} — ${txt}` }));
      } else {
        const jData = await jRes.json();
        setResult((prev) => ({ ...prev, AngelJDecision: jData }));
      }
    } catch (err) {
      console.error("Angel chain error:", err);
      setResult((prev) => ({
        ...prev,
        chainError: err.message,
        AngelRDiagnosis: prev?.AngelRDiagnosis || "⚠️ Could not complete diagnosis chain.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserWrapper>
      <div style={styles.container}>
        {/* HEADER SECTION */}
        <div style={styles.headerContainer}>
          <img
            src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1500&q=80"
            alt="Neuroticism Test Header"
            style={styles.headerBg}
          />
          <div style={styles.headerOverlay}></div>

          <div style={styles.headerContent}>
            <h1 style={styles.mainTitle}>Neuroticism Traits</h1>
            <div style={styles.testMeta}>
              <span style={styles.metaBtnOrange}>✔ {questions.length} QUESTIONS</span>
              <span style={styles.metaBtnPink}>⏱ 3 MINUTES</span>
            </div>
          </div>
        </div>

        {/* SUBSECTION */}
        <div style={styles.subSection}>
          <h2 style={styles.subTitle}>How emotionally stable are you?</h2>
          <p style={styles.subDesc}>
            Neuroticism affects how often you experience negative emotions (anxiety, irritability, worry).
            This quick check assesses emotional stability — consider professional support if results are concerning.
          </p>
          {!started && (
            <button style={styles.startButton} onClick={() => setStarted(true)}>
              🚀 Start Test
            </button>
          )}
        </div>

        {/* TEST SECTION */}
        {started && (
          <>
            <div style={styles.scaleBar}>
              <span style={styles.scaleText}>STRONGLY DISAGREE</span>
              <span style={styles.scaleText}>NEUTRAL</span>
              <span style={styles.scaleText}>STRONGLY AGREE</span>
            </div>

            <div style={styles.questionList}>
              {questions.map((q, i) => (
                <div key={i} style={styles.questionBlock}>
                  <h3 style={styles.questionText}>
                    {i + 1}. {q}
                  </h3>
                  <div style={styles.circleRow}>
                    {colors.map((color, j) => (
                      <button
                        key={j}
                        onClick={() => handleSelect(i, j + 1)} // store 1..5
                        type="button"
                        aria-pressed={answers[i] === j + 1}
                        style={{
                          ...styles.circle,
                          borderColor: color,
                          backgroundColor: answers[i] === j + 1 ? color : "transparent",
                        }}
                      />
                    ))}
                  </div>
                  <div style={styles.labelRow}>
                    <span style={styles.labelLeft}>DISAGREE</span>
                    <span style={styles.labelRight}>AGREE</span>
                  </div>
                  {i < questions.length - 1 && <div style={styles.divider}></div>}
                </div>
              ))}
            </div>

            <button onClick={handleSubmit} style={styles.submitButton} disabled={loading}>
              {loading ? "Analyzing..." : "Submit Test"}
            </button>

            {result && (
              <div style={styles.resultBox}>
                {result.scorePercent !== null && (
                  <p style={styles.resultScore}>Your Neuroticism Score: {result.scorePercent}/100</p>
                )}
                {/* <p style={styles.resultText}>{result.level}</p> */}

                {result.AngelRDiagnosis && (
                  <div style={{ marginTop: 10, fontSize: 16, color: "#444", textAlign: "left", padding: "10px", backgroundColor: "white", borderRadius: "8px", marginBottom: 10 }}>
                    <strong style={{ color: "#e74c3c" }}>🧠 Angel R (Researcher) - Diagnosis:</strong> {result.AngelRDiagnosis}
                  </div>
                )}

                {result.AngelDExplanation && (
                  <div style={{ marginTop: 10, fontSize: 16, color: "#444", textAlign: "left", padding: "10px", backgroundColor: "white", borderRadius: "8px", marginBottom: 10 }}>
                    <strong style={{ color: "#3498db" }}>📚 Angel D (Diagnostician) - Summary:</strong> {result.AngelDExplanation}
                  </div>
                )}

                {result.AngelCComparison && (
                  <div style={{ marginTop: 10, fontSize: 16, color: "#444", textAlign: "left", padding: "10px", backgroundColor: "white", borderRadius: "8px", marginBottom: 10 }}>
                    <strong style={{ color: "#9b59b6" }}>⚖️ Angel C (Comparator) - Analysis:</strong> {result.AngelCComparison}
                  </div>
                )}

                {result.AngelEDebate && (
                  <div style={{ marginTop: 10, fontSize: 16, color: "#444", textAlign: "left", padding: "10px", backgroundColor: "white", borderRadius: "8px", marginBottom: 10 }}>
                    <strong style={{ color: "#f39c12" }}>🎭 Angel E (Evaluator) - Debate:</strong> {result.AngelEDebate}
                  </div>
                )}

                {result.AngelJDecision && (
                  <div style={{ marginTop: "12px", textAlign: "left", color: "#444" }}>
                    <strong>Angel J (Judge) Decision:</strong>
                    {typeof result.AngelJDecision === "string" ? (
                      <div style={{ marginTop: "6px" }}>{result.AngelJDecision}</div>
                    ) : (
                      <div style={{ marginTop: "8px" }}>
                        {result.AngelJDecision.decision && (
                          <div>
                            <strong>Decision:</strong> {result.AngelJDecision.decision}
                          </div>
                        )}

                        {result.AngelJDecision.confidence !== undefined && (
                          <div>
                            <strong>Confidence:</strong> {String(result.AngelJDecision.confidence)}
                          </div>
                        )}

                        {result.AngelJDecision.reasoning && (
                          <div style={{ marginTop: "6px" }}>
                            <strong>Reasoning:</strong> {result.AngelJDecision.reasoning}
                          </div>
                        )}

                        {Array.isArray(result.AngelJDecision.actions) &&
                          result.AngelJDecision.actions.length > 0 && (
                            <div style={{ marginTop: "6px" }}>
                              <strong>Actions:</strong>
                              <ul style={{ marginTop: "6px" }}>
                                {result.AngelJDecision.actions.map((a, idx) => (
                                  <li key={idx}>{a}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {/* ⭐ FINAL CALL ADDED HERE ⭐ */}
                        {result.AngelJDecision.final_call && (
                          <div style={{ marginTop: "10px", fontSize: "17px", fontWeight: "600", color: "#111" }}>
                            <strong>Final Judgment:</strong> {result.AngelJDecision.final_call}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}


                {result.chainError && (
                  <p style={{ marginTop: 10, color: "#b91c1c" }}>
                    <strong>Chain error:</strong> {result.chainError}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </UserWrapper>
  );
}

/* ------------------- STYLES ------------------- */
const styles = {
  container: {
    background: "rgba(255,255,255,0.95)",
    width: "100vw",
    maxWidth: "100%",
    margin: "0",
    padding: "0 0 60px",
    fontFamily: "'Poppins', sans-serif",
    textAlign: "center",
  },
  headerContainer: {
    position: "relative",
    textAlign: "center",
    color: "#fff",
    overflow: "hidden",
  },
  headerBg: {
    width: "100%",
    height: "450px",
    objectFit: "cover",
  },
  headerOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
  },
  headerContent: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  mainTitle: {
    fontSize: "68px",
    fontWeight: "900",
    marginBottom: "25px",
    letterSpacing: "1px",
    textShadow: "2px 4px 10px rgba(0,0,0,0.6)",
  },
  testMeta: {
    display: "flex",
    justifyContent: "center",
    gap: "18px",
  },
  metaBtnOrange: {
    background: "rgba(249,115,22,0.9)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "25px",
    fontWeight: "600",
    fontSize: "14px",
    backdropFilter: "blur(6px)",
  },
  metaBtnPink: {
    background: "rgba(236,72,153,0.9)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "25px",
    fontWeight: "600",
    fontSize: "14px",
    backdropFilter: "blur(6px)",
  },
  subSection: {
    background: "linear-gradient(180deg, #243cc9, #4169e1)",
    color: "#fff",
    padding: "40px 20px 60px",
    clipPath: "ellipse(120% 65% at 50% 25%)",
  },
  subTitle: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "12px",
  },
  subDesc: {
    fontSize: "16px",
    lineHeight: "1.7",
    maxWidth: "700px",
    margin: "0 auto 20px",
  },
  startButton: {
    background: "#7b61ff",
    color: "#fff",
    border: "none",
    borderRadius: "30px",
    padding: "14px 40px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
    boxShadow: "0 6px 14px rgba(123,97,255,0.3)",
  },
  scaleBar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(90deg, #ef4444, #f59e0b, #3b82f6, #22c55e)",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px 0",
    margin: "50px auto",
    width: "90%",
    fontWeight: "600",
    fontSize: "14px",
    gap: "60px",
  },
  scaleText: { textShadow: "0 1px 2px rgba(0,0,0,0.2)" },
  questionList: { marginTop: "20px", width: "90%", marginLeft: "auto", marginRight: "auto" },
  questionBlock: { marginBottom: "45px" },
  questionText: {
    fontSize: "18px",
    color: "#333",
    marginBottom: "25px",
    fontWeight: "600",
  },
  circleRow: { display: "flex", justifyContent: "center", gap: "30px", marginBottom: "10px" },
  circle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "3px solid #ccc",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  labelRow: { display: "flex", justifyContent: "space-between", width: "320px", margin: "8px auto" },
  labelLeft: { color: "#555", fontSize: "14px", fontWeight: "600" },
  labelRight: { color: "#555", fontSize: "14px", fontWeight: "600" },
  divider: { borderBottom: "1px solid #e5e7eb", width: "90%", margin: "35px auto" },
  submitButton: {
    display: "block",
    margin: "40px auto 0",
    backgroundColor: "#7b61ff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px 40px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(123,97,255,0.3)",
  },
  resultBox: {
    marginTop: "40px",
    backgroundColor: "#f3f4f6",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "80%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  resultScore: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#333",
    marginBottom: "8px",
  },
  resultText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#7b61ff",
  },
};
