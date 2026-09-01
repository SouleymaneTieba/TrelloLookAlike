import hashlib
import hmac
import json

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from apps.notifications.models import Notification
from apps.notifications.services import NotificationService

from .models import GitRepository


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
                "project__team",
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

def handle_push(
    payload,
    git_repository,
):

    project = git_repository.project
    team = project.team

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

    NotificationService.create_for_team_members(

        team=team,

        notification_type=(
            Notification.NotificationType.SYSTEM
        ),

        title=(
            f"Nouveau push — "
            f"{git_repository.name}"
        ),

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
    team = project.team

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

    NotificationService.create_for_team_members(

        team=team,

        notification_type=(
            Notification.NotificationType.SYSTEM
        ),

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