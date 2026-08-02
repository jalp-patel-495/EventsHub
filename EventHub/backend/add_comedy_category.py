import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from events.models import Category

cat, created = Category.objects.get_or_create(name='Comedy', defaults={'slug': 'comedy'})
if created:
    print("Successfully created Comedy category!")
else:
    print("Comedy category already exists!")
