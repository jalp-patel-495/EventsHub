"""
URL configuration for eventhub project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse

def api_root_html(request):
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ahmedabad Event Hub - Backend API</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', sans-serif;
                background-color: #0d0f14;
                color: #f3f4f6;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                overflow: hidden;
            }
            .background {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle at 30% 30%, #1e1b4b 0%, transparent 60%),
                            radial-gradient(circle at 70% 70%, #064e3b 0%, transparent 60%);
                z-index: -1;
            }
            .card {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: fadeIn 0.8s ease-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            h1 {
                font-family: 'Outfit', sans-serif;
                font-size: 2.5rem;
                font-weight: 800;
                margin-top: 0;
                margin-bottom: 8px;
                background: linear-gradient(135deg, #38bdf8 0%, #34d399 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .subtitle {
                color: #9ca3af;
                font-size: 1.1rem;
                margin-bottom: 24px;
            }
            .status-badge {
                display: inline-flex;
                align-items: center;
                background-color: rgba(52, 211, 153, 0.1);
                color: #34d399;
                padding: 6px 16px;
                border-radius: 9999px;
                font-size: 0.9rem;
                font-weight: 600;
                margin-bottom: 32px;
                border: 1px solid rgba(52, 211, 153, 0.2);
            }
            .status-dot {
                width: 8px;
                height: 8px;
                background-color: #34d399;
                border-radius: 50%;
                margin-right: 8px;
                box-shadow: 0 0 8px #34d399;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
            }
            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 32px;
            }
            .btn {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 14px 20px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 600;
                font-size: 0.95rem;
                transition: all 0.2s ease;
            }
            .btn-primary {
                background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
            }
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
            }
            .btn-secondary {
                background: rgba(255, 255, 255, 0.05);
                color: #f3f4f6;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.08);
                transform: translateY(-2px);
            }
            .footer {
                color: #6b7280;
                font-size: 0.85rem;
                margin-top: 16px;
            }
        </style>
    </head>
    <body>
        <div class="background"></div>
        <div class="card">
            <div class="status-badge">
                <span class="status-dot"></span>
                API Server Active
            </div>
            <h1>Ahmedabad Event Hub</h1>
            <p class="subtitle">Backend Services & API Gateway</p>
            <div class="grid">
                <a href="http://localhost:5173" class="btn btn-primary">Open Frontend App</a>
                <a href="/admin/" class="btn btn-secondary" target="_blank">Django Admin Panel</a>
            </div>
            <p class="footer">Environment: Development | DB Engine: SQLite</p>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)

def api_root(request):
    return JsonResponse({
        "status": "success",
        "message": "Ahmedabad Event Hub API is running",
        "endpoints": {
            "admin": "/admin/",
            "accounts": "/api/accounts/",
            "events": "/api/events/",
            "venues": "/api/venues/",
            "notifications": "/api/notifications/",
            "chat": "/api/chat/",
            "ai": "/api/ai/",
            "system_admin": "/api/admin/",
            "catering": "/api/catering/",
        }
    })

urlpatterns = [
    path("", api_root_html, name="api_root_html"),
    path("api/", api_root_html, name="api_root_api"),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/events/", include("events.urls")),
    path("api/venues/", include("venues.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/ai/", include("ai.urls")),
    path("api/admin/", include("system_admin.urls")),
    path("api/catering/", include("catering.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


