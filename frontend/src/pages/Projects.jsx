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

  const [teams, setTeams] =
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

      const [projectsResponse, teamsResponse] = await Promise.all([
        api.get("/projects/"),
        api.get("/teams/"),
      ]);

      setProjects(
        projectsResponse.data
      );

      setTeams(
        teamsResponse.data
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

  const selectedProjectTeam = selectedProject
    ? teams.find((team) => Number(team.id) === Number(selectedProject.team))
    : null;

  const associatedMembers = selectedProjectTeam?.members || [];


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
                    aria-haspopup="dialog"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => setSelectedProject(null)}
        >
          <section
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#26363A] bg-[#10191C] p-5 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100">
                  <FolderKanban size={20} className="text-[#B6FF00]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
                    Détails du projet
                  </p>
                  <h2 id="project-details-title" className="mt-1 break-words text-2xl font-semibold text-[#F1F5F2] sm:text-3xl">
                    {selectedProject.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fermer les détails du projet"
                className="shrink-0 rounded-xl p-2 text-[#94A3A6] transition hover:bg-[#FFF3EB] hover:text-orange-700"
                onClick={() => setSelectedProject(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-[#1C292D] pb-5">
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
              <div className="rounded-2xl border border-orange-100 bg-[#FFF8F3] p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-orange-800">Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#5C554F]">
                  {selectedProject.description || "Aucune description."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-2 rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <CalendarDays size={16} className="mt-0.5 shrink-0 text-orange-500" />
                  <span>
                    <strong className="block text-xs font-medium text-[#647276]">Début</strong>
                    {selectedProject.start_date
                      ? new Date(selectedProject.start_date).toLocaleDateString("fr-FR")
                      : "Non défini"}
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <CalendarDays size={16} className="mt-0.5 shrink-0 text-orange-500" />
                  <span>
                    <strong className="block text-xs font-medium text-[#647276]">Fin</strong>
                    {selectedProject.end_date
                      ? new Date(selectedProject.end_date).toLocaleDateString("fr-FR")
                      : "Non définie"}
                  </span>
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Créé par</strong>
                  {selectedProject.created_by_username || "Non renseigné"}
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Tâches terminées</strong>
                  {selectedProject.completed_task_count ?? 0} sur {selectedProject.task_count ?? 0}
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Créé le</strong>
                  {selectedProject.created_at
                    ? new Date(selectedProject.created_at).toLocaleDateString("fr-FR")
                    : "Non renseigné"}
                </div>
                <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] p-3 text-sm text-[#94A3A6]">
                  <strong className="block text-xs font-medium text-[#647276]">Dernière modification</strong>
                  {selectedProject.updated_at
                    ? new Date(selectedProject.updated_at).toLocaleDateString("fr-FR")
                    : "Non renseignée"}
                </div>
              </div>

              <section aria-labelledby="project-members-title">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 id="project-members-title" className="text-base font-semibold text-[#F1F5F2]">
                    Équipe associée
                  </h3>
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">
                    {associatedMembers.length}
                  </span>
                </div>

                {associatedMembers.length === 0 ? (
                  <p className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#647276]">
                    Aucune personne n’est associée à cette équipe.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {associatedMembers.map((member) => {
                      const fullName = [member.first_name, member.last_name]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <div
                          key={member.id}
                          className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[#1C292D] bg-[#0B1215] p-4 transition-colors hover:border-orange-300"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-800">
                              {(fullName || member.username || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#F1F5F2]">
                                {fullName || member.username}
                              </p>
                              <p className="truncate text-xs text-[#647276]">
                                {member.email || `@${member.username}`}
                                {member.job_title ? ` · ${member.job_title}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-12">
                            <span className="text-xs text-[#94A3A6]">
                              {member.role_label || member.role || "Membre"}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${member.is_active ? "bg-orange-50 text-orange-800" : "bg-slate-100 text-slate-600"}`}>
                              {member.is_active ? "Actif" : "Inactif"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#94A3A6]">Progression</span>
                  <span className="font-semibold text-orange-400">
                    {(selectedProject.task_count ?? 0) > 0
                      ? Math.round(((selectedProject.completed_task_count ?? 0) / selectedProject.task_count) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full border border-black/15 bg-white">
                  <div
                    className="h-full rounded-full bg-orange-500"
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
