import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  FolderKanban,
  Layers3,
  Mail,
  Plus,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  ListTodo,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import ProjectTaskBoard from "../../components/projects/ProjectTaskBoard";
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
  status: "PLANNED",
  start_date: "",
  end_date: "",
};


function Projects() {

  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [savingMembers, setSavingMembers] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);
  const [highlightedMemberId, setHighlightedMemberId] = useState(null);
  const [projectView, setProjectView] = useState("tasks");
  const [membersSidebarOpen, setMembersSidebarOpen] = useState(true);
  const [projectFeatures, setProjectFeatures] = useState([]);
  const [projectRoles, setProjectRoles] = useState([]);
  const [updatingRoleMemberId, setUpdatingRoleMemberId] = useState(null);
  const [profileMember, setProfileMember] = useState(null);
  const [isClosingMemberProfile, setIsClosingMemberProfile] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [creatingFeature, setCreatingFeature] = useState(false);
  const [deletingFeatureId, setDeletingFeatureId] = useState(null);
  const [featureError, setFeatureError] = useState("");
  const [featureActionError, setFeatureActionError] = useState("");
  const [featureForm, setFeatureForm] = useState({ title: "" });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [editingFeatureTask, setEditingFeatureTask] = useState(null);
  const [deletingFeatureTaskId, setDeletingFeatureTaskId] = useState(null);
  const [taskFormError, setTaskFormError] = useState("");
  const [taskActionError, setTaskActionError] = useState("");
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "TODO", priority: "MEDIUM", assigned_to: "", start_date: "", end_date: "" });
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);
  const [projectTasksError, setProjectTasksError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingProject, setEditingProject] =
    useState(null);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  const associatedMembers = selectedProject?.member_details || [];
  const highlightedMember = associatedMembers.find(
    (member) => Number(member.id) === Number(highlightedMemberId)
  );
  const projectProgress = (selectedProject?.task_count ?? 0) > 0
    ? Math.round(
        ((selectedProject.completed_task_count ?? 0) / selectedProject.task_count) * 100
      )
    : 0;
  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const filteredProjects = projects.filter((project) =>
    [project.name, project.description].some((value) =>
      (value || "").toLocaleLowerCase("fr").includes(normalizedSearch)
    )
  );
  const getMemberInitials = (member) => {
    const nameParts = [member.first_name, member.last_name].filter(Boolean);
    const initials = nameParts.length
      ? nameParts.map((part) => part[0]).join("")
      : (member.username || "?").slice(0, 2);

    return initials.toLocaleUpperCase("fr");
  };

  const handleOpenMemberProfile = (member) => {
    const userDetails = users.find((user) => Number(user.id) === Number(member.id));
    setIsClosingMemberProfile(false);
    setProfileMember({ ...userDetails, ...member });
  };

  const handleCloseMemberProfile = () => {
    if (!isClosingMemberProfile) setIsClosingMemberProfile(true);
  };

  useEffect(() => {
    if (!profileMember) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsClosingMemberProfile(true);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [profileMember, isClosingMemberProfile]);

  const openProjectDetails = (project) => {
    setSelectedProject(project);
    setProjectView("tasks");
    setHighlightedMemberId(null);
    setSelectedFeature(null);
    setSelectedMemberId("");
    setMembersError("");
    setShowMemberPicker(false);
    setShowFeatureForm(false);
    setSelectedFeature(null);
    setProjectRoles([]);
  };


  // ==========================================
  // CHARGER LES DONNÉES
  // ==========================================

  const fetchData = async () => {

    try {

      setLoading(true);
      setError("");

      const [projectsResponse, usersResponse] = await Promise.all([
        api.get("/projects/"),
        api.get("/users/"),
      ]);

      setProjects(
        projectsResponse.data
      );

      setUsers(usersResponse.data);

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


  useEffect(() => {

    if (!selectedProject) {
      setProjectTasks([]);
      setHighlightedMemberId(null);
      setProjectFeatures([]);
      setProjectRoles([]);
      return undefined;
    }
    let isMounted = true;
    setLoadingProjectTasks(true);
    setProjectTasksError("");
    Promise.all([
      api.get("/tasks/"),
      api.get("/features/"),
      api.get(`/projects/${selectedProject.id}/members/`),
    ])
      .then(([tasksResponse, featuresResponse, membersResponse]) => {
        if (isMounted) {
          const tasks = tasksResponse.data.filter((task) => Number(task.project) === Number(selectedProject.id));
          setProjectTasks(tasks);
          setProjectFeatures(featuresResponse.data.filter((feature) => Number(feature.project) === Number(selectedProject.id)));
          setProjectRoles(membersResponse.data.roles || []);
        }
      })
      .catch((requestError) => {
        console.error(requestError);
        if (isMounted) setProjectTasksError("Impossible de récupérer les tâches du projet.");
      })
      .finally(() => {
        if (isMounted) setLoadingProjectTasks(false);
      });
    return () => { isMounted = false; };

  }, [selectedProject?.id]);


  // ==========================================
  // CHANGEMENT FORMULAIRE
  // ==========================================

  const handleChange = (event) => {

    const { name, value, multiple, selectedOptions } = event.target;
    const nextValue = multiple
      ? Array.from(selectedOptions, (option) => Number(option.value))
      : value;

    setForm((previous) => ({
      ...previous,
      [name]: nextValue,
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

        setSelectedProject(response.data);
        setProjectView("tasks");
        setSelectedMemberId("");
        setMembersError("");

      }


      setShowModal(false);
      setEditingProject(null);
      setForm(initialForm);
      setFormError("");

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

  const handleSaveMembers = async () => {
    if (!selectedProject) return;
    setSavingMembers(true);
    setMembersError("");
    try {
      if (!selectedMemberId) return;
      const currentMemberIds = (selectedProject.members || []).map(Number);
      const { data } = await api.put(`/projects/${selectedProject.id}/members/`, {
        members: [...new Set([...currentMemberIds, Number(selectedMemberId)])],
      });
      setProjects((previous) => previous.map((project) =>
        project.id === data.id ? data : project
      ));
      setSelectedProject(data);
      setSelectedMemberId("");
      setShowMemberPicker(false);
    } catch (error) {
      const messages = Object.values(error.response?.data || {}).flat().join(" ");
      setMembersError(messages || "Impossible d'enregistrer les membres du projet.");
    } finally {
      setSavingMembers(false);
    }
  };

  const handleUpdateMemberRole = async (memberId, roleId) => {
    if (!selectedProject) return;
    setUpdatingRoleMemberId(memberId);
    setMembersError("");
    try {
      const { data } = await api.patch(`/projects/${selectedProject.id}/members/`, {
        user: memberId,
        role: roleId ? Number(roleId) : null,
      });
      setProjects((previous) => previous.map((project) => (
        project.id === data.id ? data : project
      )));
      setSelectedProject(data);
      const updatedMember = data.member_details?.find(
        (member) => Number(member.id) === Number(memberId)
      );
      if (updatedMember) {
        setProfileMember((previous) => (
          previous && Number(previous.id) === Number(memberId)
            ? { ...previous, ...updatedMember }
            : previous
        ));
      }
    } catch (error) {
      const messages = Object.values(error.response?.data || {}).flat().join(" ");
      setMembersError(messages || "Impossible de modifier le rôle du membre.");
    } finally {
      setUpdatingRoleMemberId(null);
    }
  };

  const handleCreateFeature = async (event) => {
    event.preventDefault();
    if (!selectedProject || !featureForm.title.trim()) return;
    setCreatingFeature(true);
    setFeatureError("");
    try {
      const { data } = editingFeature
        ? await api.patch(`/features/${editingFeature.id}/`, {
            title: featureForm.title.trim(),
          })
        : await api.post("/features/", {
            project: selectedProject.id,
            title: featureForm.title.trim(),
          });

      if (editingFeature) {
        setProjectFeatures((previous) => previous.map((feature) => (
          feature.id === data.id ? data : feature
        )));
        setSelectedFeature((feature) => (
          feature?.id === data.id ? data : feature
        ));
      } else {
        setProjectFeatures((previous) => [data, ...previous]);
        setSelectedFeature(data);
      }

      setFeatureForm({ title: "" });
      setEditingFeature(null);
      setShowFeatureForm(false);
    } catch (error) {
      const messages = Object.values(error.response?.data || {}).flat().join(" ");
      setFeatureError(messages || (editingFeature
        ? "Impossible de modifier la fonctionnalité."
        : "Impossible de créer la fonctionnalité."));
    } finally {
      setCreatingFeature(false);
    }
  };

  const handleEditFeature = (feature) => {
    setEditingFeature(feature);
    setFeatureForm({ title: feature.title || "" });
    setFeatureError("");
    setFeatureActionError("");
    setShowFeatureForm(true);
  };

  const handleDeleteFeature = async (feature) => {
    const featureTasks = projectTasks.filter(
      (task) => Number(task.feature) === Number(feature.id)
    );
    const confirmation = featureTasks.length
      ? `Supprimer la fonctionnalité « ${feature.title} » et ses ${featureTasks.length} tâche(s) ? Cette action est irréversible.`
      : `Supprimer la fonctionnalité « ${feature.title} » ?`;
    if (!window.confirm(confirmation)) return;

    setDeletingFeatureId(feature.id);
    setFeatureActionError("");
    try {
      await api.delete(`/features/${feature.id}/`);
      setProjectFeatures((previous) => previous.filter((item) => item.id !== feature.id));
      setProjectTasks((previous) => previous.filter(
        (task) => Number(task.feature) !== Number(feature.id)
      ));
      setSelectedFeature((current) => (
        Number(current?.id) === Number(feature.id) ? null : current
      ));
      setSelectedProject((project) => project ? {
        ...project,
        task_count: Math.max(0, (project.task_count || 0) - featureTasks.length),
        completed_task_count: Math.max(
          0,
          (project.completed_task_count || 0)
            - featureTasks.filter((task) => task.status === "DONE").length
        ),
      } : project);
      setProjects((previous) => previous.map((project) => (
        Number(project.id) === Number(feature.project)
          ? {
              ...project,
              task_count: Math.max(0, (project.task_count || 0) - featureTasks.length),
              completed_task_count: Math.max(
                0,
                (project.completed_task_count || 0)
                  - featureTasks.filter((task) => task.status === "DONE").length
              ),
            }
          : project
      )));
    } catch (error) {
      console.error(error);
      const messages = Object.values(error.response?.data || {}).flat().join(" ");
      setFeatureActionError(messages || "Impossible de supprimer la fonctionnalité.");
    } finally {
      setDeletingFeatureId(null);
    }
  };

  const handleCreateFeatureTask = async (event) => {
    event.preventDefault();
    if (!selectedProject || !selectedFeature || !taskForm.title.trim()) return;
    setCreatingTask(true);
    setTaskFormError("");
    try {
      const payload = {
        feature: selectedFeature.id,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        status: taskForm.status,
        priority: taskForm.priority,
        assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null,
        start_date: taskForm.start_date || null,
        end_date: taskForm.end_date || null,
      };
      const { data } = editingFeatureTask
        ? await api.patch(`/tasks/${editingFeatureTask.id}/`, payload)
        : await api.post("/tasks/", payload);

      if (editingFeatureTask) {
        const completedDelta = Number(data.status === "DONE") - Number(editingFeatureTask.status === "DONE");
        setProjectTasks((previous) => previous.map((task) => task.id === data.id ? data : task));
        if (completedDelta) {
          const adjustCompleted = (feature) => {
            if (!feature || Number(feature.id) !== Number(selectedFeature.id)) return feature;
            const completed_subtask_count = Math.max(0, (feature.completed_subtask_count || 0) + completedDelta);
            return { ...feature, completed_subtask_count, progress: feature.subtask_count ? Math.round(completed_subtask_count * 100 / feature.subtask_count) : 0 };
          };
          setProjectFeatures((previous) => previous.map(adjustCompleted));
          setSelectedFeature(adjustCompleted);
          setSelectedProject((project) => project ? { ...project, completed_task_count: Math.max(0, (project.completed_task_count || 0) + completedDelta) } : project);
        }
      } else {
        setProjectTasks((previous) => [data, ...previous]);
        const completedDelta = Number(data.status === "DONE");
        const adjustCreatedFeature = (feature) => {
          if (!feature || Number(feature.id) !== Number(selectedFeature.id)) return feature;
          const subtask_count = (feature.subtask_count || 0) + 1;
          const completed_subtask_count = (feature.completed_subtask_count || 0) + completedDelta;
          return { ...feature, subtask_count, completed_subtask_count, progress: Math.round(completed_subtask_count * 100 / subtask_count) };
        };
        setProjectFeatures((previous) => previous.map(adjustCreatedFeature));
        setSelectedFeature(adjustCreatedFeature);
        setSelectedProject((project) => project ? {
          ...project,
          task_count: (project.task_count || 0) + 1,
          completed_task_count: (project.completed_task_count || 0) + completedDelta,
        } : project);
      }
      setTaskForm({ title: "", description: "", status: "TODO", priority: "MEDIUM", assigned_to: "", start_date: "", end_date: "" });
      setEditingFeatureTask(null);
      setTaskActionError("");
      setShowTaskForm(false);
    } catch (error) {
      const messages = Object.values(error.response?.data || {}).flat().join(" ");
      setTaskFormError(messages || (editingFeatureTask ? "Impossible de modifier la tâche." : "Impossible de créer la tâche."));
    } finally {
      setCreatingTask(false);
    }
  };

  const handleEditFeatureTask = (task) => {
    setEditingFeatureTask(task);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      assigned_to: task.assigned_to || "",
      start_date: task.start_date || "",
      end_date: task.end_date || "",
    });
    setTaskFormError("");
    setTaskActionError("");
    setShowTaskForm(true);
  };

  const handleDeleteFeatureTask = async (task) => {
    if (!window.confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
    setDeletingFeatureTaskId(task.id);
    setTaskActionError("");
    try {
      await api.delete(`/tasks/${task.id}/`);
      setProjectTasks((previous) => previous.filter((item) => item.id !== task.id));
      const totalDelta = -1;
      const completedDelta = task.status === "DONE" ? -1 : 0;
      const adjustDeletedFeature = (feature) => {
        if (!feature || Number(feature.id) !== Number(task.feature)) return feature;
        const subtask_count = Math.max(0, (feature.subtask_count || 0) + totalDelta);
        const completed_subtask_count = Math.max(0, (feature.completed_subtask_count || 0) + completedDelta);
        return { ...feature, subtask_count, completed_subtask_count, progress: subtask_count ? Math.round(completed_subtask_count * 100 / subtask_count) : 0 };
      };
      setProjectFeatures((previous) => previous.map(adjustDeletedFeature));
      setSelectedFeature(adjustDeletedFeature);
      setSelectedProject((project) => project ? {
        ...project,
        task_count: Math.max(0, (project.task_count || 0) + totalDelta),
        completed_task_count: Math.max(0, (project.completed_task_count || 0) + completedDelta),
      } : project);
    } catch (error) {
      const messages = Object.values(error.response?.data || {}).flat().join(" ");
      setTaskActionError(messages || "Impossible de supprimer la tâche.");
    } finally {
      setDeletingFeatureTaskId(null);
    }
  };

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

    <div className={selectedProject
      ? membersSidebarOpen
        ? "lg:pr-72"
        : "lg:pr-[4.25rem]"
      : ""}
    >


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
              {!selectedProject && (
                <p className="mb-2 text-sm font-medium text-[#B6FF00]">
                  Administration
                </p>
              )}
              {selectedProject ? (
                <>
                  <div className="-mx-1 overflow-x-auto px-1 pb-1">
                    <div className="flex w-max min-w-full items-center gap-6">
                      <div className="flex shrink-0 items-center gap-4">
                        <h1
                          title={selectedProject.name}
                          className="max-w-[32rem] truncate text-2xl font-semibold text-[#F1F5F2]"
                        >
                          {selectedProject.name}
                        </h1>
                        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(selectedProject.status)}`}>
                          {selectedProject.status_label || getStatusLabel(selectedProject.status)}
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
                          Membres : {associatedMembers.length}
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
                  Créez vos projets, puis ajoutez les membres depuis leurs détails.
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
          PROJECTS
      ======================================= */}

      <div className={`mt-8 ${selectedProject ? "hidden" : ""}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block w-full sm:max-w-2xl sm:flex-1">
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

          <button
            onClick={handleOpenCreate}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33]"
          >
            <Plus size={18} />
            Créer un projet
          </button>

          <span className="text-sm text-[#647276] sm:ml-auto">
            {filteredProjects.length} projet
            {filteredProjects.length > 1 ? "s" : ""}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">
              <FolderKanban size={25} className="text-[#B6FF00]" />
            </div>
            <h2 className="mt-5 font-semibold text-[#F1F5F2]">
              Aucun projet
            </h2>
            <p className="mt-2 text-sm text-[#647276]">
              Commencez par créer votre premier projet.
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-12 text-center text-sm text-[#647276]">
            Aucun projet ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredProjects.map((project) => {

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
              className="flex cursor-pointer flex-col rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5 transition hover:border-[#304800] focus:outline-none focus:ring-2 focus:ring-[#B6FF00]"
              role="button"
              tabIndex={0}
              onClick={() => openProjectDetails(project)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openProjectDetails(project);
                }
              }}
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

                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-[#647276]">
                        {project.members?.length || 0} membre(s)
                      </p>
                    </div>

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


              {/* DEADLINE */}

              <div className="mt-5 flex items-center gap-2 text-xs text-[#647276]">
                <CalendarDays size={15} />
                <span>Échéance :</span>
                <span className="text-[#94A3A6]">
                  {project.end_date
                    ? new Date(`${project.end_date}T00:00:00`).toLocaleDateString("fr-FR")
                    : "Non définie"}
                </span>
              </div>


              {/* PROGRESSION */}

              <div className="mt-5 border-t border-[#1C292D] pt-4">

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
            </div>

            );

          })}

          </div>
        )}
      </div>


      {/* DÉTAILS DU PROJET */}

      {selectedProject && (
        <div className="mt-8 flex min-w-0 items-stretch">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 border-b border-[#1C292D]">
              <nav
                aria-label="Navigation du projet"
                role="tablist"
                className="flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
              >
                {[
                  { id: "tasks", label: "Tâches", count: projectTasks.length },
                  { id: "management", label: "Gestion des tâches" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={projectView === tab.id}
                    onClick={() => setProjectView(tab.id)}
                    className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-5 py-4 text-base font-semibold transition ${
                      projectView === tab.id
                        ? "border-orange-500 text-[#F1F5F2]"
                        : "border-transparent text-[#94A3A6] hover:border-[#647276] hover:text-[#F1F5F2]"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`rounded px-2 py-0.5 text-xs ${
                        projectView === tab.id
                          ? "bg-orange-500 text-black"
                          : "bg-[#10191C] text-[#94A3A6]"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {projectView === "tasks" ? (
              <div className="mt-5 min-w-0">
                <ProjectTaskBoard
                  key={selectedProject.id}
                  project={selectedProject}
                  tasks={projectTasks}
                  selectedTaskIds={projectTasks.map((task) => Number(task.id))}
                  highlightedMemberId={highlightedMemberId}
                  highlightedMemberName={
                    [highlightedMember?.first_name, highlightedMember?.last_name]
                      .filter(Boolean)
                      .join(" ") || highlightedMember?.username
                  }
                  loading={loadingProjectTasks}
                  error={projectTasksError}
                  onTaskUpdated={handleProjectTaskUpdated}
                  showTaskOwners={false}
                  commentsReadOnly
                />
              </div>
            ) : (
          <div className="mt-6 grid w-full items-stretch gap-5 xl:grid-cols-2">

            <section aria-labelledby="admin-project-features-title" className="flex min-w-0 flex-col rounded-3xl border border-[#1C292D] bg-[#0B1215] p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 id="admin-project-features-title" className="flex items-center gap-2 text-base font-semibold text-[#F1F5F2]">
                  <Layers3 size={18} className="text-orange-500" /> Fonctionnalités
                </h3>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#10191C] px-2.5 py-1 text-xs text-[#94A3A6]">{projectFeatures.length}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFeature(null);
                      setFeatureForm({ title: "" });
                      setFeatureError("");
                      setFeatureActionError("");
                      setShowFeatureForm(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-orange-400"
                  >
                    <Plus size={16} /> Ajouter une fonctionnalité
                  </button>
                </div>
              </div>

              <div
                aria-label="Liste des fonctionnalités du projet"
                tabIndex={0}
                className="pr-1"
              >
                {featureActionError && (
                  <p role="alert" className="mb-3 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
                    {featureActionError}
                  </p>
                )}
                {projectTasksError ? (
                  <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">{projectTasksError}</p>
                ) : loadingProjectTasks ? (
                  <p className="rounded-xl border border-[#1C292D] bg-[#10191C] p-4 text-sm text-[#647276]">Chargement des fonctionnalités…</p>
                ) : projectFeatures.length === 0 ? (
                  <p className="rounded-xl border border-[#1C292D] bg-[#10191C] p-4 text-sm text-[#647276]">Aucune fonctionnalité pour ce projet.</p>
                ) : (
                  <div className="grid w-full gap-3">
                    {projectFeatures.map((feature) => (
                      <div
                        key={feature.id}
                        className={`flex w-full items-center gap-2 rounded-xl border p-3 transition ${
                          Number(selectedFeature?.id) === Number(feature.id)
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-[#1C292D] bg-[#10191C] hover:border-orange-500/60 hover:bg-[#141E22]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedFeature(feature)}
                          aria-pressed={Number(selectedFeature?.id) === Number(feature.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400"><Layers3 size={18} /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-[#F1F5F2]">{feature.title}</span>
                            <span className="block truncate text-xs text-[#647276]">{feature.completed_subtask_count}/{feature.subtask_count} tâches terminées</span>
                          </span>
                          <span className="w-32 shrink-0">
                            <span className="block text-right text-xs font-semibold text-orange-300">{feature.progress}%</span>
                            <span className="mt-1 block h-2.5 overflow-hidden rounded-full border border-white/40 bg-white shadow-sm">
                              <span className="block h-full rounded-full bg-orange-500" style={{ width: `${feature.progress}%` }} />
                            </span>
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            onClick={() => handleEditFeature(feature)}
                            aria-label={`Modifier la fonctionnalité ${feature.title}`}
                            title="Modifier"
                            className="rounded-lg p-2 text-[#94A3A6] transition hover:bg-[#10191C] hover:text-orange-300"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeature(feature)}
                            disabled={deletingFeatureId === feature.id}
                            aria-label={`Supprimer la fonctionnalité ${feature.title}`}
                            title="Supprimer"
                            className="rounded-lg p-2 text-[#94A3A6] transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                          >
                            <Trash2 size={15} className={deletingFeatureId === feature.id ? "animate-pulse" : ""} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="admin-project-feature-tasks-title" className="flex min-w-0 flex-col rounded-3xl border border-[#1C292D] bg-[#0B1215] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="admin-project-feature-tasks-title" className="flex items-center gap-2 text-base font-semibold text-[#F1F5F2]">
                    <ListTodo size={18} className="text-orange-500" /> Tâches
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {selectedFeature && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFeatureTask(null);
                        setTaskForm({ title: "", description: "", status: "TODO", priority: "MEDIUM", assigned_to: "", start_date: "", end_date: "" });
                        setTaskFormError("");
                        setTaskActionError("");
                        setShowTaskForm(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-orange-400"
                    >
                      <Plus size={16} /> Créer une tâche
                    </button>
                  )}
                  {selectedFeature && (
                    <button type="button" onClick={() => setSelectedFeature(null)} className="shrink-0 rounded-xl border border-[#1C292D] px-3 py-2 text-sm text-[#F1F5F2] hover:bg-[#10191C]">
                      Toutes
                    </button>
                  )}
                </div>
              </div>

              <div
                aria-label="Liste des tâches de la fonctionnalité"
                tabIndex={0}
                className="pr-1"
              >
                {taskActionError && <p className="mb-3 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">{taskActionError}</p>}

                {projectTasksError ? (
                  <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">{projectTasksError}</p>
                ) : loadingProjectTasks ? (
                  <p className="rounded-xl border border-[#1C292D] bg-[#10191C] p-4 text-sm text-[#647276]">Chargement des tâches…</p>
                ) : !selectedFeature ? (
                  <p className="rounded-xl border border-[#1C292D] bg-[#10191C] p-4 text-sm text-[#647276]">Sélectionnez une fonctionnalité pour afficher ses tâches.</p>
                ) : (() => {
                const featureTasks = projectTasks.filter((task) => Number(task.feature) === Number(selectedFeature.id));
                return featureTasks.length === 0 ? (
                  <p className="rounded-xl border border-[#1C292D] bg-[#10191C] p-4 text-sm text-[#647276]">Aucune tâche dans cette fonctionnalité.</p>
                ) : (
                  <div className="grid w-full gap-3">
                    {featureTasks.map((task) => (
                      <article key={task.id} className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] p-3">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="truncate text-sm font-medium text-[#F1F5F2]">{task.title}</h4>
                              <span className="shrink-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-300">{task.status_label || task.status}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3">
                              {task.description && (
                                <p className="min-w-0 flex-1 whitespace-pre-wrap text-xs leading-5 text-[#647276]">{task.description}</p>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#94A3A6]">
                              <span>Priorité : {task.priority_label || task.priority}</span>
                              <span>Assignée à : {task.assigned_username || "Personne"}</span>
                              {(task.end_date || task.deadline) && <span>Échéance : {new Date(task.end_date ? `${task.end_date}T00:00:00` : task.deadline).toLocaleDateString("fr-FR")}</span>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 self-center">
                          <button type="button" onClick={() => handleEditFeatureTask(task)} aria-label={`Modifier ${task.title}`} title="Modifier" className="rounded-lg p-1.5 text-[#94A3A6] transition hover:bg-[#10191C] hover:text-orange-300">
                            <Edit3 size={14} />
                          </button>
                          <button type="button" onClick={() => handleDeleteFeatureTask(task)} disabled={deletingFeatureTaskId === task.id} aria-label={`Supprimer ${task.title}`} title="Supprimer" className="rounded-lg p-1.5 text-[#94A3A6] transition hover:bg-red-600 hover:text-white disabled:opacity-50">
                            <Trash2 size={14} className={deletingFeatureTaskId === task.id ? "animate-pulse" : ""} />
                          </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                );
                })()}
              </div>
            </section>

          </div>
            )}
          </div>

          <aside
            id="project-members-sidebar"
            aria-label="Membres du projet"
            style={{ width: membersSidebarOpen ? "min(18rem, 85vw)" : "4.25rem" }}
            className={`fixed bottom-0 right-0 top-20 z-40 flex shrink-0 flex-col border-l border-[#1C292D] bg-[#0B1215] transition-[width] ${
              membersSidebarOpen ? "" : "items-center"
            }`}
          >
              <div className={`flex h-[68px] shrink-0 items-center border-b border-[#1C292D] ${
                membersSidebarOpen ? "justify-between px-4" : "justify-center px-2"
              }`}>
                {membersSidebarOpen && (
                  <div className="min-w-0">
                    <h2 id="project-members-sidebar-title" className="truncate font-semibold text-[#F1F5F2]">
                      Membres
                    </h2>
                    <p className="mt-1 text-xs text-[#647276]">
                      {associatedMembers.filter((member) => member.is_active !== false).length} membre(s)
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  aria-expanded={membersSidebarOpen}
                  aria-controls="project-members-sidebar-list"
                  onClick={() => setMembersSidebarOpen((open) => !open)}
                  title={membersSidebarOpen ? "Réduire les membres" : "Développer les membres"}
                  aria-label={membersSidebarOpen ? "Réduire les membres" : "Développer les membres"}
                  className="rounded-lg p-1.5 text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
                >
                  {membersSidebarOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
                </button>
              </div>
              <div
                id="project-members-sidebar-list"
                className={`flex-1 space-y-1 overflow-y-auto p-3 ${membersSidebarOpen ? "" : "hidden"}`}
              >
                  {membersError && <p className="mb-2 px-2 py-1 text-sm text-red-400">{membersError}</p>}
                  {associatedMembers
                    .filter((member) => member.is_active !== false)
                    .map((member) => {
                    const fullName = [member.first_name, member.last_name]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-2 rounded-xl px-2 py-2 transition ${
                          Number(highlightedMemberId) === Number(member.id)
                            ? "bg-orange-500/10 ring-1 ring-orange-500/50"
                            : "hover:bg-[#10191C]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenMemberProfile(member)}
                          aria-label={`Afficher le profil de ${fullName || member.username}`}
                          title="Afficher le profil"
                          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#152400] text-sm font-semibold text-[#B6FF00] focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getMemberInitials(member).charAt(0)
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHighlightedMemberId((current) => (
                            Number(current) === Number(member.id) ? null : member.id
                          ))}
                          aria-pressed={Number(highlightedMemberId) === Number(member.id)}
                          aria-label={`Surligner les tâches de ${fullName || member.username}`}
                          className="min-w-0 flex-1 truncate rounded-lg text-left text-sm font-medium text-[#F1F5F2] focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {fullName || member.username}
                        </button>
                        <label htmlFor={`project-member-role-${member.id}`} className="sr-only">Rôle de {fullName || member.username}</label>
                        <select
                          id={`project-member-role-${member.id}`}
                          value={member.role_id || ""}
                          onChange={(event) => handleUpdateMemberRole(member.id, event.target.value)}
                          disabled={updatingRoleMemberId === member.id}
                          className="max-w-28 shrink-0 rounded-lg border-0 bg-transparent py-1 pl-2 pr-6 text-right text-xs text-[#94A3A6] outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-60"
                        >
                          <option value="">Sans rôle</option>
                          {projectRoles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                        </select>
                      </div>
                    );
                  })}
                  {associatedMembers.filter((member) => member.is_active !== false).length === 0 && (
                    <p className="px-2 py-3 text-sm text-[#647276]">Aucun membre dans ce projet.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId("");
                      setMembersError("");
                      setShowMemberPicker(true);
                    }}
                    className="mt-2 inline-flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-[#94A3A6] transition hover:bg-[#10191C] hover:text-[#F1F5F2]"
                  >
                    <Plus size={16} /> Ajouter un membre
                  </button>
              </div>
          </aside>
        </div>

      )}

      {profileMember && (
        <div
          className={`project-member-backdrop fixed inset-0 z-[70] flex justify-end bg-black/55 backdrop-blur-[2px] ${
            isClosingMemberProfile ? "project-member-backdrop-closing" : ""
          }`}
          role="presentation"
          onClick={handleCloseMemberProfile}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Membre du projet"
            onClick={(event) => event.stopPropagation()}
            onAnimationEnd={(event) => {
              if (isClosingMemberProfile && event.animationName === "project-member-panel-exit") {
                setProfileMember(null);
              }
            }}
            className={`project-member-drawer h-full w-full max-w-md overflow-y-auto border-l border-[#1C292D] bg-[#0B1215] shadow-2xl ${
              isClosingMemberProfile ? "project-member-drawer-closing" : ""
            }`}
          >
            <div className="flex items-start justify-between border-b border-[#1C292D] px-6 py-5">
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.16em] text-orange-400">Membre du projet</p>
              </div>
              <button
                type="button"
                onClick={handleCloseMemberProfile}
                aria-label="Fermer le profil"
                className="rounded-lg p-2 text-[#647276] transition hover:bg-[#10191C] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center rounded-2xl border border-[#1C292D] bg-[#10191C] px-5 py-7 text-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-orange-400/50 bg-orange-500/10 text-2xl font-semibold text-orange-300">
                  {profileMember.avatar ? (
                    <img src={profileMember.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getMemberInitials(profileMember)
                  )}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#F1F5F2]">
                  {[profileMember.first_name, profileMember.last_name].filter(Boolean).join(" ") || profileMember.username}
                </h3>
                <p className="mt-1 text-sm text-[#94A3A6]">@{profileMember.username}</p>
                <span className="mt-3 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
                  {profileMember.role_label || "Sans rôle"}
                </span>
              </div>

              <dl className="mt-5 space-y-1">
                <div className="flex items-center gap-3 border-b border-[#1C292D] py-3">
                  <UserRound size={16} className="shrink-0 text-[#647276]" />
                  <div className="min-w-0">
                    <dt className="text-xs text-[#647276]">Prénom</dt>
                    <dd className="text-sm text-[#F1F5F2]">{profileMember.first_name || "Non renseigné"}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b border-[#1C292D] py-3">
                  <UserRound size={16} className="shrink-0 text-[#647276]" />
                  <div className="min-w-0">
                    <dt className="text-xs text-[#647276]">Nom</dt>
                    <dd className="text-sm text-[#F1F5F2]">{profileMember.last_name || "Non renseigné"}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b border-[#1C292D] py-3">
                  <Mail size={16} className="shrink-0 text-[#647276]" />
                  <div className="min-w-0">
                    <dt className="text-xs text-[#647276]">Adresse e-mail</dt>
                    <dd className="break-all text-sm text-[#F1F5F2]">{profileMember.email || "Non renseignée"}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b border-[#1C292D] py-3">
                  <Phone size={16} className="shrink-0 text-[#647276]" />
                  <div className="min-w-0">
                    <dt className="text-xs text-[#647276]">Téléphone</dt>
                    <dd className="text-sm text-[#F1F5F2]">{profileMember.phone || "Non renseigné"}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b border-[#1C292D] py-3">
                  <UserRound size={16} className="shrink-0 text-[#647276]" />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="project-member-profile-role" className="text-xs text-[#647276]">Rôle</label>
                    <select
                      id="project-member-profile-role"
                      value={profileMember.role_id || ""}
                      onChange={(event) => handleUpdateMemberRole(profileMember.id, event.target.value)}
                      disabled={updatingRoleMemberId === profileMember.id}
                      className="mt-1 w-full rounded-lg border border-[#1C292D] bg-[#10191C] px-3 py-2 text-sm text-[#F1F5F2] outline-none focus:border-orange-500 disabled:opacity-60"
                    >
                      <option value="">Sans rôle</option>
                      {projectRoles.map((role) => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {membersError && <p className="border-b border-[#1C292D] py-3 text-sm text-red-400">{membersError}</p>}
                <div className="flex items-center gap-3 border-b border-[#1C292D] py-3">
                  <UserRound size={16} className="shrink-0 text-[#647276]" />
                  <div className="min-w-0">
                    <dt className="text-xs text-[#647276]">Statut du compte</dt>
                    <dd className="text-sm text-[#F1F5F2]">
                      {profileMember.is_active === false
                        ? "Inactif"
                        : "Actif"}
                    </dd>
                  </div>
                </div>
              </dl>

            </div>
          </aside>
        </div>
      )}

      {showFeatureForm && selectedProject && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
          if (event.target === event.currentTarget && !creatingFeature) {
            setShowFeatureForm(false);
            setEditingFeature(null);
          }
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="admin-create-feature-title" className="w-full max-w-lg rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#1C292D] px-6 py-5">
              <div>
              <h2 id="admin-create-feature-title" className="font-semibold text-[#F1F5F2]">{editingFeature ? "Modifier la fonctionnalité" : "Créer une fonctionnalité"}</h2>
              <p className="mt-1 text-sm text-[#647276]">
                {editingFeature
                  ? `Modification de la fonctionnalité dans ${selectedProject.name}.`
                  : `Cette fonctionnalité sera ajoutée à ${selectedProject.name}.`}
              </p>
            </div>
            <button type="button" onClick={() => {
              setShowFeatureForm(false);
              setEditingFeature(null);
            }} disabled={creatingFeature} aria-label="Fermer" className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFeature} className="space-y-4 p-6">
              {featureError && <p className="text-sm text-red-400">{featureError}</p>}
              <div>
                <label htmlFor="admin-feature-title" className="mb-2 block text-sm font-medium text-[#F1F5F2]">Nom de la fonctionnalité</label>
                <input
                  id="admin-feature-title"
                  value={featureForm.title}
                  onChange={(event) => setFeatureForm((form) => ({ ...form, title: event.target.value }))}
                  placeholder="Ex. Gestion des utilisateurs"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-4">
                <button type="button" onClick={() => {
                  setShowFeatureForm(false);
                  setEditingFeature(null);
                }} disabled={creatingFeature} className="rounded-xl border border-[#1C292D] px-4 py-2.5 text-sm text-[#94A3A6] hover:bg-[#10191C] disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={creatingFeature || !featureForm.title.trim()} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-60">
                  {creatingFeature
                    ? (editingFeature ? "Enregistrement…" : "Création…")
                    : (editingFeature ? "Enregistrer" : "Créer la fonctionnalité")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showTaskForm && selectedProject && selectedFeature && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creatingTask) setShowTaskForm(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="admin-create-feature-task-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#1C292D] px-6 py-5">
              <div>
                <h2 id="admin-create-feature-task-title" className="font-semibold text-[#F1F5F2]">{editingFeatureTask ? "Modifier la tâche" : "Créer une tâche"}</h2>
                <p className="mt-1 text-sm text-[#647276]">Fonctionnalité : {selectedFeature.title}</p>
              </div>
              <button type="button" onClick={() => setShowTaskForm(false)} disabled={creatingTask} aria-label="Fermer" className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFeatureTask} className="space-y-4 p-6">
              {taskFormError && <p className="text-sm text-red-400">{taskFormError}</p>}
              <div>
                <label htmlFor="admin-feature-task-title" className="mb-2 block text-sm font-medium text-[#F1F5F2]">Titre</label>
                <input id="admin-feature-task-title" value={taskForm.title} onChange={(event) => setTaskForm((form) => ({ ...form, title: event.target.value }))} required autoFocus placeholder="Nom de la tâche" className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500" />
              </div>
              <div>
                <label htmlFor="admin-feature-task-description" className="mb-2 block text-sm font-medium text-[#F1F5F2]">Description</label>
                <textarea id="admin-feature-task-description" value={taskForm.description} onChange={(event) => setTaskForm((form) => ({ ...form, description: event.target.value }))} rows={3} placeholder="Détails de la tâche (facultatif)" className="w-full resize-y rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {editingFeatureTask && <div>
                  <label htmlFor="admin-feature-task-status" className="mb-2 block text-sm font-medium text-[#F1F5F2]">Statut</label>
                  <select id="admin-feature-task-status" value={taskForm.status} onChange={(event) => setTaskForm((form) => ({ ...form, status: event.target.value }))} className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500">
                    <option value="TODO">À faire</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="BLOCKED">Bloquée</option>
                    <option value="DONE">Terminée</option>
                  </select>
                </div>}
                <div>
                  <label htmlFor="admin-feature-task-priority" className="mb-2 block text-sm font-medium text-[#F1F5F2]">Priorité</label>
                  <select id="admin-feature-task-priority" value={taskForm.priority} onChange={(event) => setTaskForm((form) => ({ ...form, priority: event.target.value }))} required className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500">
                    <option value="LOW">Faible</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-feature-task-assignee" className="mb-2 block text-sm font-medium text-[#F1F5F2]">Assigner à</label>
                  <select id="admin-feature-task-assignee" value={taskForm.assigned_to} onChange={(event) => setTaskForm((form) => ({ ...form, assigned_to: event.target.value }))} required={!editingFeatureTask} className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500">
                    <option value="">{editingFeatureTask ? "Non assignée" : "Sélectionner un membre"}</option>
                    {associatedMembers.map((member) => <option key={member.id} value={member.id}>{[member.first_name, member.last_name].filter(Boolean).join(" ") || member.username}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="admin-feature-task-start-date" className="mb-2 block text-sm font-medium text-[#F1F5F2]">Date de début</label>
                  <input id="admin-feature-task-start-date" type="date" value={taskForm.start_date} onChange={(event) => setTaskForm((form) => ({ ...form, start_date: event.target.value }))} required={!editingFeatureTask} className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label htmlFor="admin-feature-task-end-date" className="mb-2 block text-sm font-medium text-[#F1F5F2]">Date de fin</label>
                  <input id="admin-feature-task-end-date" type="date" min={taskForm.start_date || undefined} value={taskForm.end_date} onChange={(event) => setTaskForm((form) => ({ ...form, end_date: event.target.value }))} required={!editingFeatureTask} className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-4">
                <button type="button" onClick={() => setShowTaskForm(false)} disabled={creatingTask} className="rounded-xl border border-[#1C292D] px-4 py-2.5 text-sm text-[#94A3A6] hover:bg-[#10191C] disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={creatingTask || !taskForm.title.trim()} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-60">
                  {creatingTask ? "Enregistrement…" : editingFeatureTask ? "Enregistrer" : "Créer la tâche"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showMemberPicker && selectedProject && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingMembers) setShowMemberPicker(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-add-project-member-title"
            className="w-full max-w-lg rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#1C292D] px-6 py-5">
              <div>
                <h2 id="admin-add-project-member-title" className="font-semibold text-[#F1F5F2]">Ajouter un membre</h2>
                <p className="mt-1 text-sm text-[#647276]">Choisissez une personne à ajouter à {selectedProject.name}.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMemberPicker(false)}
                disabled={savingMembers}
                aria-label="Fermer"
                className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <label htmlFor="admin-project-member-select" className="block text-sm font-medium text-[#F1F5F2]">
                Membres disponibles
              </label>
              <select
                id="admin-project-member-select"
                value={selectedMemberId}
                onChange={(event) => setSelectedMemberId(event.target.value)}
                disabled={users.filter((member) => member.is_active && !(selectedProject.members || []).map(Number).includes(Number(member.id))).length === 0}
                className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] p-3 text-sm text-[#F1F5F2] outline-none focus:border-orange-500 disabled:opacity-60"
              >
                <option value="">Choisir un membre</option>
                {users.filter((member) => member.is_active && !(selectedProject.members || []).map(Number).includes(Number(member.id))).map((member) => (
                  <option key={member.id} value={member.id}>
                    {[member.first_name, member.last_name].filter(Boolean).join(" ") || member.username} · {member.email}
                  </option>
                ))}
              </select>
              {users.filter((member) => member.is_active && !(selectedProject.members || []).map(Number).includes(Number(member.id))).length === 0 && (
                <p className="text-sm text-[#647276]">Tous les membres disponibles sont déjà dans ce projet.</p>
              )}
              {membersError && <p className="text-sm text-red-400">{membersError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberPicker(false)}
                  disabled={savingMembers}
                  className="rounded-xl border border-[#1C292D] px-4 py-2.5 text-sm font-medium text-[#94A3A6] hover:bg-[#10191C] disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveMembers}
                  disabled={savingMembers || !selectedMemberId}
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:opacity-60"
                >
                  {savingMembers ? "Enregistrement…" : "Ajouter au projet"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

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
                    : "Créez un nouveau projet sur la plateforme."}

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
                  placeholder="Ex : Application de gestion des tâches"
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


              {/* STATUS */}

              {editingProject ? (
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
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-medium text-[#F1F5F2]">
                    Statut initial
                  </p>
                  <p className="rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#94A3A6]">
                    Planifié — le projet passera en cours après sa création.
                  </p>
                </div>
              )}


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
                    users.length === 0
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
