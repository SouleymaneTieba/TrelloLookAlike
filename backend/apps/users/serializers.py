from django.contrib.auth import get_user_model
from rest_framework import serializers

from .presence import is_user_online


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):

    is_online = serializers.SerializerMethodField()

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
            "is_online",
        ]

        read_only_fields = [
            "is_staff",
            "is_superuser",
        ]

    def get_is_online(self, obj):
        return is_user_online(obj.id)


class CurrentUserSerializer(serializers.ModelSerializer):

    new_password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
    )

    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
    )

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
            "new_password",
            "password_confirm",
        ]
        read_only_fields = [
            "id",
            "username",
            "is_active",
            "is_staff",
            "is_superuser",
        ]

    def validate(self, attrs):
        email = attrs.get("email")
        new_password = attrs.get("new_password")
        password_confirm = attrs.get("password_confirm")

        if email and User.objects.exclude(
            pk=self.instance.pk
        ).filter(email=email).exists():
            raise serializers.ValidationError({
                "email": "Cette adresse email est déjà utilisée."
            })

        if new_password and new_password != password_confirm:
            raise serializers.ValidationError({
                "password_confirm":
                    "Les mots de passe ne correspondent pas."
            })

        if password_confirm and not new_password:
            raise serializers.ValidationError({
                "new_password":
                    "Saisissez un nouveau mot de passe."
            })

        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop("new_password", None)
        validated_data.pop("password_confirm", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if new_password:
            instance.set_password(new_password)

        instance.save()
        return instance


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