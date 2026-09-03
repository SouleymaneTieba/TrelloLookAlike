import { useEffect, useState } from "react";

import {
  CalendarDays,
  Edit3,
  FolderKanban,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import api from "../../services/api";


const STATUSES = [
  {
    value: "PLANNED",
    label: "Planifié",
  },
  {
    value: "IN_PROGRESS",
    label: "En cours",
  },
  {
    value: "COMPLETED",
    label: "Terminé",
  },
  {
    value: "ARCHIVED",
    label: "Archivé",
  },
];


const initialForm = {
  name: "",
  description: "",
  team: "",
  status: "PLANNED",
  start_date: "",
  end_date: "",
};


function Projects() {

  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingProject, setEditingProject] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);


  // ==========================================
  // CHARGER LES DONNÉES
  // ==========================================

  const fetchData = async () => {

    try {

      setLoading(true);
      setError("");

      const [
        projectsResponse,
        teamsResponse,
      ] = await Promise.all([
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
        "Impossible de récupérer les données."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchData();

  }, []);


  // ==========================================
  // CHANGEMENT FORMULAIRE
  // ==========================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // ==========================================
  // OUVRIR CRÉATION
  // ==========================================

  const handleOpenCreate = () => {

    setEditingProject(null);

    setForm(initialForm);

    setFormError("");

    setShowModal(true);

  };


  // ==========================================
  // OUVRIR MODIFICATION
  // ==========================================

  const handleOpenEdit = (project) => {

    setEditingProject(project);

    setForm({
      name: project.name || "",
      description:
        project.description || "",
      team: project.team || "",
      status:
        project.status || "PLANNED",
      start_date:
        project.start_date || "",
      end_date:
        project.end_date || "",
    });

    setFormError("");

    setShowModal(true);

  };


  // ==========================================
  // FERMER MODAL
  // ==========================================

  const handleCloseModal = () => {

    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingProject(null);

    setForm(initialForm);

    setFormError("");

  };


  // ==========================================
  // CRÉER / MODIFIER
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setFormError("");

    if (!form.team) {

      setFormError(
        "Veuillez sélectionner une équipe."
      );

      return;
    }


    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {

      setFormError(
        "La date de fin doit être postérieure à la date de début."
      );

      return;
    }


    setSaving(true);


    try {

      const data = {
        name: form.name,
        description: form.description,
        team: Number(form.team),
        status: form.status,
        start_date:
          form.start_date || null,
        end_date:
          form.end_date || null,
      };


      if (editingProject) {

        const response =
          await api.patch(
            `/projects/${editingProject.id}/`,
            data
          );


        setProjects((previous) =>
          previous.map((project) =>
            project.id === editingProject.id
              ? response.data
              : project
          )
        );

      } else {

        const response =
          await api.post(
            "/projects/",
            data
          );


        setProjects((previous) => [
          response.data,
          ...previous,
        ]);

      }


      handleCloseModal();

    } catch (error) {

      console.error(error);

      const data =
        error.response?.data;


      if (data) {

        const messages =
          Object.values(data)
            .flat()
            .join(" ");

        setFormError(
          messages ||
          "Impossible d'enregistrer le projet."
        );

      } else {

        setFormError(
          "Impossible de contacter le serveur."
        );

      }

    } finally {

      setSaving(false);

    }

  };


  // ==========================================
  // SUPPRIMER
  // ==========================================

  const handleDelete = async (project) => {

    const confirmed =
      window.confirm(
        `Voulez-vous supprimer le projet "${project.name}" ?`
      );


    if (!confirmed) {
      return;
    }


    try {

      await api.delete(
        `/projects/${project.id}/`
      );


      setProjects((previous) =>
        previous.filter(
          (item) =>
            item.id !== project.id
        )
      );


    } catch (error) {

      console.error(error);

      setError(
        "Impossible de supprimer ce projet."
      );

    }

  };


  // ==========================================
  // LABEL STATUS
  // ==========================================

  const getStatusLabel = (status) => {

    const found =
      STATUSES.find(
        (item) =>
          item.value === status
      );

    return found?.label || status;

  };


  // ==========================================
  // STYLE STATUS
  // ==========================================

  const getStatusClass = (status) => {

    switch (status) {

      case "IN_PROGRESS":
        return "border-[#304800] bg-[#152400] text-[#B6FF00]";

      case "COMPLETED":
        return "border-emerald-900/50 bg-emerald-950/30 text-emerald-400";

      case "ARCHIVED":
        return "border-[#1C292D] bg-[#10191C] text-[#647276]";

      default:
        return "border-blue-900/40 bg-blue-950/30 text-blue-400";

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

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <p className="mb-2 text-sm font-medium text-[#B6FF00]">
            Administration
          </p>

          <h1 className="text-3xl font-semibold text-[#F1F5F2]">
            Projets
          </h1>

          <p className="mt-2 text-[#94A3A6]">
            Créez et gérez les projets de vos équipes.
          </p>

        </div>


        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33]"
        >

          <Plus size={18} />

          Créer un projet

        </button>

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
          PROJECTS
      ======================================= */}

      {projects.length === 0 ? (

        <div className="mt-8 rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-16 text-center">

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
            Commencez par créer votre premier projet.
          </p>


          <button
            onClick={handleOpenCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#C4FF33]"
          >

            <Plus size={17} />

            Créer un projet

          </button>

        </div>

      ) : (

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {projects.map((project) => {

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

            <div
              key={project.id}
              className="flex flex-col rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5 transition hover:border-[#304800]"
            >


              {/* CARD HEADER */}

              <div className="flex items-start justify-between gap-3">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#152400]">

                    <FolderKanban
                      size={19}
                      className="text-[#B6FF00]"
                    />

                  </div>


                  <div>

                    <h2 className="font-semibold text-[#F1F5F2]">
                      {project.name}
                    </h2>

                    <p className="mt-1 text-xs text-[#647276]">
                      {project.team_name ||
                        "Équipe inconnue"}
                    </p>

                  </div>

                </div>


                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClass(
                    project.status
                  )}`}
                >

                  {project.status_label ||
                    getStatusLabel(
                      project.status
                    )}

                </span>

              </div>


              {/* DESCRIPTION */}

              <p className="mt-5 line-clamp-3 min-h-[60px] text-sm leading-6 text-[#94A3A6]">

                {project.description ||
                  "Aucune description pour ce projet."}

              </p>


              {/* DATES */}

              <div className="mt-5 space-y-2">

                <div className="flex items-center gap-2 text-xs text-[#647276]">

                  <CalendarDays size={15} />

                  <span>
                    Début :
                  </span>

                  <span className="text-[#94A3A6]">

                    {project.start_date ||
                      "Non définie"}

                  </span>

                </div>


                <div className="flex items-center gap-2 text-xs text-[#647276]">

                  <CalendarDays size={15} />

                  <span>
                    Fin :
                  </span>

                  <span className="text-[#94A3A6]">

                    {project.end_date ||
                      "Non définie"}

                  </span>

                </div>

              </div>


              {/* PROGRESSION */}

              <div className="mt-5 border-t border-[#1C292D] pt-4">

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


              {/* FOOTER */}

              <div className="mt-6 flex items-center justify-between border-t border-[#1C292D] pt-4">

                <p className="text-xs text-[#47565A]">

                  Créé par{" "}

                  <span className="text-[#647276]">

                    {project.created_by_username ||
                      "—"}

                  </span>

                </p>


                <div className="flex items-center gap-1">

                  <button
                    onClick={() =>
                      handleOpenEdit(
                        project
                      )
                    }
                    className="rounded-lg p-2 text-[#647276] transition hover:bg-[#10191C] hover:text-[#B6FF00]"
                    title="Modifier"
                  >

                    <Edit3 size={16} />

                  </button>


                  <button
                    onClick={() =>
                      handleDelete(
                        project
                      )
                    }
                    className="rounded-lg p-2 text-[#647276] transition hover:bg-red-950/30 hover:text-red-400"
                    title="Supprimer"
                  >

                    <Trash2 size={16} />

                  </button>

                </div>

              </div>

            </div>

            );

          })}

        </div>

      )}


      {/* ======================================
          MODAL
      ======================================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">


            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">

              <div>

                <h2 className="font-semibold text-[#F1F5F2]">

                  {editingProject
                    ? "Modifier le projet"
                    : "Créer un projet"}

                </h2>

                <p className="mt-1 text-sm text-[#647276]">

                  {editingProject
                    ? "Modifiez les informations du projet."
                    : "Créez un nouveau projet Trell ."}

                </p>

              </div>


              <button
                onClick={handleCloseModal}
                className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white"
              >

                <X size={20} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {formError && (

                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

                  {formError}

                </div>

              )}


              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Nom du projet
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex : Application Trell "
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#47565A] focus:border-[#B6FF00]"
                />

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Description du projet..."
                  className="w-full resize-none rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#47565A] focus:border-[#B6FF00]"
                />

              </div>


              {/* TEAM */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Équipe
                </label>

                <select
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                >

                  <option value="">
                    Sélectionner une équipe
                  </option>

                  {teams.map((team) => (

                    <option
                      key={team.id}
                      value={team.id}
                    >

                      {team.name}

                    </option>

                  ))}

                </select>

                {teams.length === 0 && (

                  <p className="mt-2 text-xs text-amber-400">
                    Vous devez créer une équipe avant de créer un projet.
                  </p>

                )}

              </div>


              {/* STATUS */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Statut
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                >

                  {STATUSES.map((status) => (

                    <option
                      key={status.value}
                      value={status.value}
                    >

                      {status.label}

                    </option>

                  ))}

                </select>

              </div>


              {/* DATES */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Date de début
                  </label>

                  <input
                    name="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Date de fin
                  </label>

                  <input
                    name="end_date"
                    type="date"
                    value={form.end_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  />

                </div>

              </div>


              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-5">

                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="rounded-xl border border-[#1C292D] px-4 py-3 text-sm font-medium text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
                >

                  Annuler

                </button>


                <button
                  type="submit"
                  disabled={
                    saving ||
                    teams.length === 0
                  }
                  className="rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving
                    ? "Enregistrement..."
                    : editingProject
                    ? "Enregistrer"
                    : "Créer le projet"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}


export default Projects;