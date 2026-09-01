from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "avatar",
            "phone",
            "job_title",
            "bio",
            "is_active",
            "is_staff",
            "is_superuser",
        ]

        read_only_fields = [
            "is_staff",
            "is_superuser",
        ]


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    password_confirm = serializers.CharField(
        write_only=True,
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        ]

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "Ce nom d'utilisateur existe déjà."
            )

        return value

    def validate_email(self, value):

        if User.objects.filter(
            email=value
        ).exists():

            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return value

    def validate(self, attrs):

        if (
            attrs["password"]
            != attrs["password_confirm"]
        ):

            raise serializers.ValidationError({
                "password_confirm":
                    "Les mots de passe ne correspondent pas."
            })

        return attrs

    def create(self, validated_data):

        validated_data.pop(
            "password_confirm"
        )

        return User.objects.create_user(
            **validated_data
        )


class AdminUserCreateSerializer(
    serializers.ModelSerializer
):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    password_confirm = serializers.CharField(
        write_only=True,
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "job_title",
            "bio",
            "avatar",
            "password",
            "password_confirm",
        ]

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "Ce nom d'utilisateur existe déjà."
            )

        return value

    def validate_email(self, value):

        if User.objects.filter(
            email=value
        ).exists():

            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return value

    def validate(self, attrs):

        if (
            attrs["password"]
            != attrs["password_confirm"]
        ):

            raise serializers.ValidationError({
                "password_confirm":
                    "Les mots de passe ne correspondent pas."
            })

        return attrs

    def create(self, validated_data):

        validated_data.pop(
            "password_confirm"
        )

        return User.objects.create_user(
            **validated_data
        )