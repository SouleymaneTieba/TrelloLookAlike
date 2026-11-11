import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  Layers3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GripVertical,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";


function Tasks() {

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();


  // ==========================================
  // DONNÉES
  // ==========================================

  const [tasks, setTasks] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [boardTaskIds, setBoardTaskIds] = useState([]);

  const [projects, setProjects] = useState([]);


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

  const [showCreateFeatureModal, setShowCreateFeatureModal] = useState(false);
  const [creatingFeature, setCreatingFeature] = useState(false);
  const [featureError, setFeatureError] = useState("");
  const [featureForm, setFeatureForm] = useState({
    title: "",
    project: "",
  });


  // ==========================================
  // TÂCHE EN COURS
  // ==========================================

  const [updatingTask, setUpdatingTask] =
    useState(null);

  const [draggedTaskId, setDraggedTaskId] =
    useState(null);

  const [dragOverStatus, setDragOverStatus] =
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
  // FORMULAIRE
  // ==========================================

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    feature: "",
    assigned_to: "",
    priority: "MEDIUM",
    start_date: "",
    end_date: "",
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

    return projects.some((project) => project.project_manager_ids?.includes(user.id));

  }, [
    projects,
    user,
    isAdmin,
  ]);


  // ==========================================
  // RÉCUPÉRATION DES DONNÉES
  // ==========================================

  const fetchData = async () => {

    try {

      setError("");

      const [
        tasksResponse,
        featuresResponse,
        projectsResponse,
      ] = await Promise.all([

        api.get("/tasks/"),

        api.get("/features/"),

        api.get("/projects/"),

      ]);


      setTasks(
        tasksResponse.data
      );

      setFeatures(featuresResponse.data);

      setProjects(
        projectsResponse.data
      );


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

  const selectedFeature = features.find(
    (feature) => Number(feature.id) === Number(selectedFeatureId)
  );

  const selectedFeatureTasks = selectedFeature
    ? tasks.filter((task) => Number(task.feature) === Number(selectedFeature.id))
    : [];

  const formFeature = features.find(
    (feature) => Number(feature.id) === Number(formData.feature)
  );

  const selectedProject = projects.find(
    (project) => Number(project.id) === Number(selectedFeature?.project || formFeature?.project)
  );

  const canAssignTasks =
    isAdmin || Boolean(selectedProject?.project_manager_ids?.includes(user?.id));

  const formProject = projects.find(
    (project) => Number(project.id) === Number(formFeature?.project)
  );

  const members = formProject?.member_details || selectedProject?.member_details || [];


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
        (selectedFeatureId === null || Number(task.feature) === Number(selectedFeatureId)) &&
        boardTaskIds.includes(Number(task.id)) &&
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );

    });

  }, [
    tasks,
    selectedFeatureId,
    boardTaskIds,
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

  const handleCreateFeature = async (event) => {
    event.preventDefault();
    setFeatureError("");
    if (!featureForm.title.trim() || !featureForm.project) {
      setFeatureError("Le titre et le projet sont obligatoires.");
      return;
    }
    try {
      setCreatingFeature(true);
      const response = await api.post("/features/", {
        title: featureForm.title.trim(),
        project: Number(featureForm.project),
      });
      setFeatures((items) => [response.data, ...items]);
      setFeatureForm({ title: "", project: "" });
      setShowCreateFeatureModal(false);
      setSelectedFeatureId(response.data.id);
      setBoardTaskIds([]);
    } catch (error) {
      const messages = Object.values(error.response?.data || {}).flat().join(" ");
      setFeatureError(messages || "Impossible de créer la fonctionnalité.");
    } finally {
      setCreatingFeature(false);
    }
  };


  // ==========================================
  // CRÉATION
  // ==========================================

  const openCreateModal = () => {

    setCreateError("");


    setFormData({

      title: "",

      description: "",

      feature: selectedFeatureId || "",

      assigned_to: "",

      priority: "MEDIUM",

      start_date: "",
      end_date: "",

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


    if (!formData.feature) {

      setCreateError(
        "Sélectionnez une fonctionnalité."
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

        feature:
          Number(formData.feature),

        priority:
          formData.priority,

      };


      if (canAssignTasks) {

        payload.assigned_to =
          formData.assigned_to
            ? Number(formData.assigned_to)
            : null;

      }


      payload.start_date = formData.start_date || null;
      payload.end_date = formData.end_date || null;


      const response =
        await api.post(
          "/tasks/",
          payload
        );


      setTasks((previous) => [

        response.data,

        ...previous,

      ]);
      setBoardTaskIds((previous) => [...new Set([...previous, Number(response.data.id)])]);


      setShowCreateModal(false);


      setFormData({

        title: "",

        description: "",

        feature: selectedFeatureId || "",

        assigned_to: "",

        priority: "MEDIUM",

        start_date: "",
        end_date: "",

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

  const openEditModal = useCallback((task) => {

    setEditingTask(task);

    setEditError("");


    setFormData({

      title:
        task.title || "",

      description:
        task.description || "",

      feature:
        task.feature || "",

      assigned_to:
        task.assigned_to || "",

      priority:
        task.priority || "MEDIUM",

      start_date: task.start_date || "",
      end_date: task.end_date || "",

    });


    setShowEditModal(true);

  }, []);


  useEffect(() => {
    const requestedTaskId = location.state?.openTaskId;

    if (!requestedTaskId || loading) {
      return;
    }

    const requestedTask = tasks.find(
      (task) => Number(task.id) === Number(requestedTaskId)
    );

    if (requestedTask) {
      setSelectedFeatureId(requestedTask.feature);
        setBoardTaskIds([Number(requestedTask.id)]);
      openEditModal(requestedTask);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location, loading, navigate, openEditModal, tasks]);


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


    if (!formData.feature) {

      setEditError(
        "Cette sous-tâche doit être associée à une fonctionnalité."
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

        feature:
          Number(formData.feature),

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


      payload.start_date = formData.start_date || null;
      payload.end_date = formData.end_date || null;


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
      if (Number(response.data.feature) !== Number(selectedFeatureId)) {
        setSelectedFeatureId(response.data.feature);
      }
      setBoardTaskIds((previous) => [...new Set([...previous, Number(response.data.id)])]);


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
  // CHANGER LE STATUT PAR GLISSER-DÉPOSER
  // ==========================================

  const handleTaskStatusChange = async (task, status) => {

    if (
      task.status === status ||
      updatingTask !== null ||
      !canCompleteTask(task)
    ) {
      return;
    }

    const previousStatus = task.status;

    try {

      setUpdatingTask(task.id);
      setError("");

      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? { ...item, status }
            : item
        )
      );

      const response =
        await api.patch(
          `/tasks/${task.id}/`,
          {
            status,
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

      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? { ...item, status: previousStatus }
            : item
        )
      );

      setError(
        "Impossible de modifier la tâche."
      );

    } finally {

      setUpdatingTask(null);
      setDraggedTaskId(null);
      setDragOverStatus(null);

    }

  };


  const handleTaskDragStart = (event, task) => {

    if (
      !canCompleteTask(task) ||
      updatingTask !== null
    ) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(task.id));
    event.dataTransfer.setData("text", String(task.id));
    setDraggedTaskId(task.id);

  };


  const handleTaskDrop = (event, status) => {

    event.preventDefault();
    setDragOverStatus(null);

    const taskId = event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("text") || String(draggedTaskId || "");
    const task = tasks.find((item) => String(item.id) === taskId);

    if (task) {
      handleTaskStatusChange(task, status);
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

      await api.delete(`/tasks/${task.id}/`);

      setTasks((previous) =>
        previous.filter((item) => item.id !== task.id)
      );
      setBoardTaskIds((previous) => previous.filter((id) => id !== Number(task.id)));

    } catch (error) {
      console.error(error);
      setError("Impossible de supprimer la tâche.");

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

    return task.created_by === user?.id;

  };

  const canCompleteTask = (task) => {

    if (isAdmin) {
      return true;
    }

    const taskProject = projects.find(
      (project) => Number(project.id) === Number(task.project)
    );
    const isTaskProjectManager = taskProject?.project_manager_ids?.some(
      (managerId) => Number(managerId) === Number(user?.id)
    );
    const isTaskProjectMember = taskProject?.members?.some(
      (memberId) => Number(memberId) === Number(user?.id)
    ) || taskProject?.member_details?.some(
      (member) => Number(member.id) === Number(user?.id)
    );

    if (isTaskProjectManager || isTaskProjectMember) {
      return true;
    }

    return (
      Number(task.assigned_to) === Number(user?.id) ||
      Number(task.created_by) === Number(user?.id)
    );

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

    return labels[status] || status;

  };


  const getStatusStyle = (status) => {

    const styles = {
      TODO: "bg-[#10191C] text-[#94A3A6] border-[#1C292D]",
      IN_PROGRESS: "bg-[#13231A] text-[#B6FF00] border-[#304800]",
      BLOCKED: "bg-[#2A1E0A] text-[#FFC107] border-[#4A3500]",
      DONE: "bg-[#152400] text-[#B6FF00] border-[#304800]",
    };

    return styles[status] || styles.TODO;

  };


  const getPriorityStyle = (priority) => {

    const styles = {
      LOW: "text-[#94A3A6]",
      MEDIUM: "text-[#C4D000]",
      HIGH: "text-[#FFC107]",
      URGENT: "text-[#FF4D4D]",
    };

    return styles[priority] || styles.MEDIUM;

  };


  const formatDate = (date) => {

    if (!date) {
      return "Pas de date de fin";
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
            {selectedFeature ? selectedFeature.title : "Fonctionnalités"}
          </h1>

          <p className="mt-2 text-[#94A3A6]">
            Consultez les fonctionnalités du projet et leurs sous-tâches.
          </p>

        </div>


        <div className="flex gap-3">
          {selectedFeature && (
            <button onClick={() => { setSelectedFeatureId(null); setBoardTaskIds([]); }} className="flex items-center gap-2 rounded-xl border border-[#1C292D] px-4 py-3 text-[#F1F5F2]">
              <ArrowLeft size={18} /> Fonctionnalités
            </button>
          )}
          {(isAdmin || isProjectManager) && (
            <button
              onClick={() => selectedFeature ? openCreateModal() : setShowCreateFeatureModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-3 font-semibold text-black transition hover:bg-[#C4FF33]"
            >
              <Plus size={19} /> {selectedFeature ? "Nouvelle sous-tâche" : "Nouvelle fonctionnalité"}
            </button>
          )}
        </div>

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


      <>
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


      <section aria-labelledby="task-feature-selector-title" className="mt-4 rounded-2xl border border-[#1C292D] bg-[#0B1215] p-4">
        <label htmlFor="task-feature-picker" id="task-feature-selector-title" className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#F1F5F2]">
          <Layers3 size={17} className="text-[#B6FF00]" /> Fonctionnalité
        </label>
        {features.length === 0 ? (
          <p className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#647276]">Aucune fonctionnalité disponible.</p>
        ) : (
          <select
            id="task-feature-picker"
            value={selectedFeatureId || ""}
            onChange={(event) => {
              const featureId = event.target.value ? Number(event.target.value) : null;
              setSelectedFeatureId(featureId);
              setBoardTaskIds([]);
              setStatusFilter("ALL");
              setPriorityFilter("ALL");
              setSearch("");
            }}
            className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
          >
            <option value="">Choisir une fonctionnalité</option>
            {features.map((feature) => (
              <option key={feature.id} value={feature.id}>
                {feature.title}{feature.project_name ? ` · ${feature.project_name}` : ""}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 border-t border-[#1C292D] pt-4">
          <label htmlFor="task-feature-task-picker" className="mb-2 block text-xs font-medium text-[#94A3A6]">
            {selectedFeature ? `Ajouter une tâche de « ${selectedFeature.title} » au tableau` : "Sélectionnez une fonctionnalité pour choisir ses tâches"}
          </label>
          <select
            id="task-feature-task-picker"
            value=""
            disabled={!selectedFeature || selectedFeatureTasks.every((task) => boardTaskIds.includes(Number(task.id)))}
            onChange={(event) => {
              const taskId = Number(event.target.value);
              if (taskId) {
                setBoardTaskIds((previous) => [...new Set([...previous, taskId])]);
                setSearch("");
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
              }
            }}
            className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {!selectedFeature
                ? "Choisir d’abord une fonctionnalité"
                : selectedFeatureTasks.length === 0
                  ? "Aucune tâche dans cette fonctionnalité"
                  : selectedFeatureTasks.every((task) => boardTaskIds.includes(Number(task.id)))
                    ? "Toutes les tâches sont déjà dans le tableau"
                    : "Choisir une tâche"}
            </option>
            {selectedFeatureTasks.filter((task) => !boardTaskIds.includes(Number(task.id))).map((task) => (
              <option key={task.id} value={task.id}>{task.title} · {getStatusLabel(task.status)}</option>
            ))}
          </select>
        </div>
      </section>

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

            {selectedFeatureTasks.length} dans la fonctionnalité

        </span>

      </div>


      {/* ======================================
          TABLEAU DES TÂCHES
      ======================================= */}

      {!selectedFeature ? (

        <div className="mt-4 rounded-2xl border border-[#1C292D] bg-[#0B1215] px-6 py-14 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">

            <ListTodo
              size={25}
              className="text-[#B6FF00]"
            />

          </div>


          <h2 className="mt-5 font-semibold text-[#F1F5F2]">
            Sélectionnez une fonctionnalité
          </h2>


          <p className="mx-auto mt-2 max-w-md text-sm text-[#647276]">

            {search ||
            statusFilter !== "ALL" ||
            priorityFilter !== "ALL"

              ? "Essayez de modifier vos filtres."

              : "Les fonctionnalités apparaîtront ici pour consulter leurs tâches."}

          </p>

        </div>

      ) : (

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">

          {[
            { status: "TODO", title: "À faire" },
            { status: "IN_PROGRESS", title: "En cours" },
            { status: "BLOCKED", title: "Bloquées" },
            { status: "DONE", title: "Terminées" },
          ].map((column) => {

            const columnTasks = filteredTasks.filter(
              (task) => task.status === column.status
            );

            return (

              <section
                key={column.status}
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
                onDrop={(event) => handleTaskDrop(event, column.status)}
                className={`min-h-52 rounded-2xl border p-3 transition-colors ${
                  dragOverStatus === column.status
                    ? "border-[#B6FF00] bg-[#152400]"
                    : "border-[#1C292D] bg-[#0B1215]"
                }`}
              >

                <div className="mb-3 flex items-center justify-between px-1 py-2">
                  <h2 className="font-semibold text-[#F1F5F2]">
                    {column.title}
                  </h2>
                  <span className="rounded-full bg-[#10191C] px-2.5 py-1 text-xs text-[#94A3A6]">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3">

                  {columnTasks.length === 0 && (
                    <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-[#26363A] px-4 text-center text-sm text-[#647276]">
                      {boardTaskIds.length === 0 ? "Ajoutez une tâche avec le sélecteur ci-dessus" : "Déposer une tâche ici"}
                    </div>
                  )}

                  {columnTasks.map((task) => {

            const isDone =
              task.status === "DONE";


            const isUpdating =
              updatingTask === task.id;


            const isDeleting =
              deletingTask === task.id;

            const canDrag =
              canCompleteTask(task) &&
              !isUpdating &&
              !isDeleting;


            const projectName =
              projects.find(
                (project) =>
                  project.id === task.project
              )?.name ||

              `Projet #${task.project}`;


            return (

              <div
                key={task.id}
                draggable={canDrag}
                onDragStart={(event) => handleTaskDragStart(event, task)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleTaskDrop(event, column.status);
                }}
                onDragEnd={() => {
                  setDraggedTaskId(null);
                  setDragOverStatus(null);
                }}
                title={canDrag ? "Glisser vers un statut pour déplacer la tâche" : undefined}
                className={`rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5 transition hover:border-orange-300 hover:bg-[#FFF3EB] ${
                  canDrag ? "cursor-grab active:cursor-grabbing" : ""
                } ${draggedTaskId === task.id ? "opacity-50" : ""}`}
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">


                  <div className="flex min-w-0 items-start gap-4">


                    {canDrag && (
                      <GripVertical
                        size={20}
                        className="mt-1 shrink-0 text-[#647276]"
                        aria-hidden="true"
                      />
                    )}


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

                          {task.start_date && <>Début : {formatDate(task.start_date)} · </>}
                          {formatDate(task.end_date || task.deadline)}

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
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#94A3A6] transition hover:bg-[#10191C] hover:text-[#B6FF00]"
                        >

                          <Pencil size={14} />

                          Modifier

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
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#94A3A6] transition hover:bg-red-600 hover:text-white disabled:opacity-50"
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

              </section>

            );
          })}

        </div>

      )}


      </>

      {showCreateFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateFeature} className="w-full max-w-xl space-y-5 rounded-2xl border border-[#1C292D] bg-[#0B1215] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#F1F5F2]">Nouvelle fonctionnalité</h2>
              <button type="button" onClick={() => setShowCreateFeatureModal(false)} className="rounded-lg p-2 text-[#647276]"><X size={20} /></button>
            </div>
            {featureError && <p className="rounded-xl bg-red-950/30 p-3 text-sm text-red-400">{featureError}</p>}
            <input value={featureForm.title} onChange={(event) => setFeatureForm((form) => ({ ...form, title: event.target.value }))} placeholder="Titre de la fonctionnalité" required className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-white" />
            <select value={featureForm.project} onChange={(event) => setFeatureForm((form) => ({ ...form, project: event.target.value }))} required className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-white">
              <option value="">Sélectionner un projet</option>
              {projects.filter((project) => isAdmin || project.project_manager_ids?.includes(user?.id)).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <button disabled={creatingFeature} className="w-full rounded-xl bg-[#B6FF00] px-4 py-3 font-semibold text-black">{creatingFeature ? "Création…" : "Créer la fonctionnalité"}</button>
          </form>
        </div>
      )}

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
                  Nouvelle sous-tâche
                </h2>


                <p className="mt-1 text-sm text-[#647276]">
                  Ajoutez une sous-tâche à cette fonctionnalité.
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
                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">Fonctionnalité</label>
                  <div className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#94A3A6]">
                    {formFeature?.title || selectedFeature?.title || "Aucune fonctionnalité sélectionnée"}
                  </div>
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
                      required
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
                    required
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


                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">Date de début</label>
                    <input name="start_date" type="date" value={formData.start_date} onChange={handleChange} required className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">Date de fin</label>
                    <input name="end_date" type="date" min={formData.start_date || undefined} value={formData.end_date} onChange={handleChange} required className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]" />
                  </div>
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
                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">Fonctionnalité</label>
                  <div className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#94A3A6]">
                    {formFeature?.title || selectedFeature?.title || "Aucune fonctionnalité sélectionnée"}
                  </div>
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


                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">Date de début</label>
                    <input name="start_date" type="date" value={formData.start_date} onChange={handleChange} className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">Date de fin</label>
                    <input name="end_date" type="date" min={formData.start_date || undefined} value={formData.end_date} onChange={handleChange} className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]" />
                  </div>
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
