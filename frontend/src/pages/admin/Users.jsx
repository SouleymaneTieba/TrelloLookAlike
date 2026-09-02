import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import api from "../../services/api";


function Users() {

  const [users, setUsers] =
    useState([]);

  const [roles, setRoles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");


  const [form, setForm] = useState({

    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
    phone: "",
    job_title: "",

  });


  // ==========================================
  // CHARGER LES UTILISATEURS
  // ==========================================

  const fetchUsers = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get("/users/");

      setUsers(response.data);

    } catch (error) {

      console.error(error);

      setError(
        "Impossible de récupérer les utilisateurs."
      );

    } finally {

      setLoading(false);

    }

  };


  const fetchRoles = async () => {

    try {

      const response =
        await api.get("/teams/roles/");

      setRoles(response.data);

    } catch (error) {

      console.error(error);

      setRoles([]);

    }

  };


  useEffect(() => {

    fetchUsers();
    fetchRoles();

  }, []);


  // ==========================================
  // RECHERCHE
  // ==========================================

  const filteredUsers = useMemo(() => {

    const value =
      search.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter((user) => {

      return (

        user.username
          ?.toLowerCase()
          .includes(value)

        ||

        user.email
          ?.toLowerCase()
          .includes(value)

        ||

        user.first_name
          ?.toLowerCase()
          .includes(value)

        ||

        user.last_name
          ?.toLowerCase()
          .includes(value)

      );

    });

  }, [users, search]);


  // ==========================================
  // FORMULAIRE
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
  // CRÉER UTILISATEUR
  // ==========================================

  const handleCreateUser = async (event) => {

    event.preventDefault();

    setFormError("");
    setSaving(true);


    try {

      const response =
        await api.post(
          "/users/",
          form
        );


      setUsers((previous) => [

        response.data,

        ...previous,

      ]);


      setForm({

        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        password_confirm: "",
        phone: "",
        job_title: "",

      });


      setShowModal(false);


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
          "Impossible de créer l'utilisateur."
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
  // SUPPRIMER UTILISATEUR
  // ==========================================

  const handleDelete = async (user) => {

    const confirmed =
      window.confirm(
        `Voulez-vous supprimer l'utilisateur "${user.username}" ?`
      );


    if (!confirmed) {
      return;
    }


    try {

      await api.delete(
        `/users/${user.id}/`
      );


      setUsers((previous) =>
        previous.filter(
          (item) =>
            item.id !== user.id
        )
      );


    } catch (error) {

      console.error(error);

      setError(
        "Impossible de supprimer cet utilisateur."
      );

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

            Chargement des utilisateurs...

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
            Utilisateurs
          </h1>

          <p className="mt-2 text-[#94A3A6]">
            Gérez les comptes des utilisateurs de Trell .
          </p>

        </div>


        <button
          onClick={() => {
            setFormError("");
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33]"
        >

          <Plus size={18} />

          Ajouter un utilisateur

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
          SEARCH
      ======================================= */}

      <div className="mt-8">

        <div className="relative max-w-md">

          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647276]"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher un utilisateur..."
            className="w-full rounded-xl border border-[#1C292D] bg-[#0B1215] py-3 pl-11 pr-4 text-sm text-[#F1F5F2] outline-none placeholder:text-[#47565A] focus:border-[#B6FF00]"
          />

        </div>

      </div>


      {/* ======================================
          TABLE
      ======================================= */}

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#1C292D] bg-[#0B1215]">

        {filteredUsers.length === 0 ? (

          <div className="px-6 py-16 text-center">

            <UserRound
              size={30}
              className="mx-auto text-[#47565A]"
            />

            <p className="mt-4 font-medium text-[#F1F5F2]">
              Aucun utilisateur trouvé
            </p>

            <p className="mt-1 text-sm text-[#647276]">
              Aucun utilisateur ne correspond à votre recherche.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px]">

              <thead>

                <tr className="border-b border-[#1C292D] text-left">

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Utilisateur
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Email
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Poste
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Statut
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredUsers.map((user) => (

                  <tr
                    key={user.id}
                    className="border-b border-[#1C292D] last:border-b-0 hover:bg-[#10191C]"
                  >


                    {/* USER */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#152400] font-semibold text-[#B6FF00]">

                          {user.username
                            ?.charAt(0)
                            .toUpperCase()}

                        </div>

                        <div>

                          <p className="font-medium text-[#F1F5F2]">
                            {user.first_name ||
                              user.last_name
                              ? `${user.first_name || ""} ${user.last_name || ""}`
                              : user.username}
                          </p>

                          <p className="text-xs text-[#647276]">
                            @{user.username}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* EMAIL */}

                    <td className="px-6 py-4 text-sm text-[#94A3A6]">

                      {user.email || "—"}

                    </td>


                    {/* POSTE */}

                    <td className="px-6 py-4 text-sm text-[#94A3A6]">

                      {user.job_title || "—"}

                    </td>


                    {/* STATUS */}

                    <td className="px-6 py-4">

                      <span className="inline-flex items-center gap-2 rounded-full border border-[#304800] bg-[#152400] px-3 py-1 text-xs font-medium text-[#B6FF00]">

                        <span className="h-1.5 w-1.5 rounded-full bg-[#B6FF00]" />

                        Actif

                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td className="px-6 py-4 text-right">

                      {!user.is_superuser && (

                        <button
                          onClick={() =>
                            handleDelete(user)
                          }
                          className="rounded-lg p-2 text-[#647276] transition hover:bg-red-950/40 hover:text-red-400"
                          title="Supprimer"
                        >

                          <Trash2 size={17} />

                        </button>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================
          MODAL CREATE USER
      ======================================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">


            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-[#F1F5F2]">
                  Ajouter un utilisateur
                </h2>

                <p className="mt-1 text-sm text-[#647276]">
                  Créez un nouveau compte Trell .
                </p>

              </div>


              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white"
              >

                <X size={20} />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleCreateUser}
              className="space-y-5 p-6"
            >


              {formError && (

                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

                  {formError}

                </div>

              )}


              {/* USERNAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Nom d'utilisateur
                </label>

                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                />

              </div>


              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Email
                </label>

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                />

              </div>


              {/* NAME */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Prénom
                  </label>

                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Nom
                  </label>

                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  />

                </div>

              </div>


              {/* PHONE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Téléphone
                </label>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                />

              </div>


              {/* JOB */}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Poste
                </label>

                {roles.length > 0 ? (
                  <select
                    name="job_title"
                    value={form.job_title}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  >
                    <option value="">
                      Sélectionner un poste
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.label}
                      >
                        {role.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#647276]">
                    Aucun rôle existant. Créez-en d’abord dans la section rôles.
                  </div>
                )}

              </div>


              {/* PASSWORD */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Mot de passe
                  </label>

                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                    Confirmation
                  </label>

                  <input
                    name="password_confirm"
                    type="password"
                    value={form.password_confirm}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none focus:border-[#B6FF00]"
                  />

                </div>

              </div>


              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-xl border border-[#1C292D] px-4 py-3 text-sm font-medium text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
                >
                  Annuler
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving
                    ? "Création..."
                    : "Créer l'utilisateur"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default Users;