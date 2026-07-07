from django.urls import path
from .views import AIChatbotView, AIRecommendationsView, AIEventDescriptionView, AIAnalyticsView, AICateringPlannerView

urlpatterns = [
    path('chatbot/', AIChatbotView.as_view(), name='ai_chatbot'),
    path('recommendations/', AIRecommendationsView.as_view(), name='ai_recommendations'),
    path('generate-description/', AIEventDescriptionView.as_view(), name='ai_generate_description'),
    path('analytics/', AIAnalyticsView.as_view(), name='ai_analytics'),
    path('catering-planner/', AICateringPlannerView.as_view(), name='ai_catering_planner'),
]
