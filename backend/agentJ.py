#!/usr/bin/env python3
# agentJ.py — Judge agent: produce a clinical diagnosis-style decision (NO references to other agents)

import sys
import json
import os
import traceback
from dotenv import load_dotenv

load_dotenv()
# Don't initialize client here - do it only when needed

def sanitize_string(s: str) -> str:
    if not isinstance(s, str):
        return s
    out = []
    for ch in s:
        cp = ord(ch)
        # replace lone surrogates with replacement char
        if 0xD800 <= cp <= 0xDFFF:
            out.append("\uFFFD")
        else:
            out.append(ch)
    return "".join(out)

def sanitize_obj(obj):
    if isinstance(obj, str):
        return sanitize_string(obj)
    if isinstance(obj, dict):
        return {sanitize_string(k): sanitize_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_obj(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(sanitize_obj(v) for v in obj)
    return obj

def safe_print_json(obj):
    try:
        sys.stdout.buffer.write(json.dumps(obj, ensure_ascii=False).encode("utf-8", "replace"))
    except Exception:
        sys.stdout.write(json.dumps({"error": "print_failed", "preview": str(obj)}))

def deterministic_judgment(score, level, condition):
    """Fallback: generate a clinical judgment without OpenAI."""
    try:
        s = float(score) if score else 0
    except Exception:
        s = 0
    
    if s >= 75:
        decision = "Likely"
        confidence = 0.75
        reasoning = f"The score of {s} and level '{level}' indicate significant symptomatology consistent with {condition}. Professional evaluation is recommended for confirmation and treatment planning."
    elif s >= 50:
        decision = "Possible"
        confidence = 0.6
        reasoning = f"The score of {s} suggests moderate concern. Further professional assessment is needed to determine if {condition} is present or if symptoms relate to other factors."
    else:
        decision = "Unlikely"
        confidence = 0.5
        reasoning = f"The score of {s} suggests lower likelihood of {condition}, though individual assessment by a professional may still be warranted."
    
    return {
        "decision": decision,
        "confidence": confidence,
        "reasoning": reasoning,
        "actions": ["Schedule consultation with mental health provider", "Monitor symptoms regularly"],
        "final_call": f"Preliminary assessment: {decision} for {condition} based on available data. Professional evaluation recommended."
    }

def extract_text(resp):
    # Best-effort to get text from the Responses SDK object
    try:
        out = getattr(resp, "output_text", None)
        if out and isinstance(out, str):
            return out.strip()
    except Exception:
        pass
    try:
        if isinstance(resp, dict) and resp.get("output_text"):
            return str(resp.get("output_text")).strip()
    except Exception:
        pass
    try:
        s = str(resp)
        return s.strip()
    except Exception:
        return ""

def build_clinical_context(data):
    """Return a short plain-text clinical context summarizing score, level, condition, family history, and key responses."""
    score = data.get("score")
    level = data.get("level", "")
    condition = data.get("condition", "")  # optional: e.g., "Bipolar Disorder"
    answers = data.get("answers", {})  # dict of Q#: "Question -> Answer"
    # Pull brief symptom highlights from answers: keep only yes/agree answers (values > 2) if numeric, else include non-empty
    highlights = []
    if isinstance(answers, dict):
        for k, v in list(answers.items())[:50]:
            # v might be "Question → Answer: X" or a number
            try:
                # if format "Question → Answer: value"
                if isinstance(v, str) and "→ Answer:" in v:
                    # try to extract numeric value at end
                    parts = v.split("→ Answer:")
                    q_text = parts[0].strip()
                    a_text = parts[1].strip()
                    highlights.append(f"{q_text} — {a_text}")
                else:
                    highlights.append(f"{k}: {v}")
            except Exception:
                highlights.append(f"{k}: {v}")
    if not highlights:
        highlights_text = "No symptom detail provided."
    else:
        # limit to first 7 highlights
        highlights_text = "\n".join(highlights[:7])
    ctx = f"Condition (if known): {condition}\nNumeric score: {score}\nLevel: {level}\nKey self-report highlights:\n{highlights_text}"
    return ctx

def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw or "{}")
    except Exception as e:
        safe_print_json({"error": "invalid_json", "details": str(e)})
        return

    # sanitize input fields
    data = sanitize_obj(data)

    # Build a clinical-only prompt (explicitly forbid referencing other agents)
    clinical_context = build_clinical_context(data)
    prompt = f"""
You are a clinical reasoning assistant producing a concise, medical-style diagnostic judgment.
Do NOT mention or refer to any other agent names, system internals, or tooling. Use only the clinical data (score, level, condition if provided, family history, and the patient's self-report highlights) to produce medical reasoning.

Context:
{clinical_context}

Task:
1) Give a short diagnostic decision label in plain language (one of: "Likely", "Possible", or "Unlikely"). 
   - Do NOT use "Insufficient evidence" or any wording that implies lack of information.

2) Provide a confidence score as a decimal between 0.0 and 1.0.

3) Explain the medical reasoning in 2–3 brief sentences.
   - The reasoning must be decisive.
   - You MUST NOT use phrases such as:
     "insufficient information", 
     "not enough data",
     "lack of symptoms",
     "lack of evidence",
     "cannot determine",
     "unclear",
     or any equivalent.
   - Always produce a clear, clinically grounded explanation using whatever information is available (score, level, symptoms, highlights).

4) Recommend 0–3 concrete next actions (short phrases).

5) Produce a “final_call” field — a single sentence summarizing the overall judgment in simple clinical language.

Constraints:
- Output only valid JSON (no surrounding markdown, no extra text).
- JSON keys must be: decision, confidence, reasoning, actions, final_call.
- Keep reasoning clinical and non-alarmist.
- Do not say "ask another agent" or mention other agents.
- DO NOT imply insufficient information anywhere in the response.
"""



    messages = [
        {"role": "system", "content": "You are a concise clinical diagnostician. Focus on medical reasoning only."},
        {"role": "user", "content": prompt}
    ]

    # Check if API key exists before attempting API call
    if not os.getenv("OPENAI_API_KEY"):
        fallback = deterministic_judgment(data.get("score"), data.get("level", ""), data.get("condition", "the condition"))
        safe_print_json(fallback)
        return

    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        resp = client.responses.create(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            input=messages,
            max_output_tokens=300
        )

        out_text = extract_text(resp)
        # strip fencing if any
        text = out_text.strip()
        if text.startswith("```"):
            parts = text.split("\n")
            if parts[0].startswith("```"):
                parts = parts[1:]
            if parts and parts[-1].strip().startswith("```"):
                parts = parts[:-1]
            text = "\n".join(parts).strip()

        # Try parse JSON strictly
        parsed = None
        try:
            parsed = json.loads(text)
        except Exception:
            # If the model didn't produce JSON, craft a fallback with the raw reasoning in 'reasoning'
            parsed = {
            "decision": "Possible",
            "confidence": 0.0,
            "reasoning": sanitize_string(text),
            "actions": [],
            "final_call": "Final assessment: Possible, based on limited extracted reasoning."
        }


        parsed = sanitize_obj(parsed)
        # Normalize confidence to float between 0 and 1 if provided as percent/string
        conf = parsed.get("confidence")
        try:
            if isinstance(conf, str):
                c = conf.strip().rstrip("%")
                parsed["confidence"] = max(0.0, min(1.0, float(c) / 100.0 if "%" in conf or float(c) > 1.0 else float(c)))
            elif isinstance(conf, (int, float)):
                val = float(conf)
                if val > 1.0:
                    parsed["confidence"] = max(0.0, min(1.0, val / 100.0))
                else:
                    parsed["confidence"] = max(0.0, min(1.0, val))
            else:
                parsed["confidence"] = 0.0
        except Exception:
            parsed["confidence"] = 0.0
        
        if "final_call" not in parsed:
            parsed["final_call"] = f"Final assessment: {parsed.get('decision', 'Possible')}."


        safe_print_json(parsed)

    except Exception as e:
        tb = traceback.format_exc()
        score = data.get("score")
        level = data.get("level", "")
        condition = data.get("condition", "the condition")
        fallback = deterministic_judgment(score, level, condition)
        fallback["warning"] = "openai_unavailable"
        fallback["details"] = str(e)
        safe_print_json(fallback)

if __name__ == "__main__":
    main()
