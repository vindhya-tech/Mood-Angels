#!/usr/bin/env python3
# agentC.py — Agent C: comparative summarizer with sanitization, markdown cleanup, and robust output.

import sys
import json
import os
import re
import traceback
from dotenv import load_dotenv

load_dotenv()
# Don't initialize client here - do it only when needed


# =================== UTF-8 & STRUCTURE SANITIZERS ===================

def sanitize_string(s: str) -> str:
    """Replace lone UTF-16 surrogate code units with safe Unicode."""
    if not isinstance(s, str):
        return s
    return "".join(ch if not 0xD800 <= ord(ch) <= 0xDFFF else "\uFFFD" for ch in s)

def sanitize_obj(obj):
    """Recursively sanitize strings inside dicts/lists."""
    if isinstance(obj, str):
        return sanitize_string(obj)
    if isinstance(obj, dict):
        return {sanitize_string(k): sanitize_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_obj(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(sanitize_obj(v) for v in obj)
    return obj

def safe_json_output(obj):
    """Safely write JSON as UTF-8 bytes (no surrogate errors)."""
    try:
        sys.stdout.buffer.write(json.dumps(obj, ensure_ascii=False).encode("utf-8", "replace"))
    except Exception:
        sys.stdout.write(json.dumps({"error": "json_dump_failed"}))

def deterministic_comparison(agentR_result, agentD_result, score):
    """Fallback: generate a comparison summary without OpenAI."""
    if not agentR_result and not agentD_result:
        return "Based on the assessment, professional evaluation is recommended to clarify findings."
    
    r_summary = agentR_result[:80] if agentR_result else "findings"
    d_summary = agentD_result[:80] if agentD_result else "assessment"
    
    if score and float(score) > 70:
        return f"Both Agent R ({r_summary}) and Agent D ({d_summary}) indicate significant concern. Professional mental health consultation is strongly recommended."
    elif score and float(score) > 40:
        return f"Agent R found {r_summary} while Agent D noted {d_summary}. These findings suggest monitoring and potential professional consultation would be helpful."
    else:
        return f"Agent R's assessment: {r_summary}. Agent D's perspective: {d_summary}. Continued self-awareness and routine check-ins are recommended."


# =================== OPENAI RESPONSE PARSING ===================

def extract_text_from_resp(resp):
    """Robustly extract text from OpenAI Responses API result."""
    try:
        out = getattr(resp, "output_text", None)
        if isinstance(out, str) and out.strip():
            return out.strip()
    except Exception:
        pass

    try:
        if isinstance(resp, dict) and resp.get("output_text"):
            return str(resp.get("output_text")).strip()
    except Exception:
        pass

    try:
        if hasattr(resp, "to_dict"):
            d = resp.to_dict()
            if "output_text" in d:
                return d["output_text"]
    except Exception:
        pass

    return str(resp)


# =================== MAIN EXECUTION ===================

def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw or "{}")
    except Exception as e:
        safe_json_output({"error": "invalid_json", "details": str(e)})
        return

    agentR_result = data.get("agentR_result", "")
    agentD_result = data.get("agentD_result", "")
    score = data.get("score")
    level = data.get("level", "")
    answers = data.get("answers", {})

    if not any([agentR_result, agentD_result, answers]):
        safe_json_output({
            "error": "no_context_provided",
            "details": "Need at least one of agentR_result, agentD_result, or answers."
        })
        return

    # Format answers
    if isinstance(answers, dict) and answers:
        formatted_answers = "\n".join([f"{k}: {v}" for k, v in answers.items()])
    else:
        formatted_answers = "No detailed responses provided."

    prompt = f"""
You are Agent C, an AI comparative reasoning assistant.
Integrate and summarize the diagnostic findings concisely.

Context:
- Agent R finding: "{agentR_result}"
- Agent D summary: "{agentD_result}"
- Numeric score: {score}
- Level: "{level}"
- Responses: {formatted_answers}

Task:
Summarize the combined insights from Agents R and D in 3–4 short sentences.
Include what the findings imply and the recommended next step (e.g., monitoring, self-care, or professional evaluation).
Output only the final summary — no JSON, no code block, no markdown formatting.
"""

    messages = [
        {"role": "system", "content": "You are Agent C, a balanced, evidence-based clinical reasoning AI."},
        {"role": "user", "content": prompt}
    ]

    messages = sanitize_obj(messages)

    # Check if API key exists before attempting API call
    if not os.getenv("OPENAI_API_KEY"):
        fallback = deterministic_comparison(agentR_result, agentD_result, score)
        safe_json_output({"result": fallback, "warning": "no_openai_api_key"})
        return

    try:
        from openai import OpenAI, APIError
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # ========== OpenAI Call ==========
        resp = client.responses.create(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            input=messages,
            max_output_tokens=400
        )

        # ========== Clean Output ==========
        out_text = extract_text_from_resp(resp) or ""

        # --- Remove markdown code fences like ```json ... ``` ---
        text = re.sub(r"^```(?:json)?", "", out_text, flags=re.IGNORECASE).strip("` \n")
        text = re.sub(r"```$", "", text).strip()

        # Try parse JSON if model included it
        try:
            j = json.loads(text)
            result = j.get("result") or j.get("Result") or text
        except Exception:
            result = text

        # Sanitize and output clean text only
        result = sanitize_string(result).strip()
        safe_json_output({"result": result})

    except Exception as e:
        tb = traceback.format_exc()
        fallback = deterministic_comparison(agentR_result, agentD_result, score)
        safe_json_output({"result": fallback, "warning": "openai_unavailable", "details": str(e)})


if __name__ == "__main__":
    main()
