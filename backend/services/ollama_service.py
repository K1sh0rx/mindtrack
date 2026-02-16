import requests
import json
from typing import List, Dict, Any
from config.settings import settings
from utils.exceptions import OllamaException 
from models.schemas import Topic 


class OllamaService:

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT

    def check_connection(self) -> bool:
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception:
            return False

    # 🔥 NEW INITIAL ALLOCATION FUNCTION
    def allocate_initial_schedule(self, topics: List[Dict[str, Any]], total_minutes: int) -> List[Dict[str, Any]]:
        prompt = self._build_initial_prompt(topics, total_minutes)

        try:
            response = self._call_ollama(prompt)
            return self._parse_initial_response(response, topics)
        except Exception:
            return self._fallback_initial(topics, total_minutes)

    def _build_initial_prompt(self, topics: List[Dict[str, Any]], total_minutes: int) -> str:

        subject_block = ""
        for t in topics:
            subject_block += f"- {t['subject']} → {t['name']} ({t['level']})\n"

        return f"""
You are a study schedule allocator.

Topics:
{subject_block}

Total available time: {total_minutes} minutes

Weight Rules:
- UNKNOWN topics: +20% priority
- KNOWN topics: -10% priority
- PARTIAL topics: no change

Rules:
1. Allocate ALL {total_minutes} minutes exactly
2. Each topic minimum 5 minutes
3. Return ONLY valid JSON

Format:
{{
 "schedule":[
   {{"name":"Topic","time_minutes":20}}
 ]
}}
"""

    def _parse_initial_response(self, response: str, original_topics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        data = json.loads(response)

        if "schedule" not in data:
            raise ValueError("Invalid response")

        result = []

        for item in data["schedule"]:
            match = next(
                (
                    t for t in original_topics
                    if item["name"].lower() in t["name"].lower()
                    or t["name"].lower() in item["name"].lower()
                ),
                None
            )

            if match:
                result.append({
                    "name": match["name"],
                    "subject": match["subject"],
                    "level": match["level"],
                    "time_minutes": max(5, int(item["time_minutes"]))
                })

        if not result:
            raise ValueError("No valid topics")

        return result

    def _fallback_initial(self, topics: List[Dict[str, Any]], total_minutes: int):

        per_topic = max(5, int(total_minutes / len(topics)))

        return [
            {
                "name": t["name"],
                "subject": t["subject"],
                "level": t["level"],
                "time_minutes": per_topic
            }
            for t in topics
        ]

    # -------- EXISTING RESCHEDULE --------

    def reschedule_topics(self, remaining_topics: List[Topic], total_remaining_minutes: int) -> List[Dict[str, Any]]:
        return [{"name": t.name, "time_minutes": t.time_minutes} for t in remaining_topics]

    def _call_ollama(self, prompt: str) -> str:
        url = f"{self.base_url}/api/generate"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }

        try:
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except requests.exceptions.Timeout:
            raise OllamaException("Request timed out")
        except requests.exceptions.ConnectionError:
            raise OllamaException("Cannot connect to Ollama.")
        except requests.exceptions.RequestException as e:
            raise OllamaException(f"Request failed: {str(e)}")


ollama_service = OllamaService()
