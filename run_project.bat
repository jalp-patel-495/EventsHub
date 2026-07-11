@echo off
echo ====================================================
echo Starting Ahmedabad Event Hub...
echo ====================================================

cd /d "%~dp0EventHub\backend"

:: Check if the virtual environment is broken (e.g. points to a different computer's Python path)
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
    echo [1/4] Creating a new Python virtual environment .venv...
    python -m venv .venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment. 
        echo Please ensure Python is installed and added to your system PATH.
        pause
        exit /b 1
    )
    
    echo [2/4] Installing backend dependencies (this may take a minute)...
    .venv\Scripts\python.exe -m pip install --upgrade pip
    .venv\Scripts\pip.exe install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
) else (
    echo [1/4] Checking python dependencies...
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

echo [2/4] Setting up database credentials...
.venv\Scripts\python.exe setup_dev_credentials.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Error running setup_dev_credentials.py.
    pause
    exit /b %ERRORLEVEL%
)

echo [3/4] Starting Django Backend in a new window...
start "EventHub Backend" cmd /k ".venv\Scripts\python.exe manage.py runserver"

echo [4/4] Checking Frontend dependencies and starting...
cd /d "%~dp0EventHub\frontend"
if not exist node_modules (
    echo Installing frontend dependencies, this may take a minute...
    call npm install
)
start "EventHub Frontend" cmd /k "npm run dev"

echo Opening browser...
timeout /t 3 >nul
start http://localhost:5173

echo ====================================================
echo Both servers have been started in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo ====================================================
pause
