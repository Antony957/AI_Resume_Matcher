from sentence_transformers import SentenceTransformer
from threading import Lock

class SentenceModelManager:
    _instance = None
    _lock = Lock()

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        return cls._instance