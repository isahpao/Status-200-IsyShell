from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from app.database import Base


class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    script_name = Column(String, nullable=False)
    parameters = Column(Text, nullable=True)
    status = Column(String, nullable=False)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ScriptRegistry(Base):
    __tablename__ = "script_registry"

    id = Column(Integer, primary_key=True, index=True)
    script_name = Column(String, unique=True, nullable=False)
    script_path = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    parameters = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ApiToken(Base):
    __tablename__ = "api_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)