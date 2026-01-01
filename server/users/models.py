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
