from rest_framework import serializers
from .models import MarketPrompt, PromptVersion, Interaction, Comment

class PromptVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptVersion
        fields = ('version', 'content', 'changelog', 'created_at')

class MarketPromptSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.username')
    versions = PromptVersionSerializer(many=True, read_only=True)
    latest_content = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    dislike_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketPrompt
        fields = (
            'uuid', 'title', 'description', 'owner_name', 
            'visibility', 'latest_version', 'tags', 
            'versions', 'latest_content', 'like_count', 'dislike_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('uuid', 'owner_name', 'latest_version', 'created_at', 'updated_at')

    def get_latest_content(self, obj):
        latest = obj.versions.first()
        return latest.content if latest else ""

    def get_like_count(self, obj):
        return obj.interactions.filter(type='like').count()

    def get_dislike_count(self, obj):
        return obj.interactions.filter(type='dislike').count()

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'prompt', 'user_name', 'content', 'parent', 'replies', 'created_at')
        read_only_fields = ('id', 'user_name', 'created_at')

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

class InteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interaction
        fields = ('prompt', 'type', 'created_at')
