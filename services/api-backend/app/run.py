import subprocess
import sys
import os

def run_server():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    subprocess.run([
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--reload",
        "--host",
        "127.0.0.1",
        "--port",
        "8000"
    ])

if __name__ == "__main__":
    run_server()