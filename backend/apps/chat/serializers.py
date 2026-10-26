from rest_framework import serializers

from .models import Message
from .services import get_message_reactions


class MessageSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    avatar = serializers.CharField(
        source="user.avatar",
        read_only=True,
    )

    reactions = serializers.SerializerMethodField()

    class Meta:

        model = Message

        fields = [
            "id",
            "project",
            "user",
            "username",
            "first_name",
            "last_name",
            "avatar",
            "content",
            "reactions",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "project": {"required": True},
        }

        read_only_fields = [
            "user",
            "username",
            "first_name",
            "last_name",
            "avatar",
            "reactions",
            "created_at",
            "updated_at",
        ]

    def get_reactions(self, obj):
        request = self.context.get("request")
        if request is None:
            return []
        return get_message_reactions(obj, request.user)

    def validate_content(self, value):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Le message ne peut pas être vide."
            )

        return value
