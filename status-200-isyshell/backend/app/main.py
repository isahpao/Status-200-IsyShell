from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_TOKEN = "isy-secret"

SCRIPTS = {
    "cleanup_logs": "/app/scripts/cleanup_logs.sh",
    "docker_status": "/app/scripts/docker_status.sh"
}

def verify_token(token: str):
    if token != VALID_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")

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
        raise HTTPException(status_code=404, detail="Script not found")

    result = subprocess.run(
        [SCRIPTS[script_name]],
        capture_output=True,
        text=True
    )

    return {
        "status": "success" if result.returncode == 0 else "error",
        "stdout": result.stdout,
        "stderr": result.stderr,
        "return_code": result.returncode
    }
