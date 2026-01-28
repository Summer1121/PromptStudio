from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom user model that inherits from AbstractUser.
    This allows for future customization.
    """
    # You can add custom fields here in the future, for example:
    # bio = models.TextField(blank=True)
    # avatar = models.ImageField(upload_to='avatars/', blank=True)
    pass

class Notification(models.Model):
    CATEGORY_CHOICES = (
        ('interaction', '互动'),
        ('comment', '评论'),
        ('update', '更新'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
