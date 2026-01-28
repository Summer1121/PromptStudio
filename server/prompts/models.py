import uuid
from django.db import models
from django.conf import settings

class MarketPrompt(models.Model):
    """
    社区提示词市场中的主记录。
    """
    VISIBILITY_CHOICES = (
        ('public', '公开'),
        ('link', '仅通过链接'),
        ('private', '私有'),
    )

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, verbose_name="标题")
    description = models.TextField(blank=True, verbose_name="描述")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='market_prompts',
        verbose_name="所有者"
    )
    visibility = models.CharField(
        max_length=10,
        choices=VISIBILITY_CHOICES,
        default='public',
        verbose_name="可见性"
    )
    latest_version = models.PositiveIntegerField(default=1, verbose_name="最新版本")
    tags = models.CharField(max_length=255, blank=True, verbose_name="标签") # 逗号分隔的标签

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.title} by {self.owner.username}'

class PromptVersion(models.Model):
    """
    提示词的具体版本。
    """
    prompt = models.ForeignKey(
        MarketPrompt,
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name="所属提示词"
    )
    version = models.PositiveIntegerField(verbose_name="版本号")
    content = models.TextField(verbose_name="内容")
    changelog = models.TextField(blank=True, verbose_name="更新日志")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('prompt', 'version')
        ordering = ['-version']

    def __str__(self):
        return f'{self.prompt.title} v{self.version}'

class Interaction(models.Model):
    """
    点赞和踩。
    """
    TYPE_CHOICES = (
        ('like', '点赞'),
        ('dislike', '点踩'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    prompt = models.ForeignKey(MarketPrompt, on_delete=models.CASCADE, related_name='interactions')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'prompt')

class Comment(models.Model):
    """
    评论。
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    prompt = models.ForeignKey(MarketPrompt, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField(verbose_name="评论内容")
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']