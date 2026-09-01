from rest_framework import serializers

from .models import Team, TeamMember


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
            "joined_at",
        ]


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


class TeamMemberCreateSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = TeamMember

        fields = [
            "user",
            "team",
            "role",
            "is_active",
        ]

    def validate(self, attrs):

        user = attrs["user"]
        team = attrs["team"]
        role = attrs["role"]

        if TeamMember.objects.filter(
            user=user,
            team=team,
        ).exists():

            raise serializers.ValidationError(
                "Cet utilisateur appartient déjà à cette équipe."
            )

        if role == TeamMember.Role.PROJECT_MANAGER:

            if TeamMember.objects.filter(
                team=team,
                role=TeamMember.Role.PROJECT_MANAGER,
                is_active=True,
            ).exists():

                raise serializers.ValidationError(
                    "Cette équipe possède déjà un chef de projet."
                )

        return attrs


class TeamMemberUpdateSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = TeamMember

        fields = [
            "role",
            "is_active",
        ]

    def validate(self, attrs):

        role = attrs.get("role")
        is_active = attrs.get(
            "is_active",
            self.instance.is_active,
        )

        if (
            role == TeamMember.Role.PROJECT_MANAGER
            and is_active
        ):

            existing_manager = (
                TeamMember.objects
                .filter(
                    team=self.instance.team,
                    role=TeamMember.Role.PROJECT_MANAGER,
                    is_active=True,
                )
                .exclude(
                    id=self.instance.id
                )
                .exists()
            )

            if existing_manager:

                raise serializers.ValidationError(
                    "Cette équipe possède déjà un chef de projet."
                )

        return attrs