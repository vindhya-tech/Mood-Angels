import React, { useState } from "react";
import UserWrapper from "../../components/UserWrapper";

export default function AnxietyTest() {
  const API_BASE = "http://localhost:5000";
  const testName = "Anxiety (GAD)";

 
  const questions = [
    "I often feel tense, nervous, or on edge — even when there’s no clear reason.",
    "I worry a lot about different things, even small ones that others might not think about.",
    "I find it hard to control or stop my worrying once it starts.",
    "I often feel restless, like I can’t sit still or relax fully.",
    "I get tired easily because my mind is constantly racing with worries.",
    "I notice physical tension in my body, such as tight shoulders or jaw clenching.",
    "I sometimes experience a pounding heart, sweating, or trembling when I feel anxious.",
    "I often overthink past situations or replay conversations in my head.",
    "I have trouble falling asleep or staying asleep because my thoughts keep me awake.",
    "I feel easily startled or jumpy when something unexpected happens.",
    "I find it difficult to concentrate when I’m worried about something else.",
    "I tend to imagine the worst possible outcomes, even in ordinary situations.",
    "I feel like I have to be constantly prepared for something bad to happen.",
    "I sometimes feel lightheaded, dizzy, or short of breath when I’m anxious.",
    "I get irritable or snappy when I’m feeling tense or under stress.",
    "I worry that I might lose control or embarrass myself in front of others.",
    "I find it hard to enjoy life because I’m always thinking about what could go wrong.",
    "I sometimes feel detached or spaced out when I’m overwhelmed by anxiety.",
    "I notice that my anxiety gets in the way of work, relationships, or daily tasks.",
    "Even on calm days, I feel a sense of unease, like something bad could happen soon."
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

  const computeScore = () => {
    // answers are 0..(colors.length-1). Compute percent 0..100
    const rawScore = answers.reduce((a, v) => a + v, 0);
    const maxChoice = colors.length - 1; // e.g., 4 if choices 0..4
    const maxPossible = questions.length * maxChoice;
    if (maxPossible === 0) return 0;
    return Math.round((rawScore / maxPossible) * 100);
  };

  const interpretLevel = (score) =>
    score <= 19
      ? "Low chance"
      : score <= 50
      ? "Moderate chance"
      : score <= 74
      ? "Some concern (monitor symptoms)"
      : score <= 86
      ? "Significant concern"
      : "High likelihood";

  // ---- Submit & Call Angels (R → D → C → E → J) ----
  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      setResult({
        score: null,
        level: "Please answer all questions before submitting!"
      });
      return;
    }

    const score = computeScore();
    const level = interpretLevel(score);

    setResult({ score, level });
    setLoading(true);

    // intermediate holders
    let finalSummary = "";
    let dData = null;
    let cData = null;
    let eData = null;
    let cSummary = "";
    let eSummary = "";

    try {
      // ---------- Angel R ----------
      const payloadR = {
        condition: testName,
        testName,
        score,
        level,
        answers: buildAnswersPayload()
      };

      const rRes = await fetch(`${API_BASE}/api/angelR`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadR)
      });

      if (!rRes.ok) {
        const errText = await rRes.text();
        throw new Error(`Angel R failed: ${rRes.status} ${rRes.statusText} — ${errText}`);
      }
      const rData = await rRes.json();
      finalSummary = String(rData.result || rData.Result || "").trim();
      setResult((prev) => ({ ...prev, aiDiagnosis: finalSummary }));

      // ---------- Angel D ----------
      const dRes = await fetch(`${API_BASE}/api/angelD`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: testName,
          testName,
          AngelR_result: finalSummary,
          score,
          level
        })
      });

      if (!dRes.ok) {
        const txt = await dRes.text();
        throw new Error(`Angel D failed: ${dRes.status} ${dRes.statusText} — ${txt}`);
      }
      dData = await dRes.json();
      setResult((prev) => ({ ...prev, AngelDExplanation: dData.result || dData.Result || String(dData) }));

      // ---------- Angel C ----------
      const cRes = await fetch(`${API_BASE}/api/angelC`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: testName,
          testName,
          AngelR_result: finalSummary,
          AngelD_result: dData.result || dData.Result || String(dData),
          score,
          level,
          answers: buildAnswersPayload()
        })
      });

      if (!cRes.ok) {
        const txt = await cRes.text();
        throw new Error(`Angel C failed: ${cRes.status} ${cRes.statusText} — ${txt}`);
      }
      cData = await cRes.json();
      cSummary = cData.result || cData.Result || String(cData).trim();
      setResult((prev) => ({ ...prev, AngelCComparison: cSummary }));

      // ---------- Angel E (Debate & Consensus) ----------
      const eRes = await fetch(`${API_BASE}/api/angelE`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: testName,
          testName,
          AngelR_result: finalSummary,
          AngelD_result: dData.result || dData.Result || String(dData),
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
      try {
        const jRes = await fetch(`${API_BASE}/api/angelJ`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            condition: testName,
            testName,
            AngelR_result: finalSummary,
            AngelD_result: dData.result || dData.Result || String(dData),
            AngelC_result: cSummary,
            AngelE_result: eSummary,
            score,
            level
          })
        });

        if (!jRes.ok) {
          const txt = await jRes.text();
          setResult((prev) => ({
            ...prev,
            AngelJDecision: `⚠️ Angel J failed: ${jRes.status} ${jRes.statusText} — ${txt}`
          }));
        } else {
          const jData = await jRes.json();
          setResult((prev) => ({ ...prev, AngelJDecision: jData }));
        }
      } catch (err) {
        console.error("Angel J connection error:", err);
        setResult((prev) => ({ ...prev, AngelJDecision: "⚠️ Could not connect to Angel J backend." }));
      }
    } catch (err) {
      console.error("Angel chain error:", err);
      setResult((prev) => ({
        ...prev,
        aiDiagnosis: prev?.aiDiagnosis || "⚠️ Could not complete diagnosis chain.",
        chainError: err.message
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
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm9zTAsgnraDUhTdbVTmv3qE_klqTQbh4Zvw&s"
            alt="GAD Test Header"
            style={styles.headerBg}
          />
          <div style={styles.headerOverlay}></div>

          <div style={styles.headerContent}>
            <h1 style={styles.mainTitle}>Generalized Anxiety Disorder</h1>
            <div style={styles.testMeta}>
              <span style={styles.metaBtnOrange}>✔ {questions.length} QUESTIONS</span>
              <span style={styles.metaBtnPink}>⏱ 3 MINUTES</span>
            </div>
          </div>
        </div>

        {/* SUBSECTION */}
        <div style={styles.subSection}>
          <h2 style={styles.subTitle}>Are your worries taking over?</h2>
          <p style={styles.subDesc}>
            Worry is normal, but when it becomes persistent and causes physical or functional
            problems it may indicate generalized anxiety. This quick test helps flag possible
            symptoms — not a diagnosis.
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
                        style={{
                          ...styles.circle,
                          borderColor: color,
                          backgroundColor: answers[i] === j ? color : "transparent"
                        }}
                        aria-pressed={answers[i] === j}
                        aria-label={`answer-${i + 1}-${j}`}
                        type="button"
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

            {/* SUBMIT BUTTON */}
            <button onClick={handleSubmit} style={styles.submitButton} disabled={loading}>
              {loading ? "Analyzing..." : "Submit Test"}
            </button>

            {/* RESULTS */}
            {result && (
              <div style={styles.resultBox}>
                {result.score !== null && (
                  <p style={styles.resultScore}>Your Anxiety Score: {result.score}/100</p>
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

                {/* Angel J output render */}
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


                {/* show chain error when present for debugging */}
                {result.chainError && (
                  <p style={{ marginTop: "10px", color: "#b91c1c" }}>
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
    marginTop: "12px",
    fontSize: "16px",
    color: "#444",
    lineHeight: "1.6"
  }
};
