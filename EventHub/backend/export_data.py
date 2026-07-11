"""
Export SQLite data to datadump.json with proper UTF-8 encoding.
Run: python export_data.py
"""
import os
import sys
import io

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')

# Force stdout to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import django
django.setup()

from django.core import management

with open('datadump.json', 'w', encoding='utf-8') as f:
    management.call_command(
        'dumpdata',
        '--natural-foreign',
        '--natural-primary',
        '--exclude=contenttypes',
        '--exclude=auth.permission',
        '--exclude=admin.logentry',
        '--indent=2',
        stdout=f,
        verbosity=0,
    )

print("✅ Data exported to datadump.json successfully!")
