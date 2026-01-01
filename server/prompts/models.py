from django.db import models
from django.conf import settings

class Prompt(models.Model):
    """
    Model representing a prompt in the system.
    """
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content = models.TextField()

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prompts'
    )

    # Versioning fields
    version = models.PositiveIntegerField(default=1)
    # A prompt can be a new version of another prompt
    parent_prompt = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='versions'
    )

    # Community features
    is_public = models.BooleanField(default=False)
    average_rating = models.FloatField(default=0.0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} (v{self.version}) by {self.author.username}'

# It's also good to have a model for ratings to calculate the average.
class Rating(models.Model):
    """
    Model representing a user's rating for a prompt.
    """
    prompt = models.ForeignKey(
        Prompt,
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    score = models.PositiveSmallIntegerField() # e.g., 1 to 5

    class Meta:
        # A user can only rate a prompt once
        unique_together = ('prompt', 'user')

    def __str__(self):
        return f'{self.score}/5 for "{self.prompt.title}" by {self.user.username}'

