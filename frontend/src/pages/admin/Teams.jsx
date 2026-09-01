import { useEffect, useState } from "react";

import {
  Plus,
  Users,
  X,
  Trash2,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

import api from "../../services/api";


const ROLES = [
  {
    value: "PROJECT_MANAGER",
    label: "Chef de projet",
  },
  {
    value: "DEVELOPER",
    label: "Développeur",
  },
  {
    value: "DESIGNER",
    label: "Designer",
  },
  {
    value: "TESTER",
    label: "Testeur",
  },
  {
    value: "MEMBER",
    label: "Membre",
  },
];


function Teams() {

  const [teams, setTeams] = useState([]);

  const [users, setUsers] = useState([]);

  const [selectedTeam, setSelectedTeam] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showMemberModal, setShowMemberModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");


  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
  });


  const [memberForm, setMemberForm] = useState({
    user: "",
    role: "MEMBER",
    is_active: true,
  });


  // ==========================================
  // CHARGER LES ÉQUIPES
  // ==========================================

  const fetchTeams = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get("/teams/");

      setTeams(response.data);

    } catch (error) {

      console.error(error);

      setError(
        "Impossible de récupérer les équipes."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // CHARGER LES UTILISATEURS
  // ==========================================

  const fetchUsers = async () => {

    try {

      const response =
        await api.get("/users/");

      setUsers(response.data);

    } catch (error) {

      console.error(error);

      setError(
        "Impossible de récupérer les utilisateurs."
      );

    }

  };


  useEffect(() => {

    fetchTeams();
    fetchUsers();

  }, []);


  // ==========================================
  // CRÉER UNE ÉQUIPE
  // ==========================================

  const handleCreateTeam = async (event) => {

    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {

      const response =
        await api.post(
          "/teams/",
          teamForm
        );


      setTeams((previous) => [

        response.data,

        ...previous,

      ]);


      setTeamForm({
        name: "",
        description: "",
      });


      setShowCreateModal(false);


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
          "Impossible de créer l'équipe."
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
  // SUPPRIMER UNE ÉQUIPE
  // ==========================================

  const handleDeleteTeam = async (team) => {

    const confirmed =
      window.confirm(
        `Voulez-vous supprimer l'équipe "${team.name}" ?`
      );


    if (!confirmed) {
      return;
    }


    try {

      await api.delete(
        `/teams/${team.id}/`
      );


      setTeams((previous) =>
        previous.filter(
          (item) =>
            item.id !== team.id
        )
      );


      if (
        selectedTeam?.id === team.id
      ) {

        setSelectedTeam(null);

      }


    } catch (error) {

      console.error(error);

      setError(
        "Impossible de supprimer cette équipe."
      );

    }

  };


  // ==========================================
  // AJOUTER UN MEMBRE
  // ==========================================

  const handleAddMember = async (event) => {

    event.preventDefault();

    if (!selectedTeam) {
      return;
    }

    setSaving(true);
    setFormError("");


    try {

      await api.post(
        "/teams/members/",
        {
          user: Number(
            memberForm.user
          ),

          team: selectedTeam.id,

          role: memberForm.role,

          is_active:
            memberForm.is_active,
        }
      );


      setMemberForm({
        user: "",
        role: "MEMBER",
        is_active: true,
      });


      setShowMemberModal(false);


      // Recharger les équipes
      await fetchTeams();


      // Récupérer l'équipe actualisée

      const response =
        await api.get(
          `/teams/${selectedTeam.id}/`
        );

      setSelectedTeam(
        response.data
      );


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
          "Impossible d'ajouter le membre."
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
  // MODIFIER LE RÔLE
  // ==========================================

  const handleRoleChange = async (
    member,
    role
  ) => {

    if (!selectedTeam) {
      return;
    }


    try {

      await api.patch(
        `/teams/members/${member.id}/`,
        {
          role,
        }
      );


      const response =
        await api.get(
          `/teams/${selectedTeam.id}/`
        );


      setSelectedTeam(
        response.data
      );


      setTeams((previous) =>
        previous.map((team) =>
          team.id === response.data.id
            ? response.data
            : team
        )
      );


    } catch (error) {

      console.error(error);

      setError(
        "Impossible de modifier le rôle."
      );

    }

  };


  // ==========================================
  // RETIRER UN MEMBRE
  // ==========================================

  const handleRemoveMember = async (
    member
  ) => {

    const confirmed =
      window.confirm(
        `Retirer ${member.username} de cette équipe ?`
      );


    if (!confirmed) {
      return;
    }


    try {

      await api.delete(
        `/teams/members/${member.id}/`
      );


      const response =
        await api.get(
          `/teams/${selectedTeam.id}/`
        );


      setSelectedTeam(
        response.data
      );


      setTeams((previous) =>
        previous.map((team) =>
          team.id === response.data.id
            ? response.data
            : team
        )
      );


    } catch (error) {

      console.error(error);

      setError(
        "Impossible de retirer ce membre."
      );

    }

  };


  // ==========================================
  // OUVRIR UNE ÉQUIPE
  // ==========================================

  const handleSelectTeam = async (
    team
  ) => {

    try {

      const response =
        await api.get(
          `/teams/${team.id}/`
        );

      setSelectedTeam(
        response.data
      );

    } catch (error) {

      console.error(error);

      setError(
        "Impossible de récupérer les détails de l'équipe."
      );

    }

  };


  // ==========================================
  // UTILISATEURS DISPONIBLES
  // ==========================================

  const availableUsers =
    selectedTeam
      ? users.filter(
          (user) =>
            !selectedTeam.members?.some(
              (member) =>
                member.user === user.id
            )
        )
      : [];


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="flex min-h-[400px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1C292D] border-t-[#B6FF00]" />

          <p className="mt-4 text-sm text-[#647276]">
            Chargement des équipes...
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
            Équipes
          </h1>

          <p className="mt-2 text-[#94A3A6]">
            Créez vos équipes et gérez leurs membres.
          </p>

        </div>


        <button
          onClick={() => {

            setFormError("");

            setShowCreateModal(true);

          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33]"
        >

          <Plus size={18} />

          Créer une équipe

        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

          {error}

        </div>

      )}


      {/* ======================================
          CONTENT
      ======================================= */}

      <div className="mt-8 grid gap-6 xl:grid-cols-[340px_1fr]">


        {/* ====================================
            TEAM LIST
        ===================================== */}

        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215]">

          <div className="border-b border-[#1C292D] px-5 py-4">

            <h2 className="font-semibold text-[#F1F5F2]">
              Mes équipes
            </h2>

            <p className="mt-1 text-xs text-[#647276]">
              {teams.length} équipe(s)
            </p>

          </div>


          <div className="p-3">

            {teams.length === 0 ? (

              <div className="px-4 py-10 text-center">

                <Users
                  size={28}
                  className="mx-auto text-[#47565A]"
                />

                <p className="mt-4 text-sm font-medium text-[#F1F5F2]">
                  Aucune équipe
                </p>

                <p className="mt-1 text-xs text-[#647276]">
                  Créez votre première équipe.
                </p>

              </div>

            ) : (

              <div className="space-y-2">

                {teams.map((team) => (

                  <button
                    key={team.id}
                    onClick={() =>
                      handleSelectTeam(team)
                    }
                    className={`w-full rounded-xl p-4 text-left transition ${
                      selectedTeam?.id === team.id
                        ? "bg-[#152400] ring-1 ring-[#304800]"
                        : "hover:bg-[#10191C]"
                    }`}
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="font-medium text-[#F1F5F2]">
                          {team.name}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs text-[#647276]">
                          {team.description ||
                            "Aucune description"}
                        </p>

                      </div>


                      <span className="shrink-0 rounded-lg bg-[#10191C] px-2 py-1 text-xs text-[#94A3A6]">

                        {team.members?.length || 0}

                      </span>

                    </div>

                  </button>

                ))}

              </div>

            )}

          </div>

        </div>


        {/* ====================================
            TEAM DETAILS
        ===================================== */}

        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215]">


          {!selectedTeam ? (

            <div className="flex min-h-[450px] items-center justify-center px-6 text-center">

              <div>

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">

                  <Users
                    size={25}
                    className="text-[#B6FF00]"
                  />

                </div>

                <h2 className="mt-5 font-semibold text-[#F1F5F2]">
                  Sélectionnez une équipe
                </h2>

                <p className="mt-2 text-sm text-[#647276]">
                  Sélectionnez une équipe pour gérer ses membres.
                </p>

              </div>

            </div>

          ) : (

            <>

              {/* TEAM HEADER */}

              <div className="flex flex-col gap-4 border-b border-[#1C292D] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#152400]">

                      <Users
                        size={20}
                        className="text-[#B6FF00]"
                      />

                    </div>

                    <div>

                      <h2 className="font-semibold text-[#F1F5F2]">
                        {selectedTeam.name}
                      </h2>

                      <p className="text-xs text-[#647276]">
                        {selectedTeam.members?.length || 0} membre(s)
                      </p>

                    </div>

                  </div>

                </div>


                <div className="flex gap-2">

                  <button
                    onClick={() => {

                      setFormError("");

                      setShowMemberModal(true);

                    }}
                    className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#C4FF33]"
                  >

                    <UserPlus size={17} />

                    Ajouter un membre

                  </button>


                  <button
                    onClick={() =>
                      handleDeleteTeam(
                        selectedTeam
                      )
                    }
                    className="rounded-xl border border-red-900/50 px-3 py-2.5 text-red-400 hover:bg-red-950/30"
                    title="Supprimer l'équipe"
                  >

                    <Trash2 size={17} />

                  </button>

                </div>

              </div>


              {/* MEMBERS */}

              <div className="p-6">

                {selectedTeam.members?.length === 0 ? (

                  <div className="rounded-xl border border-dashed border-[#1C292D] px-6 py-12 text-center">

                    <UserRound
                      size={28}
                      className="mx-auto text-[#47565A]"
                    />

                    <p className="mt-4 font-medium text-[#F1F5F2]">
                      Aucun membre
                    </p>

                    <p className="mt-1 text-sm text-[#647276]">
                      Ajoutez des utilisateurs à cette équipe.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {selectedTeam.members.map(
                      (member) => (

                        <div
                          key={member.id}
                          className="flex flex-col gap-4 rounded-xl border border-[#1C292D] bg-[#10191C] p-4 lg:flex-row lg:items-center lg:justify-between"
                        >


                          {/* USER */}

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#152400] font-semibold text-[#B6FF00]">

                              {member.username
                                ?.charAt(0)
                                .toUpperCase()}

                            </div>


                            <div>

                              <p className="font-medium text-[#F1F5F2]">

                                {member.first_name ||
                                member.last_name
                                  ? `${member.first_name || ""} ${member.last_name || ""}`
                                  : member.username}

                              </p>

                              <p className="text-xs text-[#647276]">

                                @{member.username}

                                {member.job_title &&
                                  ` • ${member.job_title}`}

                              </p>

                            </div>

                          </div>


                          {/* ROLE */}

                          <div className="flex items-center gap-3">

                            <ShieldCheck
                              size={17}
                              className="text-[#B6FF00]"
                            />

                            <select
                              value={member.role}
                              onChange={(event) =>
                                handleRoleChange(
                                  member,
                                  event.target.value
                                )
                              }
                              className="rounded-lg border border-[#1C292D] bg-[#0B1215] px-3 py-2 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                            >

                              {ROLES.map(
                                (role) => (

                                  <option
                                    key={role.value}
                                    value={role.value}
                                  >
                                    {role.label}
                                  </option>

                                )
                              )}

                            </select>


                            <button
                              onClick={() =>
                                handleRemoveMember(
                                  member
                                )
                              }
                              className="rounded-lg p-2 text-[#647276] hover:bg-red-950/30 hover:text-red-400"
                              title="Retirer"
                            >

                              <Trash2 size={17} />

                            </button>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </>

          )}

        </div>

      </div>


      {/* ======================================
          CREATE TEAM MODAL
      ======================================= */}

      {showCreateModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">


            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">

              <div>

                <h2 className="font-semibold text-[#F1F5F2]">
                  Créer une équipe
                </h2>

                <p className="mt-1 text-sm text-[#647276]">
                  Créez une nouvelle équipe de travail.
                </p>

              </div>


              <button
                onClick={() =>
                  setShowCreateModal(false)
                }
                className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white"
              >

                <X size={20} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleCreateTeam}
              className="space-y-5 p-6"
            >

              {formError && (

                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {formError}
                </div>

              )}


              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Nom de l'équipe
                </label>

                <input
                  value={teamForm.name}
                  onChange={(event) =>
                    setTeamForm({
                      ...teamForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="Ex : Équipe Frontend"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#47565A] focus:border-[#B6FF00]"
                />

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Description
                </label>

                <textarea
                  value={teamForm.description}
                  onChange={(event) =>
                    setTeamForm({
                      ...teamForm,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Description de l'équipe..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#47565A] focus:border-[#B6FF00]"
                />

              </div>


              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  className="rounded-xl border border-[#1C292D] px-4 py-3 text-sm font-medium text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
                >
                  Annuler
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black hover:bg-[#C4FF33] disabled:opacity-60"
                >

                  {saving
                    ? "Création..."
                    : "Créer l'équipe"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================
          ADD MEMBER MODAL
      ======================================= */}

      {showMemberModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">


            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">

              <div>

                <h2 className="font-semibold text-[#F1F5F2]">
                  Ajouter un membre
                </h2>

                <p className="mt-1 text-sm text-[#647276]">
                  Équipe : {selectedTeam?.name}
                </p>

              </div>


              <button
                onClick={() =>
                  setShowMemberModal(false)
                }
                className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white"
              >

                <X size={20} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleAddMember}
              className="space-y-5 p-6"
            >

              {formError && (

                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {formError}
                </div>

              )}


              {/* USER */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Utilisateur
                </label>

                <select
                  value={memberForm.user}
                  onChange={(event) =>
                    setMemberForm({
                      ...memberForm,
                      user: event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                >

                  <option value="">
                    Sélectionner un utilisateur
                  </option>

                  {availableUsers.map(
                    (user) => (

                      <option
                        key={user.id}
                        value={user.id}
                      >

                        {user.first_name ||
                        user.last_name
                          ? `${user.first_name || ""} ${user.last_name || ""}`
                          : user.username}

                        {" "}
                        (@{user.username})

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* ROLE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Rôle
                </label>

                <select
                  value={memberForm.role}
                  onChange={(event) =>
                    setMemberForm({
                      ...memberForm,
                      role: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                >

                  {ROLES.map(
                    (role) => (

                      <option
                        key={role.value}
                        value={role.value}
                      >
                        {role.label}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowMemberModal(false)
                  }
                  className="rounded-xl border border-[#1C292D] px-4 py-3 text-sm font-medium text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
                >
                  Annuler
                </button>


                <button
                  type="submit"
                  disabled={
                    saving ||
                    !memberForm.user
                  }
                  className="rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving
                    ? "Ajout..."
                    : "Ajouter le membre"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default Teams;