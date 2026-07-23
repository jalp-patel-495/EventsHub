import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventhub.settings")

try:
    django.setup()
    from django.db import connection
    print("=" * 60)
    print("EVENTHUB DATABASE CONNECTION CHECK")
    print("=" * 60)
    
    db_engine = connection.settings_dict.get('ENGINE')
    db_name = connection.settings_dict.get('NAME')
    db_host = connection.settings_dict.get('HOST', 'localhost')
    db_user = connection.settings_dict.get('USER', '')
    
    print(f"Database Engine:  {db_engine}")
    print(f"Database Name:    {db_name}")
    print(f"Database Host:    {db_host}")
    print(f"Database User:    {db_user}")
    print("-" * 60)
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1;")
        row = cursor.fetchone()
        if row and row[0] == 1:
            print("STATUS: SUCCESS! Database connection verified successfully.")
        else:
            print("STATUS: WARNING! Connection test query returned unexpected result.")
            
    print("=" * 60)
except Exception as e:
    print("=" * 60)
    print("STATUS: FAILED! Could not connect to database.")
    print(f"Error details: {e}")
    print("=" * 60)
    sys.exit(1)
