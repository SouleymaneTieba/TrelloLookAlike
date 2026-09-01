import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";


function Tasks() {

  const { user } = useAuth();


  // ==========================================
  // DONNÉES
  // ==========================================

  const [tasks, setTasks] = useState([]);

  const [projects, setProjects] = useState([]);

  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ==========================================
  // FILTRES
  // ==========================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [priorityFilter, setPriorityFilter] =
    useState("ALL");


  // ==========================================
  // TÂCHE EN COURS
  // ==========================================

  const [updatingTask, setUpdatingTask] =
    useState(null);

  const [deletingTask, setDeletingTask] =
    useState(null);


  // ==========================================
  // CRÉATION
  // ==========================================

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [creatingTask, setCreatingTask] =
    useState(false);

  const [createError, setCreateError] =
    useState("");


  // ==========================================
  // MODIFICATION
  // ==========================================

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  const [editingTaskLoading, setEditingTaskLoading] =
    useState(false);

  const [editError, setEditError] =
    useState("");


  // ==========================================
  // DISPONIBILITÉ
  // ==========================================

  const [availabilityReport, setAvailabilityReport] =
    useState(null);

  const [
    reportingAvailability,
    setReportingAvailability,
  ] = useState(false);

  const [
    availabilityMessage,
    setAvailabilityMessage,
  ] = useState(
    "Je n'ai aucune tâche actuellement."
  );

  const [
    availabilityTeam,
    setAvailabilityTeam,
  ] = useState("");


  // ==========================================
  // FORMULAIRE
  // ==========================================

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    assigned_to: "",
    priority: "MEDIUM",
    deadline: "",
  });


  // ==========================================
  // RÔLES
  // ==========================================

  const isAdmin =
    Boolean(user?.is_staff) ||
    Boolean(user?.is_superuser);


  const isProjectManager = useMemo(() => {

    if (!user || isAdmin) {
      return false;
    }

    return teams.some((team) =>
      team.members?.some(
        (member) =>
          member.user === user.id &&
          member.role === "PROJECT_MANAGER" &&
          member.is_active
      )
    );

  }, [
    teams,
    user,
    isAdmin,
  ]);


  const canAssignTasks =
    isAdmin || isProjectManager;


  // ==========================================
  // RÉCUPÉRATION DES DONNÉES
  // ==========================================

  const fetchData = async () => {

    try {

      setError("");

      const [
        tasksResponse,
        projectsResponse,
        teamsResponse,
        availabilityResponse,
      ] = await Promise.all([

        api.get("/tasks/"),

        api.get("/projects/"),

        api.get("/teams/"),

        api.get(
          "/tasks/availability/"
        ),

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


      // --------------------------------------
      // SIGNALement actif
      // --------------------------------------

      const reports =
        availabilityResponse.data;


      const myActiveReport =
        reports.find(
          (report) =>
            report.user === user?.id &&
            report.status === "ACTIVE"
        );


      setAvailabilityReport(
        myActiveReport || null
      );


      // --------------------------------------
      // Restaurer l'équipe
      // --------------------------------------

      if (myActiveReport?.team) {

        setAvailabilityTeam(
          String(
            myActiveReport.team
          )
        );

      }

    } catch (error) {

      console.error(
        error.response?.data ||
        error
      );

      setError(
        "Impossible de récupérer les données."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    if (user) {
      fetchData();
    }

  }, [user]);


  // ==========================================
  // MEMBRES
  // ==========================================

  const members = useMemo(() => {

    const membersMap = new Map();


    teams.forEach((team) => {

      team.members?.forEach((member) => {

        if (
          member.is_active &&
          member.user
        ) {

          membersMap.set(
            member.user,
            {
              id: member.user,
              username: member.username,
              role: member.role,
            }
          );

        }

      });

    });


    return Array.from(
      membersMap.values()
    );

  }, [teams]);


  // ==========================================
  // FILTRES
  // ==========================================

  const filteredTasks = useMemo(() => {

    return tasks.filter((task) => {

      const searchValue =
        search.trim().toLowerCase();


      const matchesSearch =
        !searchValue ||

        task.title
          ?.toLowerCase()
          .includes(searchValue) ||

        task.description
          ?.toLowerCase()
          .includes(searchValue) ||

        task.assigned_username
          ?.toLowerCase()
          .includes(searchValue) ||

        task.created_by_username
          ?.toLowerCase()
          .includes(searchValue);


      const matchesStatus =
        statusFilter === "ALL" ||
        task.status === statusFilter;


      const matchesPriority =
        priorityFilter === "ALL" ||
        task.priority === priorityFilter;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );

    });

  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
  ]);


  // ==========================================
  // FORMULAIRE
  // ==========================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;


    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // ==========================================
  // CRÉATION
  // ==========================================

  const openCreateModal = () => {

    setCreateError("");


    setFormData({

      title: "",

      description: "",

      project: "",

      assigned_to: "",

      priority: "MEDIUM",

      deadline: "",

    });


    setShowCreateModal(true);

  };


  const closeCreateModal = () => {

    if (creatingTask) {
      return;
    }


    setShowCreateModal(false);

    setCreateError("");

  };


  const handleCreateTask = async (event) => {

    event.preventDefault();

    setCreateError("");


    if (!formData.title.trim()) {

      setCreateError(
        "Le titre de la tâche est obligatoire."
      );

      return;
    }


    if (!formData.project) {

      setCreateError(
        "Veuillez sélectionner un projet."
      );

      return;
    }


    try {

      setCreatingTask(true);


      const payload = {

        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

        project:
          Number(formData.project),

        priority:
          formData.priority,

      };


      if (
        canAssignTasks &&
        formData.assigned_to
      ) {

        payload.assigned_to =
          Number(
            formData.assigned_to
          );

      }


      if (formData.deadline) {

        payload.deadline =
          new Date(
            formData.deadline
          ).toISOString();

      }


      const response =
        await api.post(
          "/tasks/",
          payload
        );


      setTasks((previous) => [

        response.data,

        ...previous,

      ]);


      setShowCreateModal(false);


      setFormData({

        title: "",

        description: "",

        project: "",

        assigned_to: "",

        priority: "MEDIUM",

        deadline: "",

      });

    } catch (error) {

      console.error(error);


      const data =
        error.response?.data;


      if (data) {

        const messages =
          Object.values(data)
            .flat()
            .join(" ");


        setCreateError(
          messages
        );

      } else {

        setCreateError(
          "Impossible de créer la tâche."
        );

      }

    } finally {

      setCreatingTask(false);

    }

  };


  // ==========================================
  // MODIFICATION
  // ==========================================

  const openEditModal = (task) => {

    setEditingTask(task);

    setEditError("");


    setFormData({

      title:
        task.title || "",

      description:
        task.description || "",

      project:
        task.project || "",

      assigned_to:
        task.assigned_to || "",

      priority:
        task.priority || "MEDIUM",

      deadline:
        task.deadline
          ? new Date(task.deadline)
              .toISOString()
              .slice(0, 16)
          : "",

    });


    setShowEditModal(true);

  };


  const closeEditModal = () => {

    if (editingTaskLoading) {
      return;
    }


    setShowEditModal(false);

    setEditingTask(null);

    setEditError("");

  };


  const handleUpdateTask = async (event) => {

    event.preventDefault();


    if (!editingTask) {
      return;
    }


    setEditError("");


    if (!formData.title.trim()) {

      setEditError(
        "Le titre de la tâche est obligatoire."
      );

      return;
    }


    if (!formData.project) {

      setEditError(
        "Veuillez sélectionner un projet."
      );

      return;
    }


    try {

      setEditingTaskLoading(true);


      const payload = {

        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

        project:
          Number(formData.project),

        priority:
          formData.priority,

      };


      if (
        canAssignTasks &&
        formData.assigned_to
      ) {

        payload.assigned_to =
          Number(
            formData.assigned_to
          );

      }


      if (formData.deadline) {

        payload.deadline =
          new Date(
            formData.deadline
          ).toISOString();

      } else {

        payload.deadline = null;

      }


      const response =
        await api.patch(
          `/tasks/${editingTask.id}/`,
          payload
        );


      setTasks((previous) =>

        previous.map((task) =>

          task.id === editingTask.id

            ? response.data

            : task

        )

      );


      closeEditModal();

    } catch (error) {

      console.error(error);


      const data =
        error.response?.data;


      if (data) {

        const messages =
          Object.values(data)
            .flat()
            .join(" ");


        setEditError(
          messages
        );

      } else {

        setEditError(
          "Impossible de modifier la tâche."
        );

      }

    } finally {

      setEditingTaskLoading(false);

    }

  };


  // ==========================================
  // TERMINER UNE TÂCHE
  // ==========================================

  const handleCompleteTask = async (task) => {

    if (task.status === "DONE") {
      return;
    }


    try {

      setUpdatingTask(task.id);

      setError("");


      const response =
        await api.patch(
          `/tasks/${task.id}/`,
          {
            status: "DONE",
          }
        );


      setTasks((previous) =>

        previous.map((item) =>

          item.id === task.id

            ? response.data

            : item

        )

      );

    } catch (error) {

      console.error(error);


      setError(
        "Impossible de modifier la tâche."
      );

    } finally {

      setUpdatingTask(null);

    }

  };


  // ==========================================
  // SUPPRIMER
  // ==========================================

  const handleDeleteTask = async (task) => {

    const confirmed =
      window.confirm(
        `Voulez-vous vraiment supprimer "${task.title}" ?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingTask(task.id);

      setError("");


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
        "Impossible de supprimer la tâche."
      );

    } finally {

      setDeletingTask(null);

    }

  };


  // ==========================================
  // PERMISSIONS
  // ==========================================

  const canManageTask = (task) => {

    if (isAdmin) {
      return true;
    }


    if (isProjectManager) {
      return true;
    }


    return (
      task.created_by === user?.id
    );

  };


  // ==========================================
  // SIGNALER SA DISPONIBILITÉ
  // ==========================================

  const handleAvailabilityReport =
    async () => {

      // --------------------------------------
      // Vérifier l'équipe
      // --------------------------------------

      if (!availabilityTeam) {

        setError(
          "Veuillez sélectionner une équipe."
        );

        return;
      }


      // --------------------------------------
      // Éviter le double signalement
      // --------------------------------------

      if (availabilityReport) {
        return;
      }


      try {

        setReportingAvailability(
          true
        );

        setError("");


        const response =
          await api.post(
            "/tasks/availability/",
            {
              team:
                Number(
                  availabilityTeam
                ),

              message:
                availabilityMessage.trim() ||
                "Je n'ai aucune tâche actuellement.",
            }
          );


        setAvailabilityReport(
          response.data
        );


        setAvailabilityMessage("");

      } catch (error) {

        console.error(
          "Erreur disponibilité :",
          error.response?.data ||
          error
        );


        const data =
          error.response?.data;


        if (data?.team) {

          setError(
            Array.isArray(
              data.team
            )
              ? data.team[0]
              : data.team
          );

        } else if (data?.message) {

          setError(
            Array.isArray(
              data.message
            )
              ? data.message[0]
              : data.message
          );

        } else if (data?.detail) {

          setError(
            data.detail
          );

        } else {

          setError(
            "Impossible de signaler votre disponibilité."
          );

        }

      } finally {

        setReportingAvailability(
          false
        );

      }

    };


  // ==========================================
  // HELPERS
  // ==========================================

  const getStatusLabel = (status) => {

    const labels = {

      TODO: "À faire",

      IN_PROGRESS: "En cours",

      BLOCKED: "Bloquée",

      DONE: "Terminée",

    };


    return (
      labels[status] ||
      status
    );

  };


  const getStatusStyle = (status) => {

    const styles = {

      TODO:
        "bg-[#10191C] text-[#94A3A6] border-[#1C292D]",

      IN_PROGRESS:
        "bg-[#13231A] text-[#B6FF00] border-[#304800]",

      BLOCKED:
        "bg-[#2A1E0A] text-[#FFC107] border-[#4A3500]",

      DONE:
        "bg-[#152400] text-[#B6FF00] border-[#304800]",

    };


    return (
      styles[status] ||
      styles.TODO
    );

  };


  const getPriorityStyle = (priority) => {

    const styles = {

      LOW:
        "text-[#94A3A6]",

      MEDIUM:
        "text-[#C4D000]",

      HIGH:
        "text-[#FFC107]",

      URGENT:
        "text-[#FF4D4D]",

    };


    return (
      styles[priority] ||
      styles.MEDIUM
    );

  };


  const formatDate = (date) => {

    if (!date) {
      return "Pas de deadline";
    }


    return new Date(
      date
    ).toLocaleDateString(
      "fr-FR",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1C292D] border-t-[#B6FF00]" />

          <p className="mt-4 text-sm text-[#647276]">
            Chargement des tâches...
          </p>

        </div>

      </div>

    );

  }


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <div>


      {/* ======================================
          HEADER
      ======================================= */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div>

          <p className="mb-2 text-sm font-medium text-[#B6FF00]">
            Workspace
          </p>

          <h1 className="text-3xl font-semibold text-[#F1F5F2]">
            Tâches
          </h1>

          <p className="mt-2 text-[#94A3A6]">
            Gérez et suivez l'avancement de vos tâches.
          </p>

        </div>


        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-3 font-semibold text-black transition hover:bg-[#C4FF33]"
        >

          <Plus size={19} />

          Nouvelle tâche

        </button>

      </div>


      {/* ======================================
          ERROR
      ======================================= */}

      {error && (

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

          <AlertCircle size={18} />

          {error}

        </div>

      )}


      {/* ======================================
          FILTERS
      ======================================= */}

      <div className="mt-8 rounded-2xl border border-[#1C292D] bg-[#0B1215] p-4">

        <div className="flex flex-col gap-4 xl:flex-row">


          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647276]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Rechercher une tâche..."
              className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-10 pr-4 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
            />

          </div>


          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
          >

            <option value="ALL">
              Tous les statuts
            </option>

            <option value="TODO">
              À faire
            </option>

            <option value="IN_PROGRESS">
              En cours
            </option>

            <option value="BLOCKED">
              Bloquées
            </option>

            <option value="DONE">
              Terminées
            </option>

          </select>


          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
          >

            <option value="ALL">
              Toutes les priorités
            </option>

            <option value="LOW">
              Faible
            </option>

            <option value="MEDIUM">
              Moyenne
            </option>

            <option value="HIGH">
              Haute
            </option>

            <option value="URGENT">
              Urgente
            </option>

          </select>

        </div>

      </div>


      {/* ======================================
          COUNTER
      ======================================= */}

      <div className="mt-6 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <ListTodo
            size={18}
            className="text-[#B6FF00]"
          />

          <span className="text-sm text-[#94A3A6]">

            {filteredTasks.length} tâche(s)

          </span>

        </div>


        <span className="text-xs text-[#647276]">

          {tasks.length} au total

        </span>

      </div>


      {/* ======================================
          LISTE DES TÂCHES
      ======================================= */}

      {filteredTasks.length === 0 ? (

        <div className="mt-4 rounded-2xl border border-[#1C292D] bg-[#0B1215] px-6 py-14 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">

            <ListTodo
              size={25}
              className="text-[#B6FF00]"
            />

          </div>


          <h2 className="mt-5 font-semibold text-[#F1F5F2]">
            Aucune tâche trouvée
          </h2>


          <p className="mx-auto mt-2 max-w-md text-sm text-[#647276]">

            {search ||
            statusFilter !== "ALL" ||
            priorityFilter !== "ALL"

              ? "Essayez de modifier vos filtres."

              : "Vous n'avez actuellement aucune tâche."}

          </p>

        </div>

      ) : (

        <div className="mt-4 space-y-3">

          {filteredTasks.map((task) => {

            const isDone =
              task.status === "DONE";


            const isUpdating =
              updatingTask === task.id;


            const isDeleting =
              deletingTask === task.id;


            const projectName =
              projects.find(
                (project) =>
                  project.id === task.project
              )?.name ||

              `Projet #${task.project}`;


            return (

              <div
                key={task.id}
                className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5 transition hover:border-[#304038]"
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">


                  <div className="flex min-w-0 items-start gap-4">


                    <button
                      onClick={() =>
                        handleCompleteTask(
                          task
                        )
                      }
                      disabled={
                        isDone ||
                        isUpdating ||
                        isDeleting
                      }
                      className={`mt-1 shrink-0 transition ${
                        isDone

                          ? "text-[#B6FF00]"

                          : "text-[#47565A] hover:text-[#B6FF00]"
                      }`}
                    >

                      {isDone ? (

                        <CheckCircle2 size={23} />

                      ) : (

                        <Circle size={23} />

                      )}

                    </button>


                    <div className="min-w-0">


                      <div className="flex flex-wrap items-center gap-3">

                        <h2
                          className={`font-semibold ${
                            isDone

                              ? "text-[#647276] line-through"

                              : "text-[#F1F5F2]"
                          }`}
                        >

                          {task.title}

                        </h2>


                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusStyle(
                            task.status
                          )}`}
                        >

                          {getStatusLabel(
                            task.status
                          )}

                        </span>

                      </div>


                      {task.description && (

                        <p className="mt-2 line-clamp-2 text-sm text-[#647276]">

                          {task.description}

                        </p>

                      )}


                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#647276]">


                        <span>

                          Projet :{" "}

                          <span className="text-[#94A3A6]">

                            {projectName}

                          </span>

                        </span>


                        <span>

                          Assignée à :{" "}

                          <span className="text-[#94A3A6]">

                            {task.assigned_username ||
                              "Non assignée"}

                          </span>

                        </span>


                        <span>

                          Créée par :{" "}

                          <span className="text-[#94A3A6]">

                            {task.created_by_username ||
                              "Inconnu"}

                          </span>

                        </span>


                        <span className="flex items-center gap-1.5">

                          <CalendarDays size={14} />

                          {formatDate(
                            task.deadline
                          )}

                        </span>


                      </div>

                    </div>

                  </div>


                  <div className="flex shrink-0 items-center justify-between gap-5 lg:flex-col lg:items-end">


                    <div className="flex items-center gap-2">

                      <span className="text-xs text-[#647276]">
                        Priorité
                      </span>

                      <span
                        className={`text-xs font-semibold ${getPriorityStyle(
                          task.priority
                        )}`}
                      >

                        {task.priority}

                      </span>

                    </div>


                    <div className="flex flex-wrap items-center gap-2">


                      {canManageTask(task) && (

                        <button
                          onClick={() =>
                            openEditModal(
                              task
                            )
                          }
                          disabled={
                            isUpdating ||
                            isDeleting
                          }
                          className="flex items-center gap-2 rounded-lg border border-[#1C292D] px-3 py-2 text-xs font-medium text-[#94A3A6] transition hover:border-[#B6FF00] hover:bg-[#152400] hover:text-[#B6FF00]"
                        >

                          <Pencil size={14} />

                          Modifier

                        </button>

                      )}


                      {!isDone && (

                        <button
                          onClick={() =>
                            handleCompleteTask(
                              task
                            )
                          }
                          disabled={
                            isUpdating ||
                            isDeleting
                          }
                          className="flex items-center gap-2 rounded-lg bg-[#152400] px-3 py-2 text-xs font-medium text-[#B6FF00] transition hover:bg-[#1D3200] disabled:opacity-50"
                        >

                          <CheckCircle2 size={15} />

                          {isUpdating
                            ? "..."
                            : "Terminer"}

                        </button>

                      )}


                      {canManageTask(task) && (

                        <button
                          onClick={() =>
                            handleDeleteTask(
                              task
                            )
                          }
                          disabled={
                            isDeleting ||
                            isUpdating
                          }
                          className="flex items-center gap-2 rounded-lg border border-red-900/50 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
                        >

                          <Trash2 size={14} />

                          {isDeleting
                            ? "..."
                            : "Supprimer"}

                        </button>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}


      {/* ======================================
          DISPONIBILITÉ
      ======================================= */}

      <div className="mt-6 rounded-2xl border border-dashed border-[#304038] bg-[#0B1215] p-5">


        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">


          <div className="flex items-start gap-3">

            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#152400]">

              <Clock3
                size={18}
                className="text-[#B6FF00]"
              />

            </div>


            <div>

              <p className="font-medium text-[#F1F5F2]">
                Vous n'avez pas de tâche ?
              </p>

              <p className="mt-1 text-sm text-[#647276]">
                Signalez votre disponibilité à votre chef de projet.
              </p>

            </div>

          </div>


          {availabilityReport ? (

            <div className="flex items-center gap-2 rounded-lg border border-[#304800] bg-[#152400] px-4 py-2.5 text-sm font-medium text-[#B6FF00]">

              <CheckCircle2 size={17} />

              Disponibilité signalée

            </div>

          ) : (

            <button
              onClick={
                handleAvailabilityReport
              }
              disabled={
                reportingAvailability ||
                !availabilityTeam
              }
              className="shrink-0 rounded-lg bg-[#B6FF00] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {reportingAvailability

                ? "Signalement..."

                : "Signaler ma disponibilité"}

            </button>

          )}

        </div>


        {!availabilityReport && (

          <div className="mt-5 space-y-4">


            {/* ==================================
                ÉQUIPE
            =================================== */}

            <div>

              <label className="mb-2 block text-xs font-medium text-[#94A3A6]">
                Équipe
              </label>


              <select
                value={availabilityTeam}
                onChange={(event) =>
                  setAvailabilityTeam(
                    event.target.value
                  )
                }
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

            </div>


            {/* ==================================
                MESSAGE
            =================================== */}

            <div>

              <label className="mb-2 block text-xs font-medium text-[#94A3A6]">
                Message facultatif
              </label>


              <textarea
                value={availabilityMessage}
                onChange={(event) =>
                  setAvailabilityMessage(
                    event.target.value
                  )
                }
                rows={2}
                placeholder="Ex : Je suis disponible pour une nouvelle tâche."
                className="w-full resize-none rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
              />

            </div>

          </div>

        )}


        {availabilityReport && (

          <div className="mt-4 rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3">

            <p className="text-xs text-[#647276]">
              Votre message
            </p>


            <p className="mt-1 text-sm text-[#94A3A6]">

              {availabilityReport.message}

            </p>


            <p className="mt-2 text-xs text-[#647276]">

              Équipe :{" "}

              <span className="text-[#94A3A6]">

                {availabilityReport.team_name ||

                  `Équipe #${availabilityReport.team}`}

              </span>

            </p>

          </div>

        )}

      </div>


      {/* ======================================
          MODAL CRÉATION
      ======================================= */}

      {showCreateModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeCreateModal();

            }

          }}
        >


          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">


            <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">


              <div>

                <h2 className="text-xl font-semibold text-[#F1F5F2]">
                  Nouvelle tâche
                </h2>


                <p className="mt-1 text-sm text-[#647276]">
                  Ajoutez une tâche à votre projet.
                </p>

              </div>


              <button
                onClick={closeCreateModal}
                disabled={creatingTask}
                className="rounded-lg p-2 text-[#647276] transition hover:bg-[#10191C] hover:text-white"
              >

                <X size={20} />

              </button>

            </div>


            <form
              onSubmit={handleCreateTask}
              className="space-y-5 p-6"
            >


              {createError && (

                <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {createError}
                  </span>

                </div>

              )}


              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Titre
                </label>


                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex : Créer l'API d'authentification"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Description
                </label>


                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez la tâche..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
                />

              </div>


              <div className="grid gap-5 sm:grid-cols-2">


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Projet
                  </label>


                  <select
                    name="project"
                    value={formData.project}
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

                        </option>

                      )
                    )}

                  </select>

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Assigner à
                  </label>


                  {canAssignTasks ? (

                    <select
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                    >

                      <option value="">
                        Non assignée
                      </option>


                      {members.map(
                        (member) => (

                          <option
                            key={member.id}
                            value={member.id}
                          >

                            {member.username}

                          </option>

                        )
                      )}

                    </select>

                  ) : (

                    <div className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#94A3A6]">

                      {user?.username}

                      <span className="ml-2 text-xs text-[#647276]">
                        (vous-même)
                      </span>

                    </div>

                  )}

                </div>

              </div>


              <div className="grid gap-5 sm:grid-cols-2">


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Priorité
                  </label>


                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  >

                    <option value="LOW">
                      Faible
                    </option>

                    <option value="MEDIUM">
                      Moyenne
                    </option>

                    <option value="HIGH">
                      Haute
                    </option>

                    <option value="URGENT">
                      Urgente
                    </option>

                  </select>

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Deadline
                  </label>


                  <input
                    name="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#647276] focus:border-[#B6FF00]"
                  />

                </div>

              </div>


              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-5">


                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creatingTask}
                  className="rounded-xl border border-[#1C292D] px-5 py-3 text-sm font-medium text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
                >

                  Annuler

                </button>


                <button
                  type="submit"
                  disabled={creatingTask}
                  className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33] disabled:opacity-60"
                >

                  <Plus size={17} />

                  {creatingTask
                    ? "Création..."
                    : "Créer la tâche"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================
          MODAL MODIFICATION
      ======================================= */}

      {showEditModal && editingTask && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeEditModal();

            }

          }}
        >


          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">


            <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">


              <div>

                <h2 className="text-xl font-semibold text-[#F1F5F2]">
                  Modifier la tâche
                </h2>


                <p className="mt-1 text-sm text-[#647276]">
                  Modifiez les informations de cette tâche.
                </p>

              </div>


              <button
                onClick={closeEditModal}
                disabled={editingTaskLoading}
                className="rounded-lg p-2 text-[#647276] transition hover:bg-[#10191C] hover:text-white"
              >

                <X size={20} />

              </button>

            </div>


            <form
              onSubmit={handleUpdateTask}
              className="space-y-5 p-6"
            >


              {editError && (

                <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {editError}
                  </span>

                </div>

              )}


              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Titre
                </label>


                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Description
                </label>


                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                />

              </div>


              <div className="grid gap-5 sm:grid-cols-2">


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Projet
                  </label>


                  <select
                    name="project"
                    value={formData.project}
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

                        </option>

                      )
                    )}

                  </select>

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Assigner à
                  </label>


                  {canAssignTasks ? (

                    <select
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                    >

                      <option value="">
                        Non assignée
                      </option>


                      {members.map(
                        (member) => (

                          <option
                            key={member.id}
                            value={member.id}
                          >

                            {member.username}

                          </option>

                        )
                      )}

                    </select>

                  ) : (

                    <div className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#94A3A6]">

                      {editingTask.assigned_username ||
                        user?.username}

                    </div>

                  )}

                </div>

              </div>


              <div className="grid gap-5 sm:grid-cols-2">


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Priorité
                  </label>


                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  >

                    <option value="LOW">
                      Faible
                    </option>

                    <option value="MEDIUM">
                      Moyenne
                    </option>

                    <option value="HIGH">
                      Haute
                    </option>

                    <option value="URGENT">
                      Urgente
                    </option>

                  </select>

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Deadline
                  </label>


                  <input
                    name="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  />

                </div>

              </div>


              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-5">


                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editingTaskLoading}
                  className="rounded-xl border border-[#1C292D] px-5 py-3 text-sm font-medium text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
                >

                  Annuler

                </button>


                <button
                  type="submit"
                  disabled={editingTaskLoading}
                  className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33] disabled:opacity-60"
                >

                  <Pencil size={16} />

                  {editingTaskLoading
                    ? "Enregistrement..."
                    : "Enregistrer"}

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