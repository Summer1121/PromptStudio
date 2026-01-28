from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User.notifications.rel.model # Reference the model dynamically or import it
        fields = ('id', 'category', 'title', 'message', 'link', 'is_read', 'created_at')

# Better to import it explicitly
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'category', 'title', 'message', 'link', 'is_read', 'created_at')
