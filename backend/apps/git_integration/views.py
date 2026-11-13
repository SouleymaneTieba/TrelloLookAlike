import hashlib
import hmac
import json

from django.conf import settings
from django.contrib.auth.hashers import check_password, identify_hasher, make_password
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.notifications.services import NotificationService

from .models import GitRepository
from .serializers import GitLabRepositoryConfigSerializer


def gitlab_token_matches(provided_token, stored_token):
    try:
        identify_hasher(stored_token)
    except ValueError:
        return hmac.compare_digest(provided_token, stored_token)
    return check_password(provided_token, stored_token)


class GitLabRepositoryConfigView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        repositories = (
            GitRepository.objects
            .select_related("project")
            .order_by("project__name")
        )
        return Response([
            {
                "project": repository.project_id,
                "project_name": repository.project.name,
                "provider": repository.provider,
                "owner": repository.owner,
                "name": repository.name,
                "url": repository.url,
                "is_active": repository.is_active,
                "has_webhook_secret": bool(repository.webhook_secret),
            }
            for repository in repositories
        ])

    def post(self, request):
        serializer = GitLabRepositoryConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        defaults = {
            "provider": GitRepository.Provider.GITLAB,
            "owner": values["repository_owner"],
            "name": values["repository_name"],
            "url": values["url"],
            "is_active": values["is_active"],
        }
        if values.get("webhook_secret"):
            defaults["webhook_secret"] = make_password(
                values["webhook_secret"]
            )

        repository, created = GitRepository.objects.update_or_create(
            project=values["project"],
            defaults=defaults,
        )
        return Response(
            {
                "project": repository.project_id,
                "project_name": repository.project.name,
                "provider": repository.provider,
                "owner": repository.owner,
                "name": repository.name,
                "url": repository.url,
                "is_active": repository.is_active,
                "has_webhook_secret": bool(repository.webhook_secret),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class GitLabRepositoryConfigDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, project_id):
        deleted_count, _ = GitRepository.objects.filter(
            project_id=project_id,
        ).delete()
        if not deleted_count:
            return Response(
                {"detail": "Aucun dépôt n’est associé à ce projet."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


@csrf_exempt
def gitlab_webhook(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    if not isinstance(payload, dict):
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    project_data = payload.get("project")
    if not isinstance(project_data, dict):
        project_data = payload.get("repository")
    if not isinstance(project_data, dict):
        return JsonResponse({"error": "Repository information missing"}, status=400)

    repository_path = project_data.get("path_with_namespace")
    if not isinstance(repository_path, str) or "/" not in repository_path:
        return JsonResponse({"error": "Repository information missing"}, status=400)

    owner, repository_name = repository_path.rsplit("/", 1)
    git_repository = (
        GitRepository.objects
        .select_related("project")
        .filter(
            provider=GitRepository.Provider.GITLAB,
            owner=owner,
            name=repository_name,
            is_active=True,
        )
        .first()
    )
    provided_token = request.headers.get("X-Gitlab-Token", "")
    if (
        git_repository is None
        or not provided_token
        or not gitlab_token_matches(
            provided_token,
            git_repository.webhook_secret,
        )
    ):
        return JsonResponse({"error": "Invalid webhook token"}, status=403)

    event = request.headers.get("X-Gitlab-Event", "")
    if event != "Push Hook":
        return JsonResponse({
            "success": True,
            "event": event,
            "message": "Event received but not handled.",
        })

    ref = payload.get("ref", "")
    branch = (
        ref.removeprefix("refs/heads/")
        if isinstance(ref, str)
        else "inconnue"
    ) or "inconnue"
    commits = payload.get("commits")
    commits = commits if isinstance(commits, list) else []
    commit_count = payload.get("total_commits_count")
    if (
        not isinstance(commit_count, int)
        or isinstance(commit_count, bool)
        or commit_count < 0
    ):
        commit_count = len(commits)

    author_name = (
        payload.get("user_name")
        or payload.get("user_username")
        or "Un utilisateur"
    )
    commit_word = "commit" if commit_count == 1 else "commits"
    message = (
        f"{author_name} a poussé {commit_count} {commit_word} "
        f"sur la branche « {branch} »."
    )
    notify_project_members(
        git_repository.project,
        title=f"Nouveau push — {git_repository.name}",
        message=message,
        link=git_repository.url,
        notification_type=Notification.NotificationType.GITLAB_PUSH,
    )
    return JsonResponse({
        "success": True,
        "event": "push",
        "repository": f"{owner}/{repository_name}",
        "project": git_repository.project.name,
        "branch": branch,
        "commits": commit_count,
    })


# ======================================================
# WEBHOOK GITHUB
# ======================================================

@csrf_exempt
def github_webhook(request):

    # ==================================================
    # MÉTHODE HTTP
    # ==================================================

    if request.method != "POST":

        return JsonResponse(
            {
                "error": "Method not allowed",
            },
            status=405,
        )

    # ==================================================
    # PAYLOAD BRUT
    # ==================================================

    payload_body = request.body

    # ==================================================
    # SIGNATURE GITHUB
    # ==================================================

    signature = request.headers.get(
        "X-Hub-Signature-256"
    )

    if not signature:

        return JsonResponse(
            {
                "error": "Missing signature",
            },
            status=403,
        )

    # ==================================================
    # JSON
    # ==================================================

    try:

        payload = json.loads(
            payload_body.decode("utf-8")
        )

    except (
        json.JSONDecodeError,
        UnicodeDecodeError,
    ):

        return JsonResponse(
            {
                "error": "Invalid JSON payload",
            },
            status=400,
        )

    # ==================================================
    # REPOSITORY
    # ==================================================

    repository_data = payload.get(
        "repository",
        {}
    )

    owner = (
        repository_data
        .get("owner", {})
        .get("login")
    )

    repository_name = repository_data.get(
        "name"
    )

    if not owner or not repository_name:

        return JsonResponse(
            {
                "error":
                    "Repository information missing",
            },
            status=400,
        )

    # ==================================================
    # TROUVER LE DÉPÔT
    # ==================================================

    try:

        git_repository = (
            GitRepository.objects
            .select_related(
                "project",
            )
            .get(
                owner=owner,
                name=repository_name,
                is_active=True,
            )
        )

    except GitRepository.DoesNotExist:

        return JsonResponse(
            {
                "error":
                    "Repository not registered",
            },
            status=404,
        )

    # ==================================================
    # SECRET
    # ==================================================

    secret = (
        git_repository.webhook_secret
        or settings.GITHUB_WEBHOOK_SECRET
    )

    if not secret:

        return JsonResponse(
            {
                "error":
                    "Webhook secret not configured",
            },
            status=500,
        )

    # ==================================================
    # VÉRIFICATION SIGNATURE
    # ==================================================

    expected_signature = (
        "sha256="
        + hmac.new(
            secret.encode("utf-8"),
            payload_body,
            hashlib.sha256,
        ).hexdigest()
    )

    if not hmac.compare_digest(
        signature,
        expected_signature,
    ):

        return JsonResponse(
            {
                "error": "Invalid signature",
            },
            status=403,
        )

    # ==================================================
    # ÉVÉNEMENT
    # ==================================================

    event = request.headers.get(
        "X-GitHub-Event"
    )

    # ==================================================
    # PUSH
    # ==================================================

    if event == "push":

        return handle_push(
            payload,
            git_repository,
        )

    # ==================================================
    # PULL REQUEST
    # ==================================================

    if event == "pull_request":

        return handle_pull_request(
            payload,
            git_repository,
        )

    # ==================================================
    # ÉVÉNEMENT NON GÉRÉ
    # ==================================================

    return JsonResponse(
        {
            "success": True,
            "event": event,
            "message":
                "Event received but not handled.",
        },
        status=200,
    )


# ======================================================
# TRAITEMENT PUSH
# ======================================================

def notify_project_members(
    project,
    title,
    message,
    link,
    notification_type=Notification.NotificationType.SYSTEM,
):
    for member in project.members.filter(is_active=True):
        NotificationService.create(
            user=member,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link,
        )

def handle_push(
    payload,
    git_repository,
):

    project = git_repository.project

    # ==================================================
    # BRANCHE
    # ==================================================

    ref = payload.get(
        "ref",
        "",
    )

    branch = ref.replace(
        "refs/heads/",
        "",
    )

    # ==================================================
    # COMMITS
    # ==================================================

    commits = payload.get(
        "commits",
        [],
    )

    commit_count = len(
        commits
    )

    # ==================================================
    # AUTEUR
    # ==================================================

    pusher = payload.get(
        "pusher",
        {},
    )

    author_name = (
        pusher.get("name")
        or pusher.get("email")
        or "Un utilisateur"
    )

    # ==================================================
    # URL REPOSITORY
    # ==================================================

    repository_data = payload.get(
        "repository",
        {}
    )

    repository_url = (
        repository_data.get("html_url")
        or git_repository.url
    )

    # ==================================================
    # MESSAGE
    # ==================================================

    if commit_count == 1:

        message = (
            f"{author_name} a poussé "
            f"1 commit sur la branche "
            f"« {branch} »."
        )

    else:

        message = (
            f"{author_name} a poussé "
            f"{commit_count} commits sur la branche "
            f"« {branch} »."
        )

    # ==================================================
    # NOTIFICATION
    # ==================================================

    notify_project_members(
        project,
        title=f"Nouveau push — {git_repository.name}",
        message=message,
        link=repository_url,
    )

    # ==================================================
    # LOG
    # ==================================================

    print(
        "=========================================="
    )

    print(
        "GitHub PUSH"
    )

    print(
        f"Repository : "
        f"{git_repository.owner}/"
        f"{git_repository.name}"
    )

    print(
        f"Project    : {project.name}"
    )

    print(
        f"Branch     : {branch}"
    )

    print(
        f"Author     : {author_name}"
    )

    print(
        f"Commits    : {commit_count}"
    )

    print(
        "Notifications envoyées"
    )

    print(
        "=========================================="
    )

    # ==================================================
    # RÉPONSE
    # ==================================================

    return JsonResponse(
        {
            "success": True,
            "event": "push",
            "repository": (
                f"{git_repository.owner}/"
                f"{git_repository.name}"
            ),
            "project": project.name,
            "branch": branch,
            "commits": commit_count,
        },
        status=200,
    )


# ======================================================
# TRAITEMENT PULL REQUEST
# ======================================================

def handle_pull_request(
    payload,
    git_repository,
):

    project = git_repository.project

    # ==================================================
    # DONNÉES PULL REQUEST
    # ==================================================

    pull_request = payload.get(
        "pull_request",
        {},
    )

    action = payload.get(
        "action",
        "",
    )

    # ==================================================
    # INFORMATIONS
    # ==================================================

    title = (
        pull_request.get("title")
        or "Pull Request"
    )

    number = pull_request.get(
        "number"
    )

    html_url = (
        pull_request.get("html_url")
        or git_repository.url
    )

    # ==================================================
    # AUTEUR
    # ==================================================

    user = pull_request.get(
        "user",
        {},
    )

    author_name = (
        user.get("login")
        or "Un utilisateur"
    )

    # ==================================================
    # BRANCHES
    # ==================================================

    base = pull_request.get(
        "base",
        {},
    )

    head = pull_request.get(
        "head",
        {},
    )

    base_branch = (
        base.get("ref")
        or "?"
    )

    head_branch = (
        head.get("ref")
        or "?"
    )

    # ==================================================
    # MESSAGE
    # ==================================================

    if action == "opened":

        notification_title = (
            f"Nouvelle Pull Request — "
            f"{git_repository.name}"
        )

        message = (
            f"{author_name} a ouvert la Pull Request "
            f"#{number} « {title} » : "
            f"{head_branch} → {base_branch}."
        )

    elif action == "reopened":

        notification_title = (
            f"Pull Request réouverte — "
            f"{git_repository.name}"
        )

        message = (
            f"{author_name} a réouvert la Pull Request "
            f"#{number} « {title} »."
        )

    elif action == "closed":

        merged = pull_request.get(
            "merged",
            False,
        )

        if merged:

            notification_title = (
                f"Pull Request fusionnée — "
                f"{git_repository.name}"
            )

            message = (
                f"{author_name} a fusionné la "
                f"Pull Request #{number} "
                f"« {title} »."
            )

        else:

            notification_title = (
                f"Pull Request fermée — "
                f"{git_repository.name}"
            )

            message = (
                f"{author_name} a fermé la "
                f"Pull Request #{number} "
                f"« {title} »."
            )

    elif action == "synchronize":

        notification_title = (
            f"Pull Request mise à jour — "
            f"{git_repository.name}"
        )

        message = (
            f"{author_name} a ajouté de nouveaux "
            f"commits à la Pull Request "
            f"#{number} « {title} »."
        )

    else:

        return JsonResponse(
            {
                "success": True,
                "event": "pull_request",
                "action": action,
                "message":
                    "Pull Request event received "
                    "but not handled.",
            },
            status=200,
        )

    # ==================================================
    # NOTIFICATION
    # ==================================================

    notify_project_members(
        project,
        title=notification_title,
        message=message,
        link=html_url,
    )

    # ==================================================
    # LOG
    # ==================================================

    print(
        "=========================================="
    )

    print(
        "GitHub PULL REQUEST"
    )

    print(
        f"Repository : "
        f"{git_repository.owner}/"
        f"{git_repository.name}"
    )

    print(
        f"Project    : {project.name}"
    )

    print(
        f"Action     : {action}"
    )

    print(
        f"PR         : #{number}"
    )

    print(
        f"Title      : {title}"
    )

    print(
        f"Author     : {author_name}"
    )

    print(
        "Notifications envoyées"
    )

    print(
        "=========================================="
    )

    # ==================================================
    # RÉPONSE
    # ==================================================

    return JsonResponse(
        {
            "success": True,
            "event": "pull_request",
            "action": action,
            "repository": (
                f"{git_repository.owner}/"
                f"{git_repository.name}"
            ),
            "project": project.name,
            "pull_request": number,
        },
        status=200,
    )
