from dataclasses import dataclass
from dotenv import load_dotenv
import os


@dataclass
class Config:
    database_url: str


def load_config() -> Config:
    load_dotenv()
    return Config(
        database_url=os.getenv("DATABASE_URL", "sqlite:///./flowmap.db"),
    )
