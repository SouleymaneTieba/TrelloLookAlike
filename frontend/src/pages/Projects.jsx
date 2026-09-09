import { useEffect, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  X,
  Users,
} from "lucide-react";

import api from "../services/api";


function Projects() {

  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedProject, setSelectedProject] =
    useState(null);


  // ==========================================
  // CHARGER LES PROJETS
  // ==========================================

  const fetchProjects = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/projects/"
        );

      setProjects(
        response.data
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

    if (!selectedProject) {
      return undefined;
    }

    const handleEscape = (event) => {

      if (event.key === "Escape") {
        setSelectedProject(null);
      }

    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };

  }, [selectedProject]);


  // ==========================================
  // STATUS
  // ==========================================

  const getStatusStyle = (
    status
  ) => {

    switch (status) {

      case "PLANNED":

        return "border-blue-900/50 bg-blue-950/30 text-blue-400";

      case "IN_PROGRESS":

        return "border-[#304800] bg-[#152400] text-[#B6FF00]";

      case "COMPLETED":

        return "border-emerald-900/50 bg-emerald-950/30 text-emerald-400";

      case "ARCHIVED":

        return "border-slate-700 bg-slate-900 text-slate-500";

      default:

        return "border-[#1C292D] bg-[#10191C] text-[#94A3A6]";

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
          Projets
        </h1>

        <p className="mt-2 text-[#94A3A6]">
          Consultez les projets auxquels vous participez.
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

      <div className="mt-8 grid gap-5 sm:grid-cols-3">


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

      <div className="mt-8">

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
                        {project.team_name}
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

                        <span className="font-semibold text-[#B6FF00]">
                          {progress}%
                        </span>

                      </div>

                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-[#1C292D]"
                        role="progressbar"
                        aria-label={`Progression du projet ${project.name}`}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={progress}
                      >

                        <div
                          className="h-full rounded-full bg-[#B6FF00] transition-all duration-500"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => setSelectedProject(null)}
        >
          <section
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#26363A] bg-[#10191C] p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#152400]">
                  <FolderKanban size={20} className="text-[#B6FF00]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B6FF00]">
                    Détails du projet
                  </p>
                  <h2 id="project-details-title" className="mt-1 text-2xl font-semibold text-[#F1F5F2]">
                    {selectedProject.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fermer les détails du projet"
                className="rounded-lg p-2 text-[#94A3A6] transition hover:bg-[#1C292D] hover:text-[#F1F5F2]"
                onClick={() => setSelectedProject(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                  selectedProject.status
                )}`}
              >
                {(() => {
                  const StatusIcon = getStatusIcon(selectedProject.status);
                  return <StatusIcon size={13} />;
                })()}
                {selectedProject.status_label || selectedProject.status}
              </span>
              <span className="flex items-center gap-2 text-sm text-[#94A3A6]">
                <Users size={16} className="text-[#647276]" />
                {selectedProject.team_name}
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-[#F1F5F2]">Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#94A3A6]">
                  {selectedProject.description || "Aucune description."}
                </p>
              </div>

              <div className="grid gap-4 border-y border-[#1C292D] py-5 sm:grid-cols-2">
                <div className="flex items-start gap-2 text-sm text-[#94A3A6]">
                  <CalendarDays size={16} className="mt-0.5 text-[#647276]" />
                  <span>
                    <strong className="block text-xs font-medium text-[#647276]">Début</strong>
                    {selectedProject.start_date
                      ? new Date(selectedProject.start_date).toLocaleDateString("fr-FR")
                      : "Non défini"}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-[#94A3A6]">
                  <CalendarDays size={16} className="mt-0.5 text-[#647276]" />
                  <span>
                    <strong className="block text-xs font-medium text-[#647276]">Fin</strong>
                    {selectedProject.end_date
                      ? new Date(selectedProject.end_date).toLocaleDateString("fr-FR")
                      : "Non définie"}
                  </span>
                </div>
                <div className="text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Créé par</strong>
                  {selectedProject.created_by_username || "Non renseigné"}
                </div>
                <div className="text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Tâches terminées</strong>
                  {selectedProject.completed_task_count ?? 0} sur {selectedProject.task_count ?? 0}
                </div>
                <div className="text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Créé le</strong>
                  {selectedProject.created_at
                    ? new Date(selectedProject.created_at).toLocaleDateString("fr-FR")
                    : "Non renseigné"}
                </div>
                <div className="text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Dernière modification</strong>
                  {selectedProject.updated_at
                    ? new Date(selectedProject.updated_at).toLocaleDateString("fr-FR")
                    : "Non renseignée"}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#94A3A6]">Progression</span>
                  <span className="font-semibold text-[#B6FF00]">
                    {(selectedProject.task_count ?? 0) > 0
                      ? Math.round(((selectedProject.completed_task_count ?? 0) / selectedProject.task_count) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1C292D]">
                  <div
                    className="h-full rounded-full bg-[#B6FF00]"
                    style={{
                      width: `${(selectedProject.task_count ?? 0) > 0
                        ? Math.round(((selectedProject.completed_task_count ?? 0) / selectedProject.task_count) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

    </div>

  );

}


export default Projects;