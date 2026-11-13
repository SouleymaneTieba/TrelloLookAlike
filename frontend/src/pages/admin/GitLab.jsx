import { useEffect, useMemo, useState } from "react";
import { Copy, GitBranch, Link2, Save, Trash2 } from "lucide-react";

import api from "../../services/api";

const webhookPath = "/api/git/gitlab/webhook/";

function GitLab() {
  const [projects, setProjects] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedProject = projects.find(
    (project) => String(project.id) === projectId
  );
  const selectedRepository = repositories.find(
    (repository) => String(repository.project) === projectId
  );
  const hasGitHubRepository = selectedRepository?.provider === "GITHUB";
  const webhookUrl = useMemo(
    () => `${window.location.protocol}//${window.location.hostname}:8000${webhookPath}`,
    []
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [projectsResponse, repositoriesResponse] = await Promise.all([
          api.get("/projects/"),
          api.get("/git/repositories/"),
        ]);
        setProjects(projectsResponse.data);
        setRepositories(repositoriesResponse.data);
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les projets et dépôts GitLab.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleProjectChange = (event) => {
    const nextProjectId = event.target.value;
    const repository = repositories.find(
      (item) => String(item.project) === nextProjectId
    );
    setProjectId(nextProjectId);
    setRepositoryUrl(repository?.url || "");
    setWebhookSecret("");
    setIsActive(repository?.is_active ?? true);
    setError("");
    setNotice("");
  };

  const handleGenerateSecret = () => {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    setWebhookSecret(
      Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
    );
    setNotice("");
  };

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copié.`);
    } catch (copyError) {
      console.error(copyError);
      setError(`Impossible de copier ${label.toLocaleLowerCase("fr")}.`);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedProject || hasGitHubRepository) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        project: selectedProject.id,
        url: repositoryUrl.trim(),
        is_active: isActive,
      };
      if (webhookSecret) payload.webhook_secret = webhookSecret;

      const { data } = await api.post("/git/repositories/", payload);
      setRepositories((current) => [
        ...current.filter((item) => item.project !== data.project),
        data,
      ]);
      setNotice("Dépôt GitLab enregistré. Configurez maintenant son webhook.");
    } catch (requestError) {
      console.error(requestError);
      const messages = Object.values(requestError.response?.data || {})
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .join(" ");
      setError(messages || "Impossible d’enregistrer le dépôt GitLab.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRepository) return;
    if (!window.confirm(`Dissocier le dépôt ${selectedRepository.provider} du projet « ${selectedProject.name} » ?`)) {
      return;
    }

    setError("");
    setNotice("");
    try {
      await api.delete(`/git/repositories/${selectedProject.id}/`);
      setRepositories((current) => current.filter(
        (repository) => repository.project !== selectedProject.id
      ));
      setRepositoryUrl("");
      setWebhookSecret("");
      setIsActive(true);
      setNotice("Dépôt dissocié du projet.");
    } catch (requestError) {
      console.error(requestError);
      setError("Impossible de dissocier le dépôt.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="mb-2 text-sm font-medium text-[#B6FF00]">Intégrations</p>
        <h1 className="text-3xl font-semibold text-[#F1F5F2]">GitLab</h1>
        <p className="mt-2 text-[#94A3A6]">
          Recevez une notification dans l’application à chaque push sur un dépôt associé à un projet.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-[#304800] bg-[#152400] p-4 text-sm text-[#B6FF00]">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5 text-sm text-[#94A3A6]">
          Chargement des projets…
        </p>
      ) : (
        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5 sm:p-6">
          {projects.length === 0 ? (
            <p className="text-sm text-[#94A3A6]">
              Aucun projet disponible. Créez un projet avant de configurer son dépôt GitLab.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="gitlab-project" className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Projet
                </label>
                <select
                  id="gitlab-project"
                  value={projectId}
                  onChange={handleProjectChange}
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                >
                  <option value="">Sélectionner un projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              {hasGitHubRepository ? (
                <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-200">
                  <p>
                    Ce projet est déjà associé au dépôt GitHub {selectedRepository.owner}/{selectedRepository.name}.
                    Il faut le dissocier avant de le remplacer par un dépôt GitLab.
                  </p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="mt-3 rounded-lg px-3 py-2 text-sm text-red-200 transition hover:bg-red-600 hover:text-white"
                  >
                    Dissocier le dépôt GitHub
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="gitlab-repository-url" className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                      URL du dépôt GitLab
                    </label>
                    <input
                      id="gitlab-repository-url"
                      type="url"
                      value={repositoryUrl}
                      onChange={(event) => setRepositoryUrl(event.target.value)}
                      required
                      placeholder="https://gitlab.com/groupe/projet"
                      className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
                    />
                  </div>

                  <div>
                    <label htmlFor="gitlab-webhook-secret" className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                      Token secret du webhook
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        id="gitlab-webhook-secret"
                        type="text"
                        value={webhookSecret}
                        onChange={(event) => setWebhookSecret(event.target.value)}
                        required={!selectedRepository?.has_webhook_secret}
                        minLength={32}
                        maxLength={255}
                        placeholder={selectedRepository ? "Laisser vide pour conserver le token actuel" : "Au moins 32 caractères"}
                        className="min-w-0 flex-1 rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateSecret}
                        className="rounded-xl border border-[#1C292D] px-4 py-3 text-sm text-[#94A3A6] transition hover:bg-[#10191C] hover:text-[#F1F5F2]"
                      >
                        Générer
                      </button>
                    </div>
                    {webhookSecret && (
                      <button
                        type="button"
                        onClick={() => handleCopy(webhookSecret, "Token secret")}
                        className="mt-2 inline-flex items-center gap-2 text-xs text-[#B6FF00] transition hover:text-[#C4FF33]"
                      >
                        <Copy size={13} />
                        Copier le token
                      </button>
                    )}
                    <p className="mt-2 text-xs text-[#647276]">
                      Ce token n’est jamais renvoyé par le serveur. Conservez-le et saisissez-le également dans GitLab.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 text-sm text-[#CBD5D7]">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(event) => setIsActive(event.target.checked)}
                      className="h-4 w-4 accent-[#B6FF00]"
                    />
                    Activer les notifications de push
                  </label>

                  {selectedRepository?.provider === "GITLAB" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1C292D] bg-[#10191C] p-4">
                      <div className="min-w-0">
                        <p className="text-xs text-[#647276]">Dépôt associé</p>
                        <p className="mt-1 truncate text-sm text-[#F1F5F2]">
                          {selectedRepository.owner}/{selectedRepository.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 transition hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 size={16} />
                        Dissocier
                      </button>
                    </div>
                  )}

                  <div className="rounded-xl border border-[#1C292D] bg-[#10191C] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Link2 size={16} className="text-[#B6FF00]" />
                      <h2 className="text-sm font-semibold text-[#F1F5F2]">Configurer le webhook dans GitLab</h2>
                    </div>
                    <ol className="list-inside list-decimal space-y-2 text-sm leading-6 text-[#94A3A6]">
                      <li>Enregistrez d’abord le dépôt et son token secret.</li>
                      <li>Dans GitLab, ouvrez le projet, puis <span className="text-[#CBD5D7]">Settings → Webhooks</span>.</li>
                      <li>Ajoutez l’URL ci-dessous, le même token secret, puis activez <span className="text-[#CBD5D7]">Push events</span>.</li>
                    </ol>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <code className="min-w-0 flex-1 break-all rounded-lg border border-[#1C292D] bg-[#0B1215] px-3 py-2.5 text-xs text-[#B6FF00]">
                        {webhookUrl}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(webhookUrl, "URL du webhook")}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#1C292D] px-3 py-2 text-sm text-[#94A3A6] transition hover:bg-[#0B1215] hover:text-[#F1F5F2]"
                      >
                        <Copy size={15} />
                        Copier l’URL
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-amber-200/80">
                      L’URL doit être accessible depuis GitLab. En local, remplacez le nom d’hôte par une adresse publique ou un tunnel sécurisé.
                    </p>
                  </div>

                  <div className="flex justify-end border-t border-[#1C292D] pt-4">
                    <button
                      type="submit"
                      disabled={saving || !projectId || hasGitHubRepository}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-[#050A0C] transition hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={17} />
                      {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 text-sm text-[#94A3A6]">
        <GitBranch size={18} className="mt-0.5 shrink-0 text-[#B6FF00]" />
        Les membres du projet recevront les notifications de push dans la cloche de notifications, y compris en temps réel lorsqu’ils sont connectés.
      </div>
    </div>
  );
}

export default GitLab;
