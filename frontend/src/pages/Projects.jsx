import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
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
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);
  const [projectTasksError, setProjectTasksError] = useState("");

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
  const projectProgress = (selectedProject?.task_count ?? 0) > 0
    ? Math.round(
        ((selectedProject.completed_task_count ?? 0) / selectedProject.task_count) * 100
      )
    : 0;


  useEffect(() => {
    const selectedProjectId = selectedProject?.id;

    if (!selectedProjectId) {
      setProjectTasks([]);
      setProjectTasksError("");
      return;
    }

    let isMounted = true;
    setLoadingProjectTasks(true);
    setProjectTasksError("");

    api.get("/tasks/")
      .then((tasksResponse) => {
        if (isMounted) {
          setProjectTasks(tasksResponse.data.filter((task) => Number(task.project) === Number(selectedProjectId)));
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
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-sm font-medium text-[#B6FF00]">
                {selectedProject ? "Détails du projet" : "Espace de travail"}
              </p>
              {selectedProject ? (
                <>
                  <div className="-mx-1 overflow-x-auto px-1 pb-1">
                    <div className="flex w-max min-w-full items-center gap-6">
                      <div className="flex shrink-0 items-center gap-4">
                        <h1
                          title={selectedProject.description || selectedProject.name}
                          className="max-w-[32rem] truncate text-2xl font-semibold text-[#F1F5F2]"
                        >
                          {selectedProject.name}
                        </h1>
                        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(selectedProject.status)}`}>
                          {selectedProject.status_label || selectedProject.status}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-6">
                        <span className="shrink-0 whitespace-nowrap text-sm text-[#94A3A6]">
                          <CalendarDays size={14} className="mr-1.5 inline text-orange-500" />
                          Échéance : {selectedProject.end_date
                            ? new Date(`${selectedProject.end_date}T00:00:00`).toLocaleDateString("fr-FR")
                            : "Non définie"}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-sm text-[#94A3A6]">
                          Début : {selectedProject.start_date
                            ? new Date(`${selectedProject.start_date}T00:00:00`).toLocaleDateString("fr-FR")
                            : "Non définie"}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-sm text-[#94A3A6]">
                          Tâches : {selectedProject.completed_task_count ?? 0}/{selectedProject.task_count ?? 0}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-sm text-[#94A3A6]">
                          Membres : {selectedProject.member_details?.length ?? selectedProject.members?.length ?? 0}
                        </span>
                      </div>
                      <div className="flex min-w-48 flex-1 items-center gap-3">
                        <div
                          className="h-2.5 min-w-16 flex-1 overflow-hidden rounded-full border border-white/40 bg-white shadow-sm"
                          role="progressbar"
                          aria-label={`Progression du projet ${selectedProject.name}`}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={projectProgress}
                        >
                          <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${projectProgress}%` }} />
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-orange-400">
                          Progression {projectProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="min-w-0 break-words text-3xl font-semibold text-[#F1F5F2]">
                    Projets
                  </h1>
                <p className="mt-2 text-[#94A3A6]">
                  Consultez les projets auxquels vous participez.
                </p>
                </>
              )}
            </div>
          </div>
        </div>

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
                    onClick={() => setSelectedProject(project)}
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

                  </button>

                );

              }
            )}

          </div>

        )}

      </div>

      {selectedProject && (
        <div className="mt-8 min-w-0">
          <ProjectTaskBoard
            key={selectedProject.id}
            project={selectedProject}
            tasks={projectTasks}
            selectedTaskIds={projectTasks.map((task) => Number(task.id))}
            loading={loadingProjectTasks}
            error={projectTasksError}
            onTaskUpdated={handleProjectTaskUpdated}
            showTaskOwners={false}
          />
        </div>
      )}

    </div>

  );

}


export default Projects;
