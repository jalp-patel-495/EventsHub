@echo off
echo ====================================================
echo Starting EventHub Django Backend...
echo ====================================================

cd /d "%~dp0"

:: Check if the virtual environment is broken
if exist .venv (
    .venv\Scripts\python.exe -c "import sys" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] The current virtual environment .venv is broken or was created for a different machine.
        echo Re-creating a fresh virtual environment for your system...
        rd /s /q .venv
    )
)

:: Create virtual environment if it doesn't exist
if not exist .venv (
    echo [1/3] Creating a new Python virtual environment .venv...
    python -m venv .venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment. 
        echo Please ensure Python is installed and added to your system PATH.
        pause
        exit /b 1
    )
    
    echo [2/3] Installing backend dependencies...
    .venv\Scripts\python.exe -m pip install --upgrade pip
    .venv\Scripts\pip.exe install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Checking python dependencies...
    .venv\Scripts\python.exe -c "import django" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo Django is not installed in .venv. Installing dependencies from requirements.txt...
        .venv\Scripts\pip.exe install -r requirements.txt
        if %ERRORLEVEL% neq 0 (
            echo [ERROR] Failed to install backend dependencies.
            pause
            exit /b 1
        )
    )
)

echo [2/3] Setting up database credentials...
.venv\Scripts\python.exe setup_dev_credentials.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Error running setup_dev_credentials.py.
    pause
    exit /b %ERRORLEVEL%
)

echo [3/3] Starting Django Backend Server...
.venv\Scripts\python.exe manage.py runserver 8000
