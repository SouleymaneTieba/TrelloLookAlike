from django.test import TestCase

from apps.projects.models import Project, ProjectMemberRole
from apps.projects.permissions import user_is_project_manager
from apps.projects.serializers import ProjectSerializer
from apps.teams.models import Role
from apps.users.models import User


class ProjectManagerRoleTests(TestCase):

    def setUp(self):
        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="test-password",
        )
        self.project = Project.objects.create(name="Projet test")
        self.project.members.add(self.manager)
        self.manager_role = Role.objects.get(label="Chef de projet")
        self.manager_role.slug = "CHEF_DE_PROJET"
        self.manager_role.save(update_fields=["slug"])

    def test_french_project_manager_role_is_included_in_project_data(self):
        ProjectMemberRole.objects.create(
            project=self.project,
            user=self.manager,
            role=self.manager_role,
        )

        data = ProjectSerializer(self.project).data

        self.assertEqual(data["project_manager_ids"], [self.manager.id])

    def test_french_project_manager_role_grants_manager_permissions(self):
        ProjectMemberRole.objects.create(
            project=self.project,
            user=self.manager,
            role=self.manager_role,
        )

        self.assertTrue(user_is_project_manager(self.project, self.manager))

    def test_project_manager_role_uses_canonical_slug_for_new_roles(self):
        self.assertEqual(Role.make_slug("Chef de projet"), Role.SLUG_PROJECT_MANAGER)
