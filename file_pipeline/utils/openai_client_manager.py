from openai import OpenAI
from threading import Lock
import os

class OpenAIClientManager:
    _instance = None
    _lock = Lock()

    @classmethod
    def get_client(cls) -> OpenAI:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = OpenAI(
                        base_url=os.getenv("OPENAI_BASE_URL"),
                        api_key=os.getenv("OPENAI_API_KEY")
                    )
        return cls._instance
