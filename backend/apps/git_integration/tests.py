from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.notifications.models import Notification
from apps.projects.models import Project

from .models import GitRepository


User = get_user_model()


class GitLabWebhookTests(APITestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            username="project-member",
            password="test-password",
        )
        self.project = Project.objects.create(name="Projet test")
        self.project.members.add(self.member)
        self.secret = "a" * 64
        self.repository = GitRepository.objects.create(
            project=self.project,
            provider=GitRepository.Provider.GITLAB,
            owner="groupe/sous-groupe",
            name="application",
            url="https://gitlab.com/groupe/sous-groupe/application",
            webhook_secret=self.secret,
        )

    def post_push(self, token=None):
        payload = {
            "ref": "refs/heads/main",
            "user_name": "Amina",
            "total_commits_count": 2,
            "commits": [{}, {}],
            "project": {
                "path_with_namespace": "groupe/sous-groupe/application",
            },
        }
        headers = {"HTTP_X_GITLAB_EVENT": "Push Hook"}
        if token is not None:
            headers["HTTP_X_GITLAB_TOKEN"] = token
        return self.client.post(
            reverse("gitlab-webhook"),
            payload,
            format="json",
            **headers,
        )

    def test_push_notifies_only_project_members(self):
        response = self.post_push(self.secret)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["commits"], 2)
        notification = Notification.objects.get(user=self.member)
        self.assertEqual(
            notification.notification_type,
            Notification.NotificationType.GITLAB_PUSH,
        )
        self.assertIn("Amina a poussé 2 commits", notification.message)
        self.assertEqual(notification.link, self.repository.url)

    def test_invalid_token_does_not_create_notification(self):
        response = self.post_push("wrong-token")

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Notification.objects.exists())

    def test_inactive_repository_does_not_accept_push(self):
        self.repository.is_active = False
        self.repository.save(update_fields=["is_active"])

        response = self.post_push(self.secret)

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Notification.objects.exists())


class GitLabRepositoryConfigTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            password="test-password",
            is_staff=True,
        )
        self.project = Project.objects.create(name="Projet GitLab")
        self.client.force_authenticate(self.admin)

    def test_admin_can_register_gitlab_repo_without_exposing_secret(self):
        secret = "b" * 64
        response = self.client.post(
            reverse("git-repositories"),
            {
                "project": self.project.id,
                "url": "https://gitlab.com/groupe/sous-groupe/application.git",
                "webhook_secret": secret,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["owner"], "groupe/sous-groupe")
        self.assertEqual(response.data["name"], "application")
        self.assertNotIn("webhook_secret", response.data)
        repository = GitRepository.objects.get(project=self.project)
        self.assertTrue(check_password(secret, repository.webhook_secret))

    def test_non_admin_cannot_list_or_configure_repositories(self):
        member = User.objects.create_user(
            username="member",
            password="test-password",
        )
        self.client.force_authenticate(member)

        response = self.client.get(reverse("git-repositories"))

        self.assertEqual(response.status_code, 403)

    def test_updating_configuration_without_token_keeps_existing_token(self):
        secret = "c" * 64
        GitRepository.objects.create(
            project=self.project,
            provider=GitRepository.Provider.GITLAB,
            owner="groupe",
            name="application",
            url="https://gitlab.com/groupe/application",
            webhook_secret=secret,
        )

        response = self.client.post(
            reverse("git-repositories"),
            {
                "project": self.project.id,
                "url": "https://gitlab.com/groupe/application",
                "webhook_secret": "",
                "is_active": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("webhook_secret", response.data)
        self.assertTrue(response.data["has_webhook_secret"])
        repository = GitRepository.objects.get(project=self.project)
        self.assertEqual(repository.webhook_secret, secret)
        self.assertFalse(repository.is_active)
