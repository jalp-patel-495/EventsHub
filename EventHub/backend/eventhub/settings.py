import os
import urllib.parse
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
load_dotenv(BASE_DIR / '.env')

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-^luu2j=*a**3hu@8%_w0a9208!#+97!r*6ld3m#nl4aocn*0vn")

DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Third-party applications
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    
    # Local applications
    "accounts",
    "events",
    "venues",
    "notifications",
    "chat",
    "ai",
    "system_admin",
    "catering",
]

# Add daphne and channels if installed and requested
try:
    import daphne
    import channels
    INSTALLED_APPS.insert(0, "daphne")
    INSTALLED_APPS.append("channels")
except ImportError:
    pass

try:
    import anymail
    INSTALLED_APPS.append("anymail")
except ImportError:
    pass




MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Placed high in the middleware chain
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Serve static files in production
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "eventhub.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "eventhub.wsgi.application"
ASGI_APPLICATION = "eventhub.asgi.application"

# Channels Channel Layers Configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

REDIS_URL = os.environ.get("REDIS_URL")
if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
            },
        },
    }

# Database configuration
# Priority 1: DATABASE_URL (Neon / Supabase / Vercel PostgreSQL connection string)
# Priority 2: DB_ENGINE=postgresql with individual DB_* vars
# Priority 3: SQLite for local development
DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()

try:
    import dj_database_url
    HAS_DJ_DB_URL = True
except ImportError:
    HAS_DJ_DB_URL = False

if DATABASE_URL:
    if HAS_DJ_DB_URL:
        DATABASES = {
            'default': dj_database_url.config(
                default=DATABASE_URL,
                conn_max_age=600,
                ssl_require=True
            )
        }
    else:
        parsed = urllib.parse.urlparse(DATABASE_URL)
        db_name = parsed.path.lstrip("/").split("?")[0]
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": db_name,
                "USER": parsed.username or "",
                "PASSWORD": parsed.password or "",
                "HOST": parsed.hostname or "localhost",
                "PORT": str(parsed.port) if parsed.port else "5432",
                "OPTIONS": {
                    "sslmode": "require",
                },
            }
        }
else:
    DB_ENGINE = os.environ.get('DB_ENGINE', 'sqlite')
    if DB_ENGINE == 'sqlite':
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            }
        }
    else:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": os.environ.get("DB_NAME", "eventhub"),
                "USER": os.environ.get("DB_USER", "postgres"),
                "PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
                "HOST": os.environ.get("DB_HOST", "localhost"),
                "PORT": os.environ.get("DB_PORT", "5432"),
            }
        }


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Custom Auth Configuration
AUTH_USER_MODEL = 'accounts.User'

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
    }
}

# SimpleJWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True  # In production, restrict this to frontend domain
CORS_ALLOW_CREDENTIALS = True

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static and Media files
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email Configuration
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@ahmedabadeventhub.com')

# Anymail Configuration (Supporting Resend, Brevo, SendGrid, Mailgun, Postmark)
ANYMAIL = {
    "RESEND_API_KEY": os.environ.get("RESEND_API_KEY"),
    "BREVO_API_KEY": os.environ.get("BREVO_API_KEY"),
    "SENDGRID_API_KEY": os.environ.get("SENDGRID_API_KEY"),
    "MAILGUN_API_KEY": os.environ.get("MAILGUN_API_KEY"),
    "POSTMARK_TOKEN": os.environ.get("POSTMARK_TOKEN"),
}

if not EMAIL_BACKEND:
    _has_smtp_creds = (
        EMAIL_HOST_USER
        and 'your-email' not in EMAIL_HOST_USER
        and EMAIL_HOST_PASSWORD
        and 'your-app-password' not in EMAIL_HOST_PASSWORD
    )

    if _has_smtp_creds:
        # Real Gmail SMTP — works in both local and production
        EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
        DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
    elif DEBUG:
        # Local dev without credentials → print to console
        EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    else:
        # Production without credentials → dummy backend (won't crash the server)
        EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend'

# Frontend Configuration
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# Security Headers Configuration
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

