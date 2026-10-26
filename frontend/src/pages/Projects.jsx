import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Layers3,
  ListTodo,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";


function Projects() {

  const navigate = useNavigate();

  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [projectTasks, setProjectTasks] = useState([]);
  const [projectFeatures, setProjectFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
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


  useEffect(() => {
    const selectedProjectId = selectedProject?.id;

    if (!selectedProjectId) {
      setProjectTasks([]);
      setProjectFeatures([]);
      setSelectedFeature(null);
      setProjectTasksError("");
      return;
    }

    let isMounted = true;
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

      <div>

        <p className="mb-2 text-sm font-medium text-[#B6FF00]">
          Espace de travail
        </p>

        <h1 className="text-3xl font-semibold text-[#F1F5F2]">
          {selectedProject ? "Détails du projet" : "Projets"}
        </h1>

        <p className="mt-2 text-[#94A3A6]">
          {selectedProject
            ? "Consultez la progression, les tâches et les membres du projet."
            : "Consultez les projets auxquels vous participez."}
        </p>

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

        <div className="mb-4 flex items-center justify-between">

          <h2 className="font-semibold text-[#F1F5F2]">
            Tous les projets
          </h2>

          <span className="text-sm text-[#647276]">
            {projects.length} projet
            {projects.length > 1
              ? "s"
              : ""}
          </span>

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

        ) : (

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {projects.map(
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


                    {/* DATES */}

                    <div className="mt-4 space-y-2 border-t border-[#1C292D] pt-4">

                      {project.start_date && (

                        <div className="flex items-center gap-2 text-xs text-[#647276]">

                          <CalendarDays
                            size={14}
                          />

                          <span>
                            Début :{" "}
                            {new Date(
                              project.start_date
                            ).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>

                        </div>

                      )}


                      {project.end_date && (

                        <div className="flex items-center gap-2 text-xs text-[#647276]">

                          <CalendarDays
                            size={14}
                          />

                          <span>
                            Fin :{" "}
                            {new Date(
                              project.end_date
                            ).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>

                        </div>

                      )}

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
                          className="h-full rounded-full bg-orange-500 transition-all duration-500"
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

                    <p className="mt-3 text-right text-xs font-medium text-orange-400">
                      Cliquer pour voir tous les détails →
                    </p>

                  </button>

                );

              }
            )}

          </div>

        )}

      </div>

      {selectedProject && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setSelectedProject(null)}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-[#1C292D] px-3 py-2 text-sm font-medium text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
          >
            <ArrowLeft size={16} /> Retour aux projets
          </button>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="min-w-0 rounded-3xl border border-[#26363A] bg-[#10191C] p-5 shadow-2xl sm:p-8 lg:col-span-2" aria-labelledby="project-details-title">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100">
                  <FolderKanban size={20} className="text-[#B6FF00]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Détails du projet</p>
                  <h2 id="project-details-title" className="mt-1 break-words text-2xl font-semibold text-[#F1F5F2] sm:text-3xl">{selectedProject.name}</h2>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-[#1C292D] pb-5">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(selectedProject.status)}`}>
                  {(() => {
                    const StatusIcon = getStatusIcon(selectedProject.status);
                    return <StatusIcon size={13} />;
                  })()}
                  {selectedProject.status_label || selectedProject.status}
                </span>
                <span className="text-sm text-[#94A3A6]">{selectedProject.task_count ?? projectTasks.length} tâche(s)</span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-orange-100 bg-[#FFF8F3] p-4 sm:p-5 lg:col-span-3">
                  <h3 className="text-sm font-semibold text-orange-800">Description</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#5C554F]">{selectedProject.description || "Aucune description."}</p>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <CalendarDays size={16} className="mt-0.5 shrink-0 text-orange-500" />
                  <span><strong className="block text-xs font-medium text-[#647276]">Début</strong>{selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString("fr-FR") : "Non défini"}</span>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <CalendarDays size={16} className="mt-0.5 shrink-0 text-orange-500" />
                  <span><strong className="block text-xs font-medium text-[#647276]">Fin</strong>{selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString("fr-FR") : "Non définie"}</span>
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Créé par</strong>{selectedProject.created_by_username || "Non renseigné"}
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Tâches terminées</strong>{selectedProject.completed_task_count ?? 0} sur {selectedProject.task_count ?? 0}
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Créé le</strong>{selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString("fr-FR") : "Non renseigné"}
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Dernière modification</strong>{selectedProject.updated_at ? new Date(selectedProject.updated_at).toLocaleDateString("fr-FR") : "Non renseignée"}
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 lg:col-span-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94A3A6]">Progression du projet</span>
                    <span className="font-semibold text-orange-400">{(selectedProject.task_count ?? 0) > 0 ? Math.round(((selectedProject.completed_task_count ?? 0) / selectedProject.task_count) * 100) : 0}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full border border-black/15 bg-white">
                    <div className="h-full rounded-full bg-orange-500" style={{ width: `${(selectedProject.task_count ?? 0) > 0 ? Math.round(((selectedProject.completed_task_count ?? 0) / selectedProject.task_count) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="project-features-title" className="min-w-0 rounded-3xl border border-[#26363A] bg-[#10191C] p-5 shadow-2xl sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 id="project-features-title" className="flex items-center gap-2 text-base font-semibold text-[#F1F5F2]"><Layers3 size={18} className="text-orange-500" /> Fonctionnalités</h3>
                <span className="rounded-full bg-[#0B1215] px-2.5 py-1 text-xs text-[#94A3A6]">{projectFeatures.length}</span>
              </div>
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
            </section>

            <section aria-labelledby="project-feature-tasks-title" className="min-w-0 rounded-3xl border border-[#26363A] bg-[#10191C] p-5 shadow-2xl sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="project-feature-tasks-title" className="flex items-center gap-2 text-base font-semibold text-[#F1F5F2]"><ListTodo size={18} className="text-orange-500" /> Tâches</h3>
                  {selectedFeature && <p className="mt-1 truncate text-sm text-[#94A3A6]">{selectedFeature.title}</p>}
                </div>
                {selectedFeature && <span className="rounded-full bg-[#0B1215] px-2.5 py-1 text-xs text-[#94A3A6]">{projectTasks.filter((task) => Number(task.feature) === Number(selectedFeature.id)).length}</span>}
              </div>
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
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => navigate("/tasks", { state: { openTaskId: task.id } })}
                      className="w-full rounded-xl border border-[#1C292D] bg-[#0B1215] p-4 text-left transition hover:border-orange-500/60 hover:bg-[#10191C] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h4 className="font-medium text-[#F1F5F2]">{task.title}</h4>
                          {task.description && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#647276]">{task.description}</p>}
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${task.status === "DONE" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-orange-500/30 bg-orange-500/10 text-orange-300"}`}>{task.status_label || task.status}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#94A3A6]">
                        <span>Priorité : {task.priority_label || task.priority}</span>
                        <span>Assignée à : {task.assigned_username || "Personne"}</span>
                        {task.start_date && <span>Début : {new Date(`${task.start_date}T00:00:00`).toLocaleDateString("fr-FR")}</span>}
                        {(task.end_date || task.deadline) && <span>Fin : {new Date(task.end_date ? `${task.end_date}T00:00:00` : task.deadline).toLocaleDateString("fr-FR")}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

    </div>

  );

}


export default Projects;
