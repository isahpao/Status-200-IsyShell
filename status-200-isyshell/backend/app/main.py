from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import subprocess
import os

from app.database import SessionLocal, engine
from app.models import Base, ExecutionLog, ScriptRegistry, ApiToken

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IsyShell Automation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_TOKEN = "isy-secret-token"
SCRIPT_BASE_PATH = "/app/scripts"


class ScriptCreate(BaseModel):
    script_name: str
    script_path: str
    description: Optional[str] = None
    parameters: Optional[str] = None
    active: bool = True


class ScriptStatusUpdate(BaseModel):
    active: bool


class TokenUpdate(BaseModel):
    new_token: str


DEFAULT_SCRIPTS = [
    {
        "script_name": "cleanup_logs",
        "script_path": "/app/scripts/cleanup_logs.sh",
        "description": "Simula a limpeza de logs antigos do sistema.",
        "parameters": "Sem parâmetros obrigatórios.",
        "active": True,
    },
    {
        "script_name": "docker_status",
        "script_path": "/app/scripts/docker_status.sh",
        "description": "Verifica o status de containers simulados.",
        "parameters": "Sem parâmetros obrigatórios.",
        "active": True,
    },
    {
        "script_name": "check_disk_usage",
        "script_path": "/app/scripts/check_disk_usage.sh",
        "description": "Analisa o uso de disco da aplicação.",
        "parameters": "Sem parâmetros obrigatórios.",
        "active": True,
    },
    {
        "script_name": "restart_service",
        "script_path": "/app/scripts/restart_service.sh",
        "description": "Simula o reinício controlado de um serviço.",
        "parameters": "Sem parâmetros obrigatórios.",
        "active": True,
    },
    {
        "script_name": "backup_database",
        "script_path": "/app/scripts/backup_database.sh",
        "description": "Simula o backup de um banco de dados.",
        "parameters": "Sem parâmetros obrigatórios.",
        "active": True,
    },
]


def get_db():
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


def seed_database():
    db: Session = SessionLocal()

    token = db.query(ApiToken).first()
    if not token:
        db.add(ApiToken(token=DEFAULT_TOKEN))

    for script in DEFAULT_SCRIPTS:
        exists = (
            db.query(ScriptRegistry)
            .filter(ScriptRegistry.script_name == script["script_name"])
            .first()
        )

        if not exists:
            db.add(ScriptRegistry(**script))

    db.commit()
    db.close()


seed_database()


def get_valid_token():
    db: Session = SessionLocal()
    token_record = db.query(ApiToken).first()
    db.close()

    if token_record:
        return token_record.token

    return DEFAULT_TOKEN


def verify_token(token: str):
    if token != get_valid_token():
        raise HTTPException(status_code=401, detail="Invalid token")


def validate_script_path(script_path: str):
    normalized_path = os.path.normpath(script_path)

    if not normalized_path.startswith(SCRIPT_BASE_PATH):
        raise HTTPException(
            status_code=400,
            detail="Script path must be inside /app/scripts"
        )

    if not normalized_path.endswith(".sh"):
        raise HTTPException(
            status_code=400,
            detail="Only .sh scripts are allowed"
        )

    return normalized_path


@app.get("/")
def health():
    return {"status": "online"}


@app.get("/api/v1/scripts", tags=["Automação"])
def list_scripts(x_isy_token: str = Header(...)):
    verify_token(x_isy_token)

    db: Session = SessionLocal()
    scripts = (
        db.query(ScriptRegistry)
        .filter(ScriptRegistry.active == True)
        .all()
    )
    db.close()

    return {
        "scripts": [
            {
                "script_name": script.script_name,
                "description": script.description,
                "parameters": script.parameters,
                "active": script.active,
            }
            for script in scripts
        ]
    }


@app.post("/api/v1/scripts/{script_name}/execute", tags=["Automação"])
def execute_script(script_name: str, x_isy_token: str = Header(...)):
    verify_token(x_isy_token)

    db: Session = SessionLocal()
    script = (
        db.query(ScriptRegistry)
        .filter(
            ScriptRegistry.script_name == script_name,
            ScriptRegistry.active == True
        )
        .first()
    )

    if not script:
        db.close()
        raise HTTPException(status_code=404, detail="Script not found or inactive")

    command = ["sh", script.script_path]

    result = subprocess.run(command, capture_output=True, text=True)

    execution_status = "success" if result.returncode == 0 else "error"

    log = ExecutionLog(
        script_name=script.script_name,
        parameters=script.parameters,
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


@app.get("/api/v1/logs", tags=["Auditoria"])
def get_logs(x_isy_token: str = Header(...)):
    verify_token(x_isy_token)

    db: Session = SessionLocal()
    logs = db.query(ExecutionLog).all()
    db.close()

    return logs


@app.get("/api/v1/admin/scripts", tags=["Administração"])
def admin_list_scripts(x_isy_token: str = Header(...)):
    verify_token(x_isy_token)

    db: Session = SessionLocal()
    scripts = db.query(ScriptRegistry).all()
    db.close()

    return scripts


@app.post("/api/v1/admin/scripts", tags=["Administração"])
def admin_create_script(script: ScriptCreate, x_isy_token: str = Header(...)):
    verify_token(x_isy_token)

    script_path = validate_script_path(script.script_path)

    db: Session = SessionLocal()

    exists = (
        db.query(ScriptRegistry)
        .filter(ScriptRegistry.script_name == script.script_name)
        .first()
    )

    if exists:
        db.close()
        raise HTTPException(status_code=409, detail="Script already registered")

    new_script = ScriptRegistry(
        script_name=script.script_name,
        script_path=script_path,
        description=script.description,
        parameters=script.parameters,
        active=script.active,
    )

    db.add(new_script)
    db.commit()
    db.refresh(new_script)
    db.close()

    return {
        "message": "Script registered successfully",
        "script": new_script.script_name,
        "active": new_script.active,
    }


@app.patch("/api/v1/admin/scripts/{script_name}/status", tags=["Administração"])
def admin_update_script_status(
    script_name: str,
    status_update: ScriptStatusUpdate,
    x_isy_token: str = Header(...)
):
    verify_token(x_isy_token)

    db: Session = SessionLocal()
    script = (
        db.query(ScriptRegistry)
        .filter(ScriptRegistry.script_name == script_name)
        .first()
    )

    if not script:
        db.close()
        raise HTTPException(status_code=404, detail="Script not found")

    script.active = status_update.active
    db.commit()
    db.refresh(script)
    db.close()

    return {
        "message": "Script status updated successfully",
        "script": script_name,
        "active": status_update.active,
    }


@app.put("/api/v1/admin/token", tags=["Administração"])
def admin_update_token(token_update: TokenUpdate, x_isy_token: str = Header(...)):
    verify_token(x_isy_token)

    db: Session = SessionLocal()
    token_record = db.query(ApiToken).first()

    if not token_record:
        token_record = ApiToken(token=token_update.new_token)
        db.add(token_record)
    else:
        token_record.token = token_update.new_token
        token_record.updated_at = datetime.utcnow()

    db.commit()
    db.close()

    return {
        "message": "Token updated successfully"
    }