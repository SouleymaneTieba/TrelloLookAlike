from rest_framework import serializers

from .models import Role, Team, TeamMember


class RoleSerializer(serializers.ModelSerializer):

    class Meta:

        model = Role

        fields = [
            "id",
            "slug",
            "label",
            "is_system",
            "unique_per_team",
            "created_at",
        ]

        read_only_fields = [
            "slug",
            "is_system",
            "created_at",
        ]

    def validate_label(self, value):

        label = value.strip()

        if not label:
            raise serializers.ValidationError(
                "Le nom du rôle est obligatoire."
            )

        queryset = Role.objects.filter(
            label__iexact=label,
        )

        if self.instance:
            queryset = queryset.exclude(
                id=self.instance.id,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Un rôle avec ce nom existe déjà."
            )

        return label

    def create(self, validated_data):

        validated_data["slug"] = Role.make_slug(
            validated_data["label"]
        )

        validated_data["is_system"] = False

        return super().create(validated_data)

    def update(self, instance, validated_data):

        if instance.is_system:
            validated_data.pop("unique_per_team", None)

        return super().update(instance, validated_data)


class TeamMemberSerializer(serializers.ModelSerializer):

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

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    job_title = serializers.CharField(
        source="user.job_title",
        read_only=True,
    )

    team_name = serializers.CharField(
        source="team.name",
        read_only=True,
    )

    role = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Role.objects.all(),
    )

    role_label = serializers.CharField(
        source="role.label",
        read_only=True,
    )

    class Meta:

        model = TeamMember

        fields = [
            "id",
            "user",
            "username",
            "first_name",
            "last_name",
            "email",
            "job_title",
            "team",
            "team_name",
            "role",
            "role_label",
            "joined_at",
            "is_active",
        ]

        read_only_fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "job_title",
            "team_name",
            "role_label",
            "joined_at",
        ]

    def validate(self, attrs):

        user = attrs.get(
            "user",
            getattr(self.instance, "user", None),
        )

        team = attrs.get(
            "team",
            getattr(self.instance, "team", None),
        )

        role = attrs.get(
            "role",
            getattr(self.instance, "role", None),
        )

        is_active = attrs.get(
            "is_active",
            getattr(self.instance, "is_active", True),
        )

        if user and team:

            queryset = TeamMember.objects.filter(
                user=user,
                team=team,
            )

            if self.instance:
                queryset = queryset.exclude(
                    id=self.instance.id,
                )

            if queryset.exists():
                raise serializers.ValidationError(
                    "Cet utilisateur appartient déjà à cette équipe."
                )

        if (
            role
            and role.unique_per_team
            and is_active
            and team
        ):

            existing = (
                TeamMember.objects
                .filter(
                    team=team,
                    role=role,
                    is_active=True,
                )
            )

            if self.instance:
                existing = existing.exclude(
                    id=self.instance.id,
                )

            if existing.exists():
                raise serializers.ValidationError(
                    f"Cette équipe possède déjà un {role.label.lower()}."
                )

        return attrs

    def create(self, validated_data):

        if "role" not in validated_data:

            validated_data["role"] = Role.objects.get(
                slug=Role.SLUG_MEMBER,
            )

        return super().create(validated_data)


class TeamSerializer(serializers.ModelSerializer):

    members = TeamMemberSerializer(
        many=True,
        read_only=True,
    )

    class Meta:

        model = Team

        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "members",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_by",
            "members",
        ]
