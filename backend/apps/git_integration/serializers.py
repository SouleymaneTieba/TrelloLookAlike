from urllib.parse import urlsplit

from rest_framework import serializers

from apps.projects.models import Project

from .models import GitRepository


class GitLabRepositoryConfigSerializer(serializers.Serializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
    )
    url = serializers.URLField(max_length=500)
    webhook_secret = serializers.CharField(
        max_length=255,
        min_length=32,
        required=False,
        allow_blank=True,
        write_only=True,
        trim_whitespace=True,
    )
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_url(self, value):
        parsed_url = urlsplit(value)
        path_parts = [
            part for part in parsed_url.path.strip("/").split("/")
            if part
        ]
        if path_parts and path_parts[-1].endswith(".git"):
            path_parts[-1] = path_parts[-1][:-4]

        if (
            parsed_url.scheme not in {"http", "https"}
            or not parsed_url.netloc
            or parsed_url.username
            or parsed_url.password
            or parsed_url.query
            or parsed_url.fragment
        ):
            raise serializers.ValidationError(
                "Fournissez une URL HTTP ou HTTPS valide du dépôt GitLab."
            )
        if len(path_parts) < 2 or not path_parts[-1]:
            raise serializers.ValidationError(
                "L’URL doit contenir au moins le groupe et le nom du dépôt."
            )

        self.repository_owner = "/".join(path_parts[:-1])
        self.repository_name = path_parts[-1]
        if len(self.repository_owner) > 150 or len(self.repository_name) > 150:
            raise serializers.ValidationError(
                "Le chemin du dépôt dépasse la longueur autorisée."
            )

        return value

    def validate(self, attrs):
        existing_repository = GitRepository.objects.filter(
            project=attrs["project"]
        ).first()
        if (
            existing_repository
            and existing_repository.provider != GitRepository.Provider.GITLAB
        ):
            raise serializers.ValidationError({
                "project": "Un dépôt GitHub est déjà associé à ce projet."
            })

        secret = attrs.get("webhook_secret", "")
        if (
            (existing_repository is None or not existing_repository.webhook_secret)
            and not secret
        ):
            raise serializers.ValidationError({
                "webhook_secret": "Un token d’au moins 32 caractères est requis."
            })
        if secret and len(secret) < 32:
            raise serializers.ValidationError({
                "webhook_secret": "Le token doit contenir au moins 32 caractères."
            })

        attrs["repository_owner"] = self.repository_owner
        attrs["repository_name"] = self.repository_name
        if GitRepository.objects.filter(
            provider=GitRepository.Provider.GITLAB,
            owner=self.repository_owner,
            name=self.repository_name,
        ).exclude(project=attrs["project"]).exists():
            raise serializers.ValidationError({
                "url": "Ce dépôt GitLab est déjà associé à un autre projet."
            })
        return attrs