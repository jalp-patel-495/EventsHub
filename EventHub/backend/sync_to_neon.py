"""
Automated script to sync the local SQLite database to Neon PostgreSQL database.
"""
import os
import subprocess
import shutil

env_path = '.env'
backup_env_path = '.env.bak'

# Step 1: Backup .env
if os.path.exists(env_path):
    shutil.copy(env_path, backup_env_path)
    print("Backed up .env file.")

try:
    # Step 2: Temporarily comment out DATABASE_URL in .env to force SQLite
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    with open(env_path, 'w') as f:
        for line in lines:
            if line.startswith('DATABASE_URL='):
                f.write('#DATABASE_URL=' + line.split('=', 1)[1])
            else:
                f.write(line)
    print("Temporarily switched local settings to SQLite database.")

    # Step 3: Dump data from SQLite to datadump_new.json
    print("Dumping data from SQLite...")
    # Clean up existing database-specific contenttypes to prevent duplicate key errors during load
    env_vars = os.environ.copy()
    env_vars['PYTHONIOENCODING'] = 'utf-8'
    env_vars['PYTHONUTF8'] = '1'
    subprocess.run([
        '.venv/Scripts/python.exe', 
        'manage.py', 
        'dumpdata', 
        '--exclude=contenttypes', 
        '--exclude=auth.Permission', 
        '--indent=2', 
        '--output=datadump_new.json'
    ], env=env_vars, check=True)
    print("Data dumped successfully to datadump_new.json.")

    # Step 4: Restore backup .env to switch default back to Neon PostgreSQL
    shutil.copy(backup_env_path, env_path)
    print("Restored Neon PostgreSQL connection string in local .env.")

    # Step 5: Flush Neon database first to prevent duplicate key conflicts
    print("Flushing Neon PostgreSQL tables...")
    # Run flush/sqlflush or similar. Since we want a clean load:
    subprocess.run([
        '.venv/Scripts/python.exe', 
        'manage.py', 
        'flush', 
        '--no-input'
    ], check=True)

    # Step 6: Load data into Neon PostgreSQL
    print("Loading latest data into Neon PostgreSQL...")
    subprocess.run([
        '.venv/Scripts/python.exe', 
        'manage.py', 
        'loaddata', 
        'datadump_new.json'
    ], check=True)
    print("Successfully synced all data to Neon PostgreSQL!")

    # Cleanup
    if os.path.exists('datadump_new.json'):
        os.remove('datadump_new.json')
    if os.path.exists(backup_env_path):
        os.remove(backup_env_path)

except Exception as e:
    print(f"[ERROR] Sync failed: {e}")
    # Restore env if anything fails
    if os.path.exists(backup_env_path):
        shutil.copy(backup_env_path, env_path)
        os.remove(backup_env_path)
        print("Restored .env backup after failure.")
