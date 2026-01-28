import hashlib
import os
from django.conf import settings
from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import MarketPrompt, PromptVersion, Interaction, Comment
from .serializers import (
    MarketPromptSerializer, PromptVersionSerializer, 
    CommentSerializer, InteractionSerializer
)

class MediaUploadView(generics.CreateAPIView):
    """
    处理多媒体文件上传，按内容哈希去重。
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "没有文件被上传"}, status=status.HTTP_400_BAD_REQUEST)

        # 计算哈希
        sha256_hash = hashlib.sha256()
        for chunk in file_obj.chunks():
            sha256_hash.update(chunk)
        file_hash = sha256_hash.hexdigest()

        # 确定扩展名
        _, ext = os.path.splitext(file_obj.name)
        filename = f"{file_hash}{ext}"
        file_path = os.path.join(settings.MEDIA_ROOT, filename)

        # 如果文件不存在，则保存
        if not os.path.exists(file_path):
            with open(file_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)

        file_url = request.build_absolute_uri(settings.MEDIA_URL + filename)
        return Response({
            "url": file_url,
            "hash": file_hash
        }, status=status.HTTP_201_CREATED)

class MarketPromptViewSet(viewsets.ModelViewSet):
    """
    市场提示词 CRUD。
    """
    queryset = MarketPrompt.objects.all()
    serializer_class = MarketPromptSerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)
    lookup_field = 'uuid'

    def get_queryset(self):
        queryset = MarketPrompt.objects.all()
        visibility = self.request.query_params.get('visibility', 'public')
        search = self.request.query_params.get('search')
        
        if self.action == 'list':
            queryset = queryset.filter(visibility='public')
        
        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(tags__icontains=search)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InteractionView(generics.CreateAPIView):
    serializer_class = InteractionSerializer
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        prompt_uuid = request.data.get('prompt')
        interaction_type = request.data.get('type')
        
        interaction, created = Interaction.objects.update_or_create(
            user=request.user,
            prompt_id=prompt_uuid,
            defaults={'type': interaction_type}
        )
        
        return Response(InteractionSerializer(interaction).data, status=status.HTTP_200_OK)
