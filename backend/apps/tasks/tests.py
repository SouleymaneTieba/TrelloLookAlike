from types import SimpleNamespace

from django.test import TestCase
from rest_framework.test import APIClient

from apps.projects.models import Project
from apps.tasks.models import Feature, Task, TaskComment
from apps.tasks.permissions import TaskPermission
from apps.teams.models import Role, Team, TeamMember
from apps.users.models import User


class TaskPermissionTests(TestCase):

	def setUp(self):
		self.manager_role = Role.objects.create(
			slug="PROJECT_MANAGER",
			label="Chef de projet",
		)
		self.team = Team.objects.create(name="Équipe Alpha")

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

		self.project = Project.objects.create(
			name="Projet test",
			created_by=self.creator,
		)
		self.project.members.add(self.assignee, self.creator)
		self.feature = Feature.objects.create(project=self.project, title="Fonctionnalité test", created_by=self.creator)

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
			feature=self.feature,
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
			feature=self.feature,
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
			role=self.manager_role,
		)
		self.project.members.add(manager)
		task = Task.objects.create(
			title="Tâche assignée par l'admin",
			project=self.project,
			feature=self.feature,
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


class TaskCommentAPITests(TestCase):

	def setUp(self):
		self.member = User.objects.create_user(
			username="commenter",
			email="commenter@example.com",
		)
		self.other_member = User.objects.create_user(
			username="other",
			email="other@example.com",
		)
		self.outsider = User.objects.create_user(
			username="outsider",
			email="outsider@example.com",
		)
		self.project = Project.objects.create(name="Projet commentaires")
		self.project.members.add(self.member, self.other_member)
		self.feature = Feature.objects.create(project=self.project, title="Fonctionnalité")
		self.task = Task.objects.create(
			title="Tâche commentée",
			project=self.project,
			feature=self.feature,
			created_by=self.member,
		)
		self.client = APIClient()

	def test_project_member_can_post_and_read_task_comments(self):
		self.client.force_authenticate(user=self.member)

		create_response = self.client.post(
			f"/api/tasks/{self.task.id}/comments/",
			{"content": "  Commentaire du membre  "},
			format="json",
		)

		self.assertEqual(create_response.status_code, 201)
		self.assertEqual(create_response.data["content"], "Commentaire du membre")
		self.assertEqual(create_response.data["author_username"], self.member.username)

		list_response = self.client.get(f"/api/tasks/{self.task.id}/comments/")

		self.assertEqual(list_response.status_code, 200)
		self.assertEqual(len(list_response.data), 1)
		self.assertEqual(list_response.data[0]["id"], create_response.data["id"])

	def test_project_member_cannot_post_empty_comment(self):
		self.client.force_authenticate(user=self.member)

		response = self.client.post(
			f"/api/tasks/{self.task.id}/comments/",
			{"content": "  "},
			format="json",
		)

		self.assertEqual(response.status_code, 400)

	def test_non_member_cannot_read_or_post_task_comments(self):
		TaskComment.objects.create(
			task=self.task,
			author=self.member,
			content="Visible uniquement aux membres du projet.",
		)
		self.client.force_authenticate(user=self.outsider)

		list_response = self.client.get(f"/api/tasks/{self.task.id}/comments/")
		create_response = self.client.post(
			f"/api/tasks/{self.task.id}/comments/",
			{"content": "Intrusion"},
			format="json",
		)

		self.assertEqual(list_response.status_code, 404)
		self.assertEqual(create_response.status_code, 404)
