import os
from datetime import datetime
from sqlalchemy import create_engine, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
URL = os.getenv("DATABASE_URL", "sqlite:///./agrivision.db")
engine = create_engine(URL, connect_args={"check_same_thread": False} if URL.startswith("sqlite") else {})
Session = sessionmaker(engine)
class Base(DeclarativeBase): pass
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(15), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    state: Mapped[str | None] = mapped_column(String(60), nullable=True)
    district: Mapped[str | None] = mapped_column(String(60), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(2), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
class PriceAlert(Base):
    __tablename__ = "price_alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    crop: Mapped[str] = mapped_column(String(60)); market: Mapped[str | None] = mapped_column(String(80), nullable=True)
    threshold: Mapped[float] = mapped_column(Float); condition: Mapped[str] = mapped_column(String(5))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
def init_db(): Base.metadata.create_all(engine)
