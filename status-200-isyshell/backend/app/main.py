from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import subprocess

from app.database import SessionLocal, engine
from app.models import Base, ExecutionLog

# Cria tabelas automaticamente
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IsyShell Automation API",
    version="1.0.0"
)

# Libera o frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_TOKEN = "isy-secret-token"

SCRIPTS = {
    "cleanup_logs": "/app/scripts/cleanup_logs.sh",
    "docker_status": "/app/scripts/docker_status.sh",
    "check_disk_usage": "/app/scripts/check_disk_usage.sh",
    "restart_service": "/app/scripts/restart_service.sh",
    "backup_database": "/app/scripts/backup_database.sh"
}


def verify_token(token: str):
    if token != VALID_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


@app.get("/")
def health():
    return {
        "status": "online"
    }


@app.get("/api/v1/scripts")
def list_scripts(x_isy_token: str = Header(...)):
    verify_token(x_isy_token)

    return {
        "scripts": list(SCRIPTS.keys())
    }


@app.post("/api/v1/scripts/{script_name}/execute")
def execute_script(
    script_name: str,
    x_isy_token: str = Header(...)
):
    verify_token(x_isy_token)

    if script_name not in SCRIPTS:
        raise HTTPException(
            status_code=404,
            detail="Script not found"
        )

    command = ["sh", SCRIPTS[script_name]]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    execution_status = "success" if result.returncode == 0 else "error"

    db: Session = SessionLocal()

    log = ExecutionLog(
        script_name=script_name,
        parameters="[]",
        status=execution_status,
        stdout=result.stdout,
        stderr=result.stderr
    )

    db.add(log)
    db.commit()
    db.close()

    return {
        "status": execution_status,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "return_code": result.returncode
    }


@app.get("/api/v1/logs")
def get_logs(x_isy_token: str = Header(...)):
    verify_token(x_isy_token)

    db: Session = SessionLocal()
    logs = db.query(ExecutionLog).all()
    db.close()

    return logs