from rest_framework import serializers

from .models import Message


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

    class Meta:

        model = Message

        fields = [
            "id",
            "team",
            "user",
            "username",
            "first_name",
            "last_name",
            "avatar",
            "content",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "user",
            "username",
            "first_name",
            "last_name",
            "avatar",
            "created_at",
            "updated_at",
        ]

    def validate_content(self, value):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Le message ne peut pas être vide."
            )

        return value