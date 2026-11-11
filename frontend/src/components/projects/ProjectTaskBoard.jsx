import { useRef, useState } from "react";

import { CalendarDays, GripVertical, ListTodo, MessageCircle, Search, Send, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const COLUMNS = [
  { status: "TODO", title: "À faire" },
  { status: "IN_PROGRESS", title: "En cours" },
  { status: "BLOCKED", title: "Bloquées" },
  { status: "DONE", title: "Terminées" },
];

const STATUS_STYLES = {
  TODO: "bg-[#10191C] text-[#94A3A6] border-[#1C292D]",
  IN_PROGRESS: "bg-[#13231A] text-[#B6FF00] border-[#304800]",
  BLOCKED: "bg-[#2A1E0A] text-[#FFC107] border-[#4A3500]",
  DONE: "bg-[#152400] text-[#B6FF00] border-[#304800]",
};

const PRIORITY_STYLES = {
  LOW: "text-[#94A3A6]",
  MEDIUM: "text-[#C4D000]",
  HIGH: "text-[#FFC107]",
  URGENT: "text-[#FF4D4D]",
};

const STATUS_LABELS = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  BLOCKED: "Bloquée",
  DONE: "Terminée",
};

function ProjectTaskBoard({
  project,
  tasks,
  selectedTaskIds,
  loading,
  error: tasksError,
  onTaskUpdated,
  showTaskOwners = true,
  highlightedMemberId = null,
  highlightedMemberName = "",
  commentsReadOnly = false,
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [error, setError] = useState("");
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const activeTaskId = useRef(null);

  const projectTasks = tasks.filter(
    (task) => Number(task.project) === Number(project.id)
  );
  const boardTasks = projectTasks.filter(
    (task) => selectedTaskIds.includes(Number(task.id))
  );
  const detailTask = boardTasks.find((task) => Number(task.id) === Number(detailTaskId));
  const highlightedTaskCount = highlightedMemberId === null
    ? 0
    : boardTasks.filter((task) => Number(task.assigned_to) === Number(highlightedMemberId)).length;
  const filteredTasks = boardTasks.filter((task) => {
    const searchValue = search.trim().toLocaleLowerCase("fr");
    const matchesSearch = [
      task.title,
      task.description,
      task.assigned_username,
      task.created_by_username,
    ].some((value) => (value || "").toLocaleLowerCase("fr").includes(searchValue));

    return matchesSearch
      && (statusFilter === "ALL" || task.status === statusFilter)
      && (priorityFilter === "ALL" || task.priority === priorityFilter);
  });

  const canMoveTask = (task) => {
    if (user?.is_staff || user?.is_superuser) {
      return true;
    }

    const isProjectManager = project.project_manager_ids?.some(
      (managerId) => Number(managerId) === Number(user?.id)
    );
    const isProjectMember = project.members?.some(
      (memberId) => Number(memberId) === Number(user?.id)
    ) || project.member_details?.some(
      (member) => Number(member.id) === Number(user?.id)
    );

    return isProjectManager || isProjectMember
      || Number(task.assigned_to) === Number(user?.id)
      || Number(task.created_by) === Number(user?.id);
  };

  const updateTaskStatus = async (task, status) => {
    if (!canMoveTask(task) || task.status === status || updatingTaskId !== null) {
      return;
    }

    setUpdatingTaskId(task.id);
    setError("");

    try {
      const { data } = await api.patch(`/tasks/${task.id}/`, { status });
      onTaskUpdated(task, data);
    } catch (requestError) {
      console.error(requestError);
      const messages = Object.values(requestError.response?.data || {}).flat().join(" ");
      setError(messages || "Impossible de modifier le statut de la tâche.");
    } finally {
      setUpdatingTaskId(null);
      setDraggedTaskId(null);
    }
  };

  const handleDrop = async (event, status) => {
    event.preventDefault();
    setDragOverStatus(null);
    const taskId = event.dataTransfer.getData("text/plain") || String(draggedTaskId || "");
    const task = boardTasks.find((item) => String(item.id) === taskId);

    if (task) await updateTaskStatus(task, status);
  };

  const handleOpenComments = async (task) => {
    activeTaskId.current = task.id;
    setActiveTask(task);
    setTaskComments([]);
    setCommentDraft("");
    setCommentsError("");
    setCommentsLoading(true);

    try {
      const { data } = await api.get(`/tasks/${task.id}/comments/`);
      if (activeTaskId.current === task.id) {
        setTaskComments(data);
      }
    } catch (requestError) {
      console.error(requestError);
      if (activeTaskId.current === task.id) {
        setCommentsError("Impossible de charger les commentaires de cette tâche.");
      }
    } finally {
      if (activeTaskId.current === task.id) {
        setCommentsLoading(false);
      }
    }
  };

  const handleCloseComments = () => {
    activeTaskId.current = null;
    setActiveTask(null);
    setTaskComments([]);
    setCommentDraft("");
    setCommentsError("");
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    if (commentsReadOnly) return;
    const content = commentDraft.trim();
    if (!activeTask || !content || sendingComment) return;

    setSendingComment(true);
    setCommentsError("");
    try {
      const { data } = await api.post(
        `/tasks/${activeTask.id}/comments/`,
        { content }
      );
      setTaskComments((previous) => [...previous, data]);
      setCommentDraft("");
    } catch (requestError) {
      console.error(requestError);
      const messages = Object.values(requestError.response?.data || {}).flat().join(" ");
      setCommentsError(messages || "Impossible d’ajouter le commentaire.");
    } finally {
      setSendingComment(false);
    }
  };

  const formatDate = (date) => (
    date ? new Date(date.includes("T") ? date : `${date}T00:00:00`).toLocaleDateString("fr-FR") : "Pas de date de fin"
  );

  return (
    <section aria-labelledby="project-kanban-title" className="mt-5">
      <div className="mb-4 flex items-center gap-2">
        <ListTodo size={19} className="text-orange-500" />
        <h3 id="project-kanban-title" className="text-lg font-semibold text-[#F1F5F2]">
          Tableau des tâches
        </h3>
      </div>

      <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-4">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647276]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une tâche..."
              aria-label="Rechercher une tâche"
              className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-10 pr-4 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrer par statut"
            className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="BLOCKED">Bloquées</option>
            <option value="DONE">Terminées</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filtrer par priorité"
            className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <ListTodo size={18} className="text-[#B6FF00]" />
        <span className="text-sm text-[#94A3A6]">
          {filteredTasks.length} tâche(s) affichée(s) · {boardTasks.length} dans le tableau
        </span>
        {highlightedMemberId !== null && (
          <span className="ml-auto rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
            {highlightedTaskCount} tâche(s) assignée(s) à {highlightedMemberName || "cet utilisateur"}
          </span>
        )}
      </div>

      {tasksError ? (
        <p role="alert" className="mt-3 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
          {tasksError}
        </p>
      ) : loading ? (
        <p className="mt-3 rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 text-sm text-[#647276]">
          Chargement des tâches...
        </p>
      ) : error && (
        <p role="alert" className="mt-3 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {!tasksError && !loading && <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnTasks = filteredTasks.filter((task) => task.status === column.status);

          return (
            <section
              key={column.status}
              aria-label={`${column.title}, ${columnTasks.length} tâche(s)`}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverStatus(column.status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDragOverStatus(null);
                }
              }}
              onDrop={(event) => handleDrop(event, column.status)}
              className={`rounded-2xl border p-3 transition-colors ${
                dragOverStatus === column.status
                  ? "border-[#B6FF00] bg-[#152400]"
                  : "border-[#1C292D] bg-[#0B1215]"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1 py-2">
                <h4 className="font-semibold text-[#F1F5F2]">{column.title}</h4>
                <span className="rounded-full bg-[#10191C] px-2.5 py-1 text-xs text-[#94A3A6]">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnTasks.length === 0 ? (
                  <div className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-[#26363A] px-3 py-2 text-center text-sm text-[#647276]">
                    {boardTasks.length === 0
                      ? "Aucune tâche à afficher dans ce tableau"
                      : filteredTasks.length === 0
                        ? "Aucune tâche ne correspond aux filtres"
                        : "Déposer une tâche ici"}
                  </div>
                ) : columnTasks.map((task) => {
                  const isDone = task.status === "DONE";
                  const canDrag = canMoveTask(task) && updatingTaskId !== task.id;
                  const taskDate = task.end_date || task.deadline;
                  const isHighlighted = highlightedMemberId !== null
                    && Number(task.assigned_to) === Number(highlightedMemberId);
                  const isDimmed = highlightedMemberId !== null && !isHighlighted;

                  return (
                    <article
                      key={task.id}
                      draggable={canDrag}
                      onDragStart={(event) => {
                        if (!canDrag) {
                          event.preventDefault();
                          return;
                        }
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", String(task.id));
                        setDraggedTaskId(task.id);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onDrop={(event) => {
                        event.stopPropagation();
                        handleDrop(event, column.status);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverStatus(null);
                      }}
                      onClick={() => setDetailTaskId(task.id)}
                      title={canDrag ? "Cliquer pour afficher les détails · Glisser pour déplacer" : "Cliquer pour afficher les détails"}
                      className={`rounded-xl border border-[#1C292D] bg-[#0B1215] p-1 transition hover:border-orange-300 hover:bg-[#FFF3EB] ${
                        canDrag ? "cursor-grab active:cursor-grabbing" : ""
                      } ${draggedTaskId === task.id ? "opacity-50" : ""} ${
                        isHighlighted ? "border-orange-400 bg-orange-500/10 ring-2 ring-orange-500/50 shadow-lg shadow-orange-500/10" : ""
                      } ${isDimmed ? "opacity-45" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {canDrag && (
                          <GripVertical size={16} className="shrink-0 text-[#647276]" aria-hidden="true" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailTaskId(task.id)}
                              className={`min-w-0 flex-1 truncate text-left text-sm font-semibold hover:text-orange-300 ${isDone ? "text-[#647276] line-through" : "text-[#F1F5F2]"}`}
                            >
                              {task.title}
                            </button>
                            {taskDate && (
                              <span className="flex shrink-0 items-center gap-1 text-[11px] text-[#94A3A6]">
                                <CalendarDays size={12} aria-hidden="true" />
                                Échéance : {formatDate(taskDate)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenComments(task);
                              }}
                              aria-label={`Afficher les commentaires de ${task.title}`}
                              title="Commentaires"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#94A3A6] transition hover:bg-orange-500/10 hover:text-orange-300"
                            >
                              <MessageCircle size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>}

      {detailTask && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setDetailTaskId(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-details-title"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#1C292D] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">Détails de la tâche</p>
                <h3 id="task-details-title" className="mt-1 break-words text-lg font-semibold text-[#F1F5F2]">
                  {detailTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailTaskId(null)}
                aria-label="Fermer les détails de la tâche"
                className="rounded-lg p-2 text-[#647276] transition hover:bg-[#10191C] hover:text-white"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-5 p-5 sm:p-6">
              {detailTask.description && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-[#94A3A6]">Description</h4>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#CBD5D7]">
                    {detailTask.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[detailTask.status] || STATUS_STYLES.TODO}`}>
                  {STATUS_LABELS[detailTask.status] || detailTask.status}
                </span>
                <span className={`rounded-full border border-[#1C292D] bg-[#10191C] px-3 py-1 text-xs font-semibold ${PRIORITY_STYLES[detailTask.priority] || PRIORITY_STYLES.MEDIUM}`}>
                  Priorité : {detailTask.priority_label || detailTask.priority}
                </span>
              </div>

              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {showTaskOwners && (
                  <>
                    <div>
                      <dt className="text-xs text-[#647276]">Projet</dt>
                      <dd className="mt-1 text-[#CBD5D7]">{detailTask.project_name || project.name}</dd>
                    </div>
                    {detailTask.feature_title && (
                      <div>
                        <dt className="text-xs text-[#647276]">Fonctionnalité</dt>
                        <dd className="mt-1 text-[#CBD5D7]">{detailTask.feature_title}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-[#647276]">Assignée à</dt>
                      <dd className="mt-1 text-[#CBD5D7]">{detailTask.assigned_username || "Non assignée"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#647276]">Créée par</dt>
                      <dd className="mt-1 text-[#CBD5D7]">{detailTask.created_by_username || "Inconnu"}</dd>
                    </div>
                  </>
                )}
                {detailTask.start_date && (
                  <div>
                    <dt className="text-xs text-[#647276]">Date de début</dt>
                    <dd className="mt-1 text-[#CBD5D7]">{formatDate(detailTask.start_date)}</dd>
                  </div>
                )}
                {(detailTask.end_date || detailTask.deadline) && (
                  <div>
                    <dt className="text-xs text-[#647276]">Date de fin</dt>
                    <dd className="mt-1 text-[#CBD5D7]">{formatDate(detailTask.end_date || detailTask.deadline)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        </div>
      )}

      {activeTask && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={handleCloseComments}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-comments-title"
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#1C292D] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">Commentaires de la tâche</p>
                <h3 id="task-comments-title" className="mt-1 truncate text-lg font-semibold text-[#F1F5F2]">
                  {activeTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseComments}
                aria-label="Fermer les commentaires"
                className="rounded-lg p-2 text-[#647276] transition hover:bg-[#10191C] hover:text-white"
              >
                <X size={20} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              {commentsError && (
                <p role="alert" className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
                  {commentsError}
                </p>
              )}
              {commentsLoading ? (
                <p className="py-10 text-center text-sm text-[#647276]">Chargement des commentaires…</p>
              ) : taskComments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#26363A] px-4 py-10 text-center text-sm text-[#647276]">
                  {commentsReadOnly
                    ? "Aucun commentaire pour cette tâche."
                    : "Aucun commentaire pour cette tâche. Soyez le premier à commenter."}
                </p>
              ) : (
                <div className="space-y-4">
                  {taskComments.map((comment) => {
                    const authorName = [
                      comment.author_first_name,
                      comment.author_last_name,
                    ].filter(Boolean).join(" ") || comment.author_username || "Utilisateur supprimé";
                    const initials = authorName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toLocaleUpperCase("fr");

                    return (
                      <article key={comment.id} className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500/15 text-xs font-semibold text-orange-300">
                          {comment.author_avatar ? (
                            <img src={comment.author_avatar} alt="" className="h-full w-full object-cover" />
                          ) : initials}
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className="text-sm font-semibold text-[#F1F5F2]">{authorName}</p>
                            <time dateTime={comment.created_at} className="text-xs text-[#647276]">
                              {new Date(comment.created_at).toLocaleString("fr-FR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </time>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#CBD5D7]">
                            {comment.content}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {!commentsReadOnly && (
            <form onSubmit={handleSubmitComment} className="border-t border-[#1C292D] p-4 sm:p-5">
              <label htmlFor="task-comment-draft" className="sr-only">Votre commentaire</label>
              <textarea
                id="task-comment-draft"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                maxLength={5000}
                rows={3}
                placeholder="Écrire un commentaire..."
                className="w-full resize-y rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-orange-500"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-[#647276]">{commentDraft.length}/5000</span>
                <button
                  type="submit"
                  disabled={sendingComment || !commentDraft.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} />
                  {sendingComment ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default ProjectTaskBoard;
