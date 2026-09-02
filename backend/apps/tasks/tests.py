from types import SimpleNamespace

from django.test import TestCase

from apps.projects.models import Project
from apps.tasks.models import Task
from apps.tasks.permissions import TaskPermission
from apps.teams.models import Role, Team, TeamMember
from apps.users.models import User


class TaskPermissionTests(TestCase):

	def setUp(self):
		self.member_role = Role.objects.create(
			slug="MEMBER",
			label="Membre",
		)

		self.team = Team.objects.create(
			name="Équipe Alpha",
		)

		self.assignee = User.objects.create_user(
			username="member",
			email="member@example.com",
			password="secret123",
		)
		self.creator = User.objects.create_user(
			username="creator",
			email="creator@example.com",
			password="secret123",
		)

		TeamMember.objects.create(
			user=self.assignee,
			team=self.team,
			role=self.member_role,
		)
		TeamMember.objects.create(
			user=self.creator,
			team=self.team,
			role=self.member_role,
		)

		self.project = Project.objects.create(
			name="Projet test",
			team=self.team,
			created_by=self.creator,
		)

	def build_request(self, user, method, data=None):
		data = data or {}
		return SimpleNamespace(
			user=user,
			method=method,
			data=data,
		)

	def test_assigned_task_allows_only_status_completion(self):
		task = Task.objects.create(
			title="Tâche assignée",
			description="À compléter",
			project=self.project,
			assigned_to=self.assignee,
			created_by=self.creator,
			status=Task.Status.TODO,
		)

		permission = TaskPermission()

		self.assertTrue(
			permission.has_object_permission(
				self.build_request(self.assignee, "PATCH", {"status": "DONE"}),
				None,
				task,
			)
		)

		self.assertFalse(
			permission.has_object_permission(
				self.build_request(self.assignee, "PATCH", {"description": "Modifiée"}),
				None,
				task,
			)
		)

		self.assertFalse(
			permission.has_object_permission(
				self.build_request(self.assignee, "DELETE"),
				None,
				task,
			)
		)

	def test_user_can_edit_or_delete_his_own_created_task(self):
		task = Task.objects.create(
			title="Tâche créée par moi",
			description="À modifier",
			project=self.project,
			assigned_to=self.assignee,
			created_by=self.assignee,
			status=Task.Status.TODO,
		)

		permission = TaskPermission()

		self.assertTrue(
			permission.has_object_permission(
				self.build_request(self.assignee, "PATCH", {"title": "Nouveau titre"}),
				None,
				task,
			)
		)

		self.assertTrue(
			permission.has_object_permission(
				self.build_request(self.assignee, "DELETE"),
				None,
				task,
			)
		)

	def test_project_manager_cannot_edit_admin_assigned_task(self):
		manager = User.objects.create_user(
			username="manager",
			email="manager@example.com",
			password="secret123",
		)
		TeamMember.objects.create(
			user=manager,
			team=self.team,
			role=Role.objects.get(
				slug="PROJECT_MANAGER",
			),
		)
		task = Task.objects.create(
			title="Tâche assignée par l'admin",
			project=self.project,
			assigned_to=manager,
			created_by=self.creator,
		)

		self.assertFalse(
			TaskPermission().has_object_permission(
				self.build_request(manager, "PATCH", {"title": "Interdit"}),
				None,
				task,
			)
		)
