import { useEffect, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  ListTodo,
  Plus,
  Trash2,
  UserRound,
  X,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";


const STATUSES = [
  {
    value: "TODO",
    label: "À faire",
  },
  {
    value: "IN_PROGRESS",
    label: "En cours",
  },
  {
    value: "BLOCKED",
    label: "Bloquée",
  },
  {
    value: "DONE",
    label: "Terminée",
  },
];


const PRIORITIES = [
  {
    value: "LOW",
    label: "Faible",
  },
  {
    value: "MEDIUM",
    label: "Moyenne",
  },
  {
    value: "HIGH",
    label: "Haute",
  },
  {
    value: "URGENT",
    label: "Urgente",
  },
];


const initialForm = {
  title: "",
  description: "",
  project: "",
  assigned_to: "",
  status: "TODO",
  priority: "MEDIUM",
  deadline: "",
};


function Tasks() {

  const [tasks, setTasks] = useState([]);

  const [projects, setProjects] = useState([]);

  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingTask, setEditingTask] =
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
        tasksResponse,
        projectsResponse,
        teamsResponse,
      ] = await Promise.all([

        api.get("/tasks/"),

        api.get("/projects/"),

        api.get("/teams/"),

      ]);


      setTasks(
        tasksResponse.data
      );

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
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setForm((previous) => ({

      ...previous,

      [name]: value,

      // Si le projet change,
      // on réinitialise l'utilisateur
      ...(name === "project"
        ? {
            assigned_to: "",
          }
        : {}),

    }));

  };


  // ==========================================
  // PROJET SÉLECTIONNÉ
  // ==========================================

  const selectedProject =
    projects.find(
      (project) =>
        project.id === Number(
          form.project
        )
    );


  // ==========================================
  // ÉQUIPE DU PROJET
  // ==========================================

  const selectedTeam =
    selectedProject
      ? teams.find(
          (team) =>
            team.id === selectedProject.team
        )
      : null;


  // ==========================================
  // MEMBRES DISPONIBLES
  // ==========================================

  const availableMembers =
    selectedTeam?.members || [];


  // ==========================================
  // CREATE
  // ==========================================

  const handleOpenCreate = () => {

    setEditingTask(null);

    setForm(initialForm);

    setFormError("");

    setShowModal(true);

  };


  // ==========================================
  // EDIT
  // ==========================================

  const handleOpenEdit = (task) => {

    setEditingTask(task);

    setForm({

      title: task.title || "",

      description:
        task.description || "",

      project:
        task.project || "",

      assigned_to:
        task.assigned_to || "",

      status:
        task.status || "TODO",

      priority:
        task.priority || "MEDIUM",

      deadline:
        task.deadline
          ? task.deadline.slice(0, 16)
          : "",

    });

    setFormError("");

    setShowModal(true);

  };


  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleCloseModal = () => {

    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingTask(null);

    setForm(initialForm);

    setFormError("");

  };


  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setFormError("");

    if (!form.project) {

      setFormError(
        "Veuillez sélectionner un projet."
      );

      return;

    }


    setSaving(true);


    try {

      const data = {

        title: form.title,

        description:
          form.description,

        project:
          Number(form.project),

        assigned_to:
          form.assigned_to
            ? Number(form.assigned_to)
            : null,

        status:
          form.status,

        priority:
          form.priority,

        deadline:
          form.deadline
            ? form.deadline
            : null,

      };


      if (editingTask) {

        const response =
          await api.patch(
            `/tasks/${editingTask.id}/`,
            data
          );


        setTasks((previous) =>
          previous.map(
            (task) =>
              task.id === editingTask.id
                ? response.data
                : task
          )
        );


      } else {

        const response =
          await api.post(
            "/tasks/",
            data
          );


        setTasks((previous) => [

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
          "Impossible d'enregistrer la tâche."

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
  // DELETE
  // ==========================================

  const handleDelete = async (task) => {

    const confirmed =
      window.confirm(
        `Voulez-vous supprimer la tâche "${task.title}" ?`
      );


    if (!confirmed) {
      return;
    }


    try {

      await api.delete(
        `/tasks/${task.id}/`
      );


      setTasks((previous) =>
        previous.filter(
          (item) =>
            item.id !== task.id
        )
      );


    } catch (error) {

      console.error(error);

      setError(
        "Impossible de supprimer cette tâche."
      );

    }

  };


  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {

    switch (status) {

      case "IN_PROGRESS":

        return "border-[#304800] bg-[#152400] text-[#B6FF00]";

      case "DONE":

        return "border-emerald-900/50 bg-emerald-950/30 text-emerald-400";

      case "BLOCKED":

        return "border-red-900/50 bg-red-950/30 text-red-400";

      default:

        return "border-[#1C292D] bg-[#10191C] text-[#94A3A6]";

    }

  };


  // ==========================================
  // PRIORITY CLASS
  // ==========================================

  const getPriorityClass = (priority) => {

    switch (priority) {

      case "URGENT":
        return "text-red-400";

      case "HIGH":
        return "text-orange-400";

      case "MEDIUM":
        return "text-yellow-400";

      default:
        return "text-[#647276]";

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
            Chargement des tâches...
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
            Tâches
          </h1>

          <p className="mt-2 text-[#94A3A6]">
            Gérez les tâches et leurs affectations.
          </p>

        </div>


        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33]"
        >

          <Plus size={18} />

          Créer une tâche

        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

          {error}

        </div>

      )}


      {/* ======================================
          TASKS
      ======================================= */}

      {tasks.length === 0 ? (

        <div className="mt-8 rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-16 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">

            <ListTodo
              size={25}
              className="text-[#B6FF00]"
            />

          </div>


          <h2 className="mt-5 font-semibold text-[#F1F5F2]">
            Aucune tâche
          </h2>


          <p className="mt-2 text-sm text-[#647276]">
            Créez votre première tâche.
          </p>


          <button
            onClick={handleOpenCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#C4FF33]"
          >

            <Plus size={17} />

            Créer une tâche

          </button>

        </div>

      ) : (

        <div className="mt-8 overflow-hidden rounded-2xl border border-[#1C292D] bg-[#0B1215]">

          {/* TABLE HEADER */}

          <div className="hidden border-b border-[#1C292D] px-6 py-4 text-xs font-medium uppercase tracking-wide text-[#647276] lg:grid lg:grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_auto] lg:gap-4">

            <span>Tâche</span>

            <span>Projet</span>

            <span>Assignée à</span>

            <span>Priorité</span>

            <span>Statut</span>

            <span />

          </div>


          {/* TASK ROWS */}

          <div className="divide-y divide-[#1C292D]">

            {tasks.map((task) => (

              <div
                key={task.id}
                className="grid gap-4 px-6 py-5 lg:grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_auto] lg:items-center"
              >


                {/* TASK */}

                <div>

                  <p className="font-medium text-[#F1F5F2]">
                    {task.title}
                  </p>

                  <p className="mt-1 line-clamp-1 text-xs text-[#647276]">
                    {task.description ||
                      "Aucune description"}
                  </p>

                </div>


                {/* PROJECT */}

                <div>

                  <p className="text-sm text-[#94A3A6]">
                    {task.project_name ||
                      "—"}
                  </p>

                  <p className="mt-1 text-xs text-[#47565A]">
                    {task.team_name ||
                      "—"}
                  </p>

                </div>


                {/* ASSIGNED */}

                <div className="flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#152400] text-xs font-semibold text-[#B6FF00]">

                    {task.assigned_username
                      ?.charAt(0)
                      .toUpperCase() || "—"}

                  </div>

                  <span className="text-sm text-[#94A3A6]">

                    {task.assigned_username ||
                      "Non assignée"}

                  </span>

                </div>


                {/* PRIORITY */}

                <div className="flex items-center gap-2">

                  <AlertCircle
                    size={15}
                    className={getPriorityClass(
                      task.priority
                    )}
                  />

                  <span
                    className={`text-sm ${getPriorityClass(
                      task.priority
                    )}`}
                  >

                    {task.priority_label ||
                      task.priority}

                  </span>

                </div>


                {/* STATUS */}

                <div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                      task.status
                    )}`}
                  >

                    {task.status_label ||
                      task.status}

                  </span>

                </div>


                {/* ACTIONS */}

                <div className="flex items-center gap-1">

                  <button
                    onClick={() =>
                      handleOpenEdit(task)
                    }
                    className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-[#B6FF00]"
                    title="Modifier"
                  >

                    <Edit3 size={16} />

                  </button>


                  <button
                    onClick={() =>
                      handleDelete(task)
                    }
                    className="rounded-lg p-2 text-[#647276] hover:bg-red-950/30 hover:text-red-400"
                    title="Supprimer"
                  >

                    <Trash2 size={16} />

                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}


      {/* ======================================
          MODAL
      ======================================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">


            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">

              <div>

                <h2 className="font-semibold text-[#F1F5F2]">

                  {editingTask
                    ? "Modifier la tâche"
                    : "Créer une tâche"}

                </h2>

                <p className="mt-1 text-sm text-[#647276]">

                  {editingTask
                    ? "Modifiez les informations de la tâche."
                    : "Créez une nouvelle tâche et assignez-la à un membre."}

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


              {/* TITLE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Titre
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ex : Créer l'API d'authentification"
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
                  placeholder="Décrivez la tâche..."
                  className="w-full resize-none rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#47565A] focus:border-[#B6FF00]"
                />

              </div>


              {/* PROJECT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Projet
                </label>

                <select
                  name="project"
                  value={form.project}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                >

                  <option value="">
                    Sélectionner un projet
                  </option>

                  {projects.map(
                    (project) => (

                      <option
                        key={project.id}
                        value={project.id}
                      >

                        {project.name}

                        {" — "}

                        {project.team_name}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* MEMBER */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Assigner à
                </label>

                <select
                  name="assigned_to"
                  value={form.assigned_to}
                  onChange={handleChange}
                  disabled={!selectedProject}
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B6FF00]"
                >

                  <option value="">

                    {!selectedProject
                      ? "Sélectionnez d'abord un projet"
                      : "Non assignée"}

                  </option>


                  {availableMembers.map(
                    (member) => (

                      <option
                        key={member.id}
                        value={member.user}
                      >

                        {member.first_name ||
                        member.last_name
                          ? `${member.first_name || ""} ${member.last_name || ""}`
                          : member.username}

                        {" — "}

                        {member.role_label || member.role}

                      </option>

                    )
                  )}

                </select>


                {selectedProject &&
                  availableMembers.length === 0 && (

                    <p className="mt-2 flex items-center gap-2 text-xs text-amber-400">

                      <AlertCircle size={14} />

                      Cette équipe ne possède aucun membre actif.

                    </p>

                  )}

              </div>


              {/* STATUS + PRIORITY */}

              <div className="grid gap-4 sm:grid-cols-2">


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

                    {STATUSES.map(
                      (status) => (

                        <option
                          key={status.value}
                          value={status.value}
                        >

                          {status.label}

                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* PRIORITY */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Priorité
                  </label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  >

                    {PRIORITIES.map(
                      (priority) => (

                        <option
                          key={priority.value}
                          value={priority.value}
                        >

                          {priority.label}

                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* DEADLINE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Deadline
                </label>

                <div className="relative">

                  <CalendarDays
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647276]"
                  />

                  <input
                    name="deadline"
                    type="datetime-local"
                    value={form.deadline}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-10 pr-4 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
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
                    projects.length === 0
                  }
                  className="rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving
                    ? "Enregistrement..."
                    : editingTask
                    ? "Enregistrer"
                    : "Créer la tâche"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}


export default Tasks;