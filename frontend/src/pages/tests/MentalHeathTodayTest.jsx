import React, { useState } from "react";
import UserWrapper from "../../components/UserWrapper";

export default function MentalHealthTodayTest() {
  const API_BASE = "http://localhost:5000";
  const testName = "Mental Health Today";

 
  const questions = [
    "I often feel overwhelmed by my emotions.",
    "I can usually handle the amount of stress in my life.",
    "I sometimes notice physical signs of anxiety, such as tense muscles or sweaty palms.",
    "I have close, supportive relationships with people I care about.",
    "I regret some of my past decisions and think about them often.",
    "I tend to be very self-critical or hard on myself.",
    "I still struggle with painful experiences or losses from the past.",
    "I can recognize and express my emotions in a healthy way.",
    "I believe the people close to me will support me if I open up to them.",
    "I sometimes engage in habits that make it harder to function at my best.",
    "When I feel strong emotions, I usually understand what triggered them.",
    "My mood stays fairly steady from day to day.",
    "I often avoid or put off important tasks, even when I know I shouldn’t.",
    "I feel sad or down more often than I’d like to.",
    "I have a sense of meaning or purpose in my life.",
    "I sometimes feel lonely or disconnected from others.",
    "I get frustrated, upset, or angry easily.",
    "My sleep or appetite has changed compared to when I felt at my best.",
    "I can recover from challenges or setbacks without too much difficulty.",
    "Most days, I manage my time and responsibilities fairly well."
  ];

  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = ["#ef4444", "#f97316", "#facc15", "#3b82f6", "#22c55e"];

  const handleSelect = (qIndex, value) => {
    if (qIndex < 0 || qIndex >= questions.length) return;
    const updated = [...answers];
    updated[qIndex] = value;
    setAnswers(updated);
  };

  const buildAnswersPayload = () =>
    questions.reduce((acc, q, i) => {
      acc[`Q${i + 1}`] = `${q} → Answer: ${answers[i]}`;
      return acc;
    }, {});

  // compute normalized 0-10 score (answers are 0..4)
  const computeNormalized10 = () => {
    const raw = answers.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
    const maxRaw = questions.length * 4; // each item max 4
    if (maxRaw === 0) return 0;
    const normalized = (raw / maxRaw) * 10;
    return Math.round(normalized * 10) / 10; // one decimal
  };

  const interpretLevel = (norm10) => {
    if (norm10 < 3.3) return "You appear to be coping well overall.";
    if (norm10 < 6.6) return "You show some signs of emotional distress — consider healthy coping strategies.";
    return "You may be experiencing significant stress or emotional challenges. Seeking professional help could be beneficial.";
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
        level: "Please answer all questions before submitting!"
      });
      return;
    }

    setLoading(true);
    const normalizedScore = computeNormalized10();
    const level = interpretLevel(normalizedScore);
    // also provide percent for Angels (0-100)
    const percentScore = Math.round((normalizedScore / 10) * 100);

    // show immediate local result
    setResult({ score: normalizedScore, level });

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
        condition: testName,
        testName,
        score_percent: percentScore,
        normalized_score: normalizedScore,
        answers: buildAnswersPayload()
      };

      const rRes = await fetch(`${API_BASE}/api/angelR`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rPayload)
      });

      if (!rRes.ok) {
        const txt = await rRes.text();
        throw new Error(`Angel R failed: ${rRes.status} ${rRes.statusText} — ${txt}`);
      }
      const rJson = await rRes.json();
      AngelR_summary = String(rJson.result || rJson.Result || safeText(rJson)).trim();
      setResult((prev) => ({ ...prev, aiDiagnosis: AngelR_summary }));

      // ---------- Angel D ----------
      const dRes = await fetch(`${API_BASE}/api/angelD`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: testName,
          testName,
          AngelR_result: AngelR_summary,
          score_percent: percentScore,
          normalized_score: normalizedScore
        })
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
          condition: testName,
          testName,
          AngelR_result: AngelR_summary,
          AngelD_result: dData.result || dData.Result || safeText(dData),
          score_percent: percentScore,
          normalized_score: normalizedScore,
          answers: buildAnswersPayload()
        })
      });

      if (!cRes.ok) {
        const txt = await cRes.text();
        throw new Error(`Angel C failed: ${cRes.status} ${cRes.statusText} — ${txt}`);
      }
      cData = await cRes.json();
      cSummary = cData.result || cData.Result || safeText(cData);
      setResult((prev) => ({ ...prev, AngelCComparison: cSummary }));

      // ---------- Angel E (Debate/Consensus) ----------
      const eRes = await fetch(`${API_BASE}/api/angelE`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: testName,
          testName,
          AngelR_result: AngelR_summary,
          AngelD_result: dData.result || dData.Result || safeText(dData),
          AngelC_result: cSummary
        })
      });

      if (!eRes.ok) {
        const txt = await eRes.text();
        throw new Error(`Angel E failed: ${eRes.status} ${eRes.statusText} — ${txt}`);
      }
      eData = await eRes.json();
      eSummary =
        eData.final_consensus ||
        eData.result ||
        `${eData.supportive_argument || ""} ${eData.counter_argument || ""}`.trim();
      setResult((prev) => ({ ...prev, AngelEDebate: eSummary }));

      // ---------- Angel J (Judge) ----------
      const jRes = await fetch(`${API_BASE}/api/angelJ`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: testName,
          testName,
          AngelR_result: AngelR_summary,
          AngelD_result: dData.result || dData.Result || safeText(dData),
          AngelC_result: cSummary,
          AngelE_result: eSummary,
          score_percent: percentScore,
          normalized_score: normalizedScore
        })
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
        aiDiagnosis: prev?.aiDiagnosis || "⚠️ Could not complete diagnosis chain."
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
            alt="Mental Health Test Header"
            style={styles.headerBg}
          />
          <div style={styles.headerOverlay}></div>

          <div style={styles.headerContent}>
            <h1 style={styles.mainTitle}>Your Mental Health Today</h1>
            <div style={styles.testMeta}>
              <span style={styles.metaBtnOrange}>✔ {questions.length} QUESTIONS</span>
              <span style={styles.metaBtnPink}>⏱ 3 MINUTES</span>
            </div>
          </div>
        </div>

        {/* SUBSECTION */}
        <div style={styles.subSection}>
          <h2 style={styles.subTitle}>How well do you cope?</h2>
          <p style={styles.subDesc}>
            This quick check helps you see how you're coping day to day. If results are concerning, consider reaching out to a clinician.
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
            {/* SCALE BAR */}
            <div style={styles.scaleBar}>
              <span style={styles.scaleText}>STRONGLY DISAGREE</span>
              <span style={styles.scaleText}>NEUTRAL</span>
              <span style={styles.scaleText}>STRONGLY AGREE</span>
            </div>

            {/* QUESTIONS */}
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
                        onClick={() => handleSelect(i, j)}
                        type="button"
                        aria-pressed={answers[i] === j}
                        style={{
                          ...styles.circle,
                          borderColor: color,
                          backgroundColor: answers[i] === j ? color : "transparent"
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

            {/* SUBMIT */}
            <button onClick={handleSubmit} style={styles.submitButton} disabled={loading}>
              {loading ? "Analyzing..." : "Submit Test"}
            </button>

            {/* RESULTS */}
            {result && (
              <div style={styles.resultBox}>
                {result.score !== null && (
                  <p style={styles.resultScore}>Your Coping Score: {result.score} / 10</p>
                )}
                {/* <p style={styles.resultText}>{result.level}</p> */}

                {result.aiDiagnosis && (
                  <div style={{ marginTop: 10, fontSize: 16, color: "#444", textAlign: "left", padding: "10px", backgroundColor: "white", borderRadius: "8px", marginBottom: 10 }}>
                    <strong style={{ color: "#e74c3c" }}>🧠 Angel R (Researcher) - Diagnosis:</strong> {result.aiDiagnosis}
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

/* ------------------- INLINE STYLES ------------------- */
const styles = {
  container: {
    background: "rgba(255,255,255,0.95)",
    width: "100vw",
    maxWidth: "100%",
    margin: "0",
    padding: "0 0 60px",
    fontFamily: "'Poppins', sans-serif",
    textAlign: "center"
  },
  headerContainer: {
    position: "relative",
    textAlign: "center",
    color: "#fff",
    overflow: "hidden"
  },
  headerBg: {
    width: "100%",
    height: "450px",
    objectFit: "cover"
  },
  headerOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.3), rgba(0,0,0,0.7))"
  },
  headerContent: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)"
  },
  mainTitle: {
    fontSize: "68px",
    fontWeight: "900",
    marginBottom: "25px",
    letterSpacing: "1px",
    textShadow: "2px 4px 10px rgba(0,0,0,0.6)"
  },
  testMeta: {
    display: "flex",
    justifyContent: "center",
    gap: "18px"
  },
  metaBtnOrange: {
    background: "rgba(249,115,22,0.9)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "25px",
    fontWeight: "600",
    fontSize: "14px",
    backdropFilter: "blur(6px)"
  },
  metaBtnPink: {
    background: "rgba(236,72,153,0.9)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "25px",
    fontWeight: "600",
    fontSize: "14px",
    backdropFilter: "blur(6px)"
  },
  subSection: {
    background: "linear-gradient(180deg, #243cc9, #4169e1)",
    color: "#fff",
    padding: "40px 20px 60px",
    clipPath: "ellipse(120% 65% at 50% 25%)"
  },
  subTitle: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "12px"
  },
  subDesc: {
    fontSize: "16px",
    lineHeight: "1.7",
    maxWidth: "700px",
    margin: "0 auto 20px"
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
    transition: "all 0.3s ease"
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
    gap: "60px"
  },
  scaleText: {
    textShadow: "0 1px 2px rgba(0,0,0,0.2)"
  },
  questionList: {
    marginTop: "20px",
    width: "90%",
    marginLeft: "auto",
    marginRight: "auto"
  },
  questionBlock: {
    marginBottom: "45px"
  },
  questionText: {
    fontSize: "18px",
    color: "#333",
    marginBottom: "25px",
    fontWeight: "600"
  },
  circleRow: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    marginBottom: "10px"
  },
  circle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "3px solid #ccc",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    width: "320px",
    margin: "8px auto"
  },
  labelLeft: { color: "#555", fontSize: "14px", fontWeight: "600" },
  labelRight: { color: "#555", fontSize: "14px", fontWeight: "600" },
  divider: {
    borderBottom: "1px solid #e5e7eb",
    width: "90%",
    margin: "35px auto"
  },
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
    transition: "transform 0.2s ease, box-shadow 0.2s ease"
  },
  resultBox: {
    marginTop: "40px",
    backgroundColor: "#f3f4f6",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "80%",
    marginLeft: "auto",
    marginRight: "auto"
  },
  resultScore: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#333",
    marginBottom: "8px"
  },
  resultText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#7b61ff"
  },
  AngelRText: {
    marginTop: 12,
    fontSize: 16,
    color: "#444"
  }
};
