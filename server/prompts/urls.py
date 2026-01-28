from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarketPromptViewSet, CommentViewSet, InteractionView, MediaUploadView
from .views_backup import CloudBackupView

router = DefaultRouter()
router.register(r'prompts', MarketPromptViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('interact/', InteractionView.as_view(), name='interact'),
    path('media/upload/', MediaUploadView.as_view(), name='media-upload'),
    path('backup/', CloudBackupView.as_view(), name='cloud-backup'),
]
