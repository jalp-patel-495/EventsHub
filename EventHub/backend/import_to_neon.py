"""
Import datadump.json into Neon PostgreSQL.
Usage: python import_to_neon.py

Make sure DATABASE_URL is set in .env before running.
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')

import django
django.setup()

from django.core import management

print("🔄 Running migrations on Neon PostgreSQL...")
management.call_command('migrate', '--run-syncdb', verbosity=1)

print("📥 Loading data from datadump.json...")
management.call_command('loaddata', 'datadump.json', verbosity=2)

print("✅ Data imported to Neon PostgreSQL successfully!")
