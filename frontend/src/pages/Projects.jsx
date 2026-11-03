import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Layers3,
  ListTodo,
  Plus,
  Search,
  Users,
} from "lucide-react";

import ProjectTaskBoard from "../components/projects/ProjectTaskBoard";
import api from "../services/api";

function Projects() {

  const [projects, setProjects] =
    useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [projectTasks, setProjectTasks] = useState([]);
  const [boardTaskIds, setBoardTaskIds] = useState([]);
  const [projectFeatures, setProjectFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);
  const [projectTasksError, setProjectTasksError] = useState("");

  const getMemberInitials = (member) => {
    const nameParts = [member.first_name, member.last_name].filter(Boolean);
    const initials = nameParts.length
      ? nameParts.map((part) => part[0]).join("")
      : (member.username || "?").slice(0, 2);

    return initials.toLocaleUpperCase("fr");
  };


  // ==========================================
  // CHARGER LES PROJETS
  // ==========================================

  const fetchProjects = async () => {

    try {

      setLoading(true);
      setError("");

      const projectsResponse = await api.get("/projects/");

      setProjects(
        projectsResponse.data
      );

    } catch (error) {

      console.error(error);

      setError(
        "Impossible de récupérer les projets."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchProjects();

  }, []);

  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const filteredProjects = projects.filter((project) =>
    [project.name, project.description].some((value) =>
      (value || "").toLocaleLowerCase("fr").includes(normalizedSearch)
    )
  );
  const projectManager = selectedProject?.member_details?.find((member) =>
    selectedProject.project_manager_ids?.some(
      (managerId) => Number(managerId) === Number(member.id)
    )
  );
  const projectProgress = (selectedProject?.task_count ?? 0) > 0
    ? Math.round(
        ((selectedProject.completed_task_count ?? 0) / selectedProject.task_count) * 100
      )
    : 0;


  useEffect(() => {
    const selectedProjectId = selectedProject?.id;

    if (!selectedProjectId) {
      setProjectTasks([]);
      setBoardTaskIds([]);
      setProjectFeatures([]);
      setSelectedFeature(null);
      setProjectTasksError("");
      return;
    }

    let isMounted = true;
    setBoardTaskIds([]);
    setSelectedFeature(null);
    setLoadingProjectTasks(true);
    setProjectTasksError("");

    Promise.all([api.get("/tasks/"), api.get("/features/")])
      .then(([tasksResponse, featuresResponse]) => {
        if (isMounted) {
          setProjectTasks(tasksResponse.data.filter((task) => Number(task.project) === Number(selectedProjectId)));
          setProjectFeatures(featuresResponse.data.filter((feature) => Number(feature.project) === Number(selectedProjectId)));
          setSelectedFeature(null);
        }
      })
      .catch((requestError) => {
        console.error(requestError);
        if (isMounted) {
          setProjectTasksError("Impossible de récupérer les tâches de ce projet.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingProjectTasks(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProject?.id]);

  const handleProjectTaskUpdated = (previousTask, updatedTask) => {
    setProjectTasks((previous) =>
      previous.map((task) => task.id === updatedTask.id ? updatedTask : task)
    );

    const completedDelta = Number(updatedTask.status === "DONE") - Number(previousTask.status === "DONE");
    if (!completedDelta) return;

    const updateFeatureProgress = (feature) => {
      if (!feature || Number(feature.id) !== Number(updatedTask.feature)) return feature;
      const completed_subtask_count = Math.max(0, (feature.completed_subtask_count || 0) + completedDelta);
      return {
        ...feature,
        completed_subtask_count,
        progress: feature.subtask_count
          ? Math.round(completed_subtask_count * 100 / feature.subtask_count)
          : 0,
      };
    };

    setProjectFeatures((previous) => previous.map(updateFeatureProgress));
    setSelectedFeature(updateFeatureProgress);
    setSelectedProject((project) => project
      ? { ...project, completed_task_count: Math.max(0, (project.completed_task_count || 0) + completedDelta) }
      : project
    );
    setProjects((previous) => previous.map((project) => (
      Number(project.id) === Number(updatedTask.project)
        ? { ...project, completed_task_count: Math.max(0, (project.completed_task_count || 0) + completedDelta) }
        : project
    )));
  };

  const toggleBoardTask = (taskId) => {
    setBoardTaskIds((previous) => (
      previous.includes(Number(taskId))
        ? previous.filter((id) => id !== Number(taskId))
        : [...previous, Number(taskId)]
    ));
  };


  // ==========================================
  // STATUS
  // ==========================================

  const getStatusStyle = (
    status
  ) => {

    switch (status) {

      case "PLANNED":
      case "IN_PROGRESS":
      case "COMPLETED":
      case "ARCHIVED":
        return "border-orange-500/40 bg-orange-500/10 text-orange-300";

      default:

        return "border-orange-500/40 bg-orange-500/10 text-orange-300";

    }

  };


  // ==========================================
  // ICON STATUS
  // ==========================================

  const getStatusIcon = (
    status
  ) => {

    switch (status) {

      case "COMPLETED":

        return CheckCircle2;

      case "IN_PROGRESS":

        return Clock3;

      default:

        return FolderKanban;

    }

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="flex min-h-[400px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1C292D] border-t-[#B6FF00]" />

          <p className="mt-4 text-sm text-[#647276]">
            Chargement des projets...
          </p>

        </div>

      </div>

    );

  }


  return (

    <div>


      {/* ======================================
          HEADER
      ======================================= */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {selectedProject && (
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Retour aux projets"
                title="Retour aux projets"
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#1C292D] text-[#94A3A6] transition hover:bg-[#10191C] hover:text-[#F1F5F2]"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="min-w-0">
              <p className="mb-2 text-sm font-medium text-[#B6FF00]">
                {selectedProject ? "Détails du projet" : "Espace de travail"}
              </p>
              <h1 className="break-words text-3xl font-semibold text-[#F1F5F2]">
                {selectedProject?.name || "Projets"}
              </h1>
              {!selectedProject && (
                <p className="mt-2 text-[#94A3A6]">
                  Consultez les projets auxquels vous participez.
                </p>
              )}
            </div>
          </div>

          {selectedProject && (
            <div className="mt-3 pl-12">
              <p className="line-clamp-2 text-sm text-[#94A3A6]">
                {selectedProject.description || "Aucune description pour ce projet."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#94A3A6]">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(selectedProject.status)}`}>
                  {selectedProject.status_label || selectedProject.status}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-orange-500" />
                  Échéance : {selectedProject.end_date
                    ? new Date(`${selectedProject.end_date}T00:00:00`).toLocaleDateString("fr-FR")
                    : "Non définie"}
                </span>
                <span>Début : {selectedProject.start_date
                  ? new Date(`${selectedProject.start_date}T00:00:00`).toLocaleDateString("fr-FR")
                  : "Non définie"}</span>
                <span>{selectedProject.completed_task_count ?? 0}/{selectedProject.task_count ?? 0} tâche(s) terminée(s)</span>
                <span>{selectedProject.member_details?.length ?? selectedProject.members?.length ?? 0} membre(s)</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 min-w-32 flex-1 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-orange-300 transition-all"
                    style={{ width: `${projectProgress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-orange-400">
                  Progression {projectProgress}%
                </span>
              </div>
            </div>
          )}
        </div>

        {selectedProject && (
          <div className="flex shrink-0 items-center gap-3 lg:pt-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#152400] text-sm font-semibold text-[#B6FF00]">
              {projectManager ? getMemberInitials(projectManager) : "—"}
            </span>
            <span className="text-sm text-[#94A3A6]">
              <span className="block text-xs text-[#647276]">Chef de projet</span>
              {projectManager
                ? [projectManager.first_name, projectManager.last_name]
                    .filter(Boolean)
                    .join(" ") || projectManager.username
                : "Non défini"}
            </span>
          </div>
        )}
      </div>


      {/* ======================================
          ERROR
      ======================================= */}

      {error && (

        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

          {error}

        </div>

      )}


      {/* ======================================
          STATS
      ======================================= */}

          <div className={`mt-8 grid gap-5 sm:grid-cols-3 ${selectedProject ? "hidden" : ""}`}>


        {/* TOTAL */}

        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-[#647276]">
              Mes projets
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#152400]">

              <FolderKanban
                size={19}
                className="text-[#B6FF00]"
              />

            </div>

          </div>

          <p className="mt-3 text-3xl font-bold text-[#F1F5F2]">
            {projects.length}
          </p>

        </div>


        {/* IN PROGRESS */}

        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-[#647276]">
              En cours
            </p>

            <Clock3
              size={20}
              className="text-[#B6FF00]"
            />

          </div>

          <p className="mt-3 text-3xl font-bold text-[#B6FF00]">

            {
              projects.filter(
                (project) =>
                  project.status ===
                  "IN_PROGRESS"
              ).length
            }

          </p>

        </div>


        {/* COMPLETED */}

        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-[#647276]">
              Terminés
            </p>

            <CheckCircle2
              size={20}
              className="text-emerald-400"
            />

          </div>

          <p className="mt-3 text-3xl font-bold text-emerald-400">

            {
              projects.filter(
                (project) =>
                  project.status ===
                  "COMPLETED"
              ).length
            }

          </p>

        </div>

      </div>


      {/* ======================================
          PROJECTS
      ======================================= */}

      <div className={`mt-8 ${selectedProject ? "hidden" : ""}`}>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="font-semibold text-[#F1F5F2]">
            Tous les projets
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-72">
              <span className="sr-only">Rechercher un projet</span>
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#647276]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un projet..."
                className="w-full rounded-xl border border-[#1C292D] bg-[#0B1215] py-2.5 pl-10 pr-4 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
              />
            </label>

            <span className="text-sm text-[#647276]">
              {filteredProjects.length} projet
              {filteredProjects.length > 1 ? "s" : ""}
            </span>
          </div>

        </div>


        {projects.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">

              <FolderKanban
                size={25}
                className="text-[#B6FF00]"
              />

            </div>

            <h2 className="mt-5 font-semibold text-[#F1F5F2]">
              Aucun projet
            </h2>

            <p className="mt-2 text-sm text-[#647276]">
              Vous n'êtes actuellement membre d'aucun projet.
            </p>

          </div>

        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-12 text-center text-sm text-[#647276]">
            Aucun projet ne correspond à votre recherche.
          </div>
        ) : (

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredProjects.map(
              (project) => {

                const StatusIcon =
                  getStatusIcon(
                    project.status
                  );

                const taskCount =
                  project.task_count ?? 0;

                const completedTaskCount =
                  project.completed_task_count ?? 0;

                const progress = taskCount > 0
                  ? Math.round(
                      (completedTaskCount / taskCount) * 100
                    )
                  : 0;


                return (

                  <button
                    type="button"
                    key={project.id}
                    className="group w-full cursor-pointer rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#304800] focus:outline-none focus:ring-2 focus:ring-[#B6FF00]"
                    onClick={() => {
                      setBoardTaskIds([]);
                      setSelectedProject(project);
                    }}
                  >


                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#152400]">

                        <FolderKanban
                          size={20}
                          className="text-[#B6FF00]"
                        />

                      </div>


                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                          project.status
                        )}`}
                      >

                        <StatusIcon
                          size={13}
                        />

                        {project.status_label ||
                          project.status}

                      </span>

                    </div>


                    {/* NAME */}

                    <h3 className="mt-5 text-lg font-semibold text-[#F1F5F2]">

                      {project.name}

                    </h3>


                    {/* DESCRIPTION */}

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#647276]">

                      {project.description ||
                        "Aucune description."}

                    </p>


                    {/* TEAM */}

                    <div className="mt-5 flex items-center gap-2 text-sm text-[#94A3A6]">

                      <Users
                        size={16}
                        className="text-[#647276]"
                      />

                      <span>
                        {project.members?.length || 0} membre(s)
                      </span>

                    </div>


                    {/* DEADLINE */}

                    <div className="mt-4 flex items-center gap-2 border-t border-[#1C292D] pt-4 text-xs text-[#647276]">
                      <CalendarDays size={14} />
                      <span>Échéance :</span>
                      <span className="text-[#94A3A6]">
                        {project.end_date
                          ? new Date(`${project.end_date}T00:00:00`).toLocaleDateString("fr-FR")
                          : "Non définie"}
                      </span>
                    </div>


                    {/* TASK COUNT */}

                    <div className="mt-4 border-t border-[#1C292D] pt-4">

                      <div className="flex items-center justify-between text-xs">

                        <span className="text-[#647276]">
                          Progression
                        </span>

                        <span className="font-semibold text-orange-400">
                          {progress}%
                        </span>

                      </div>

                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full border border-black/15 bg-white"
                        role="progressbar"
                        aria-label={`Progression du projet ${project.name}`}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={progress}
                      >

                        <div
                          className="h-full rounded-full bg-orange-300 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />

                      </div>

                      <p className="mt-2 text-xs text-[#647276]">
                        {completedTaskCount} sur {taskCount} tâche
                        {taskCount > 1 ? "s" : ""} terminée
                        {completedTaskCount > 1 ? "s" : ""}
                      </p>

                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#1C292D] pt-4">

                      <span className="text-xs text-[#647276]">
                        Tâches
                      </span>

                      <span className="rounded-lg bg-[#10191C] px-2.5 py-1 text-xs font-medium text-[#94A3A6]">
                        {project.task_count ?? 0}
                      </span>

                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      {project.member_details?.length > 0 ? (
                        <div
                          className="flex items-center gap-1"
                          aria-label={`Membres du projet ${project.name}`}
                        >
                          {project.member_details.slice(0, 5).map((member) => {
                            const memberName = [member.first_name, member.last_name]
                              .filter(Boolean)
                              .join(" ") || member.username;
                            const memberRole = member.role_label || "Sans rôle";

                            return (
                              <span key={member.id} className="group/member relative">
                                <span
                                  title={`${memberName} — ${memberRole}`}
                                  aria-label={`${memberName}, ${memberRole}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#152400] text-[10px] font-semibold text-[#B6FF00]"
                                >
                                  {getMemberInitials(member)}
                                </span>
                                <span
                                  role="tooltip"
                                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 flex-col rounded-lg border border-[#1C292D] bg-[#10191C] px-3 py-2 text-left shadow-lg group-hover/member:flex"
                                >
                                  <span className="text-xs font-semibold text-[#F1F5F2]">
                                    {memberName}
                                  </span>
                                  <span className="mt-0.5 text-[11px] text-[#94A3A6]">
                                    {memberRole}
                                  </span>
                                </span>
                              </span>
                            );
                          })}
                          {project.member_details.length > 5 && (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10191C] text-[10px] font-semibold text-[#94A3A6]">
                              +{project.member_details.length - 5}
                            </span>
                          )}
                        </div>
                      ) : <span />}

                      <p className="text-right text-xs font-medium text-orange-400">
                        Cliquer pour voir tous les détails →
                      </p>
                    </div>

                  </button>

                );

              }
            )}

          </div>

        )}

      </div>

      {selectedProject && (
        <div className="mt-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <section aria-labelledby="project-features-title" className="flex h-[240px] min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-[#26363A] bg-[#10191C] p-5 shadow-2xl sm:p-6">
              <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
                <h3 id="project-features-title" className="flex items-center gap-2 text-base font-semibold text-[#F1F5F2]"><Layers3 size={18} className="text-orange-500" /> Fonctionnalités</h3>
                <span className="rounded-full bg-[#0B1215] px-2.5 py-1 text-xs text-[#94A3A6]">{projectFeatures.length}</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {loadingProjectTasks ? (
                <p className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 text-sm text-[#647276]">Chargement des fonctionnalités...</p>
              ) : projectTasksError ? (
                <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">{projectTasksError}</p>
              ) : projectFeatures.length === 0 ? (
                <p className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 text-sm text-[#647276]">Aucune fonctionnalité pour ce projet.</p>
              ) : (
                <div className="grid w-full gap-3">
                  {projectFeatures.map((feature) => (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => setSelectedFeature(feature)}
                      aria-pressed={Number(selectedFeature?.id) === Number(feature.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${Number(selectedFeature?.id) === Number(feature.id) ? "border-orange-500 bg-orange-500/10" : "border-[#1C292D] bg-[#0B1215] hover:border-orange-500/60 hover:bg-[#10191C]"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"><Layers3 size={18} /></span>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-[#F1F5F2]">{feature.title}</h4>
                          <p className="truncate text-xs text-[#647276]">{feature.completed_subtask_count}/{feature.subtask_count} tâches terminées</p>
                        </div>
                        <div className="w-32 shrink-0">
                          <span className="block text-right text-xs font-semibold text-orange-300">{feature.progress}%</span>
                          <div className="mt-1 h-2.5 overflow-hidden rounded-full border border-white/40 bg-white shadow-sm"><div className="h-full rounded-full bg-orange-500" style={{ width: `${feature.progress}%` }} /></div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              </div>
            </section>

            <section aria-labelledby="project-feature-tasks-title" className="flex h-[240px] min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-[#26363A] bg-[#10191C] p-5 shadow-2xl sm:p-6">
              <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="project-feature-tasks-title" className="flex items-center gap-2 text-base font-semibold text-[#F1F5F2]"><ListTodo size={18} className="text-orange-500" /> Tâches</h3>
                  {selectedFeature && <p className="mt-1 truncate text-sm text-[#94A3A6]">{selectedFeature.title}</p>}
                </div>
                {selectedFeature && <span className="rounded-full bg-[#0B1215] px-2.5 py-1 text-xs text-[#94A3A6]">{projectTasks.filter((task) => Number(task.feature) === Number(selectedFeature.id)).length}</span>}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {loadingProjectTasks ? (
                <p className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 text-sm text-[#647276]">Chargement des tâches...</p>
              ) : projectTasksError ? (
                <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">{projectTasksError}</p>
              ) : !selectedFeature ? (
                <p className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 text-sm text-[#647276]">Sélectionnez une fonctionnalité pour voir ses tâches.</p>
              ) : projectTasks.filter((task) => Number(task.feature) === Number(selectedFeature.id)).length === 0 ? (
                <p className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 text-sm text-[#647276]">Aucune tâche dans cette fonctionnalité.</p>
              ) : (
                <div className="space-y-3">
                  {projectTasks.filter((task) => Number(task.feature) === Number(selectedFeature.id)).map((task) => (
                    <article
                      key={task.id}
                      className="w-full rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-left transition hover:border-orange-500/60 hover:bg-[#10191C]"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-[#F1F5F2]">{task.title}</h4>
                          <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3">
                            {task.description
                              ? <p className="min-w-0 flex-1 whitespace-pre-wrap text-xs leading-5 text-[#647276]">{task.description}</p>
                              : <span className="flex-1" />}
                            {task.created_at && (
                              <span className="shrink-0 text-[11px] text-[#647276]">
                                Créé le {new Date(task.created_at).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${task.status === "DONE" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-orange-500/30 bg-orange-500/10 text-orange-300"}`}>{task.status_label || task.status}</span>
                          <button
                            type="button"
                            aria-pressed={boardTaskIds.includes(Number(task.id))}
                            onClick={() => toggleBoardTask(task.id)}
                            aria-label={boardTaskIds.includes(Number(task.id)) ? `Retirer « ${task.title} » du tableau` : `Ajouter « ${task.title} » au tableau`}
                            title={boardTaskIds.includes(Number(task.id)) ? "Retirer du tableau" : "Ajouter au tableau"}
                            className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                              boardTaskIds.includes(Number(task.id))
                                ? "bg-orange-500/15 text-orange-300 hover:bg-red-500/15 hover:text-red-300"
                                : "bg-orange-500 text-black hover:bg-orange-400"
                            }`}
                          >
                            {boardTaskIds.includes(Number(task.id)) ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#94A3A6]">
                        <span>Priorité : {task.priority_label || task.priority}</span>
                        {(task.end_date || task.deadline) && <span>Échéance : {new Date(task.end_date ? `${task.end_date}T00:00:00` : task.deadline).toLocaleDateString("fr-FR")}</span>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              </div>
            </section>
          </div>

          <div className="mt-8">
            <ProjectTaskBoard
              key={selectedProject.id}
              project={selectedProject}
              tasks={projectTasks}
              selectedTaskIds={boardTaskIds}
              loading={loadingProjectTasks}
              error={projectTasksError}
              onTaskUpdated={handleProjectTaskUpdated}
              showTaskOwners={false}
            />
          </div>
        </div>
      )}

    </div>

  );

}


export default Projects;
