from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from app.database import Base

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True, index=True)

    executed_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    script_name = Column(String)

    parameters = Column(Text)

    status = Column(String)

    stdout = Column(Text)

    stderr = Column(Text)