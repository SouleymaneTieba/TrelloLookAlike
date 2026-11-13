from django.urls import path

from .views import (
    GitLabRepositoryConfigDetailView,
    GitLabRepositoryConfigView,
    github_webhook,
    gitlab_webhook,
)


urlpatterns = [

    path(
        "gitlab/webhook/",
        gitlab_webhook,
        name="gitlab-webhook",
    ),
    path(
        "repositories/",
        GitLabRepositoryConfigView.as_view(),
        name="git-repositories",
    ),
    path(
        "repositories/<int:project_id>/",
        GitLabRepositoryConfigDetailView.as_view(),
        name="git-repository-detail",
    ),
    path(
        "webhook/",
        github_webhook,
        name="github-webhook",
    ),

]