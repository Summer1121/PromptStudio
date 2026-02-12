from rest_framework import serializers
from .models import MarketPrompt, PromptVersion, Interaction, Comment

class PromptVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptVersion
        fields = ('version', 'content', 'changelog', 'created_at')

class MarketPromptSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.username')
    versions = PromptVersionSerializer(many=True, read_only=True)
    content = serializers.CharField(write_only=True)
    latest_content = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    dislike_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketPrompt
        fields = (
            'uuid', 'title', 'description', 'owner_name', 
            'visibility', 'latest_version', 'tags', 
            'versions', 'content', 'latest_content', 'like_count', 'dislike_count',
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

    def create(self, validated_data):
        content = validated_data.pop('content')
        owner = validated_data.get('owner')
        title = validated_data.get('title')

        # 尝试查找已存在的同名提示词（且所有者是自己）进行对齐
        if owner and title:
            existing_prompt = MarketPrompt.objects.filter(owner=owner, title=title).first()
            if existing_prompt:
                return self.update(existing_prompt, {'content': content, **validated_data})

        prompt = MarketPrompt.objects.create(**validated_data)
        PromptVersion.objects.create(
            prompt=prompt,
            version=1,
            content=content
        )
        return prompt

    def update(self, instance, validated_data):
        content = validated_data.pop('content', None)
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.visibility = validated_data.get('visibility', instance.visibility)
        instance.tags = validated_data.get('tags', instance.tags)
        instance.save()

        if content:
            # 创建新版本
            new_version_num = instance.latest_version + 1
            PromptVersion.objects.create(
                prompt=instance,
                version=new_version_num,
                content=content
            )
            instance.latest_version = new_version_num
            instance.save()
        
        return instance

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
