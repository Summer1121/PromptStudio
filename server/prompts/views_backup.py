from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import os
import json

class CloudBackupView(generics.CreateAPIView):
    """
    云端备份接口：接收用户的完整数据 JSON。
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        data = request.data
        if not data:
            return Response({"error": "没有数据"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 存储路径：server/backups/<user_id>/backup.json
        backup_dir = os.path.join(settings.BASE_DIR, 'backups', str(request.user.id))
        os.makedirs(backup_dir, exist_ok=True)
        
        backup_file = os.path.join(backup_dir, 'backup.json')
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return Response({"status": "备份成功", "timestamp": os.path.getmtime(backup_file)})

    def get(self, request, *args, **kwargs):
        """
        拉取备份。
        """
        backup_file = os.path.join(settings.BASE_DIR, 'backups', str(request.user.id), 'backup.json')
        if not os.path.exists(backup_file):
            return Response({"error": "未找到备份"}, status=status.HTTP_404_NOT_FOUND)
            
        with open(backup_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return Response(data)
