import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Smile,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import api, { getWebSocketUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "👏", "🎉"];


function Chat() {

  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [error, setError] = useState("");
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const [reactingKey, setReactingKey] = useState("");

  const [connected, setConnected] = useState(false);
  const [projectSidebarWidth, setProjectSidebarWidth] = useState(288);
  const [memberSidebarWidth, setMemberSidebarWidth] = useState(240);
  const [projectSidebarCollapsed, setProjectSidebarCollapsed] = useState(false);
  const [memberSidebarCollapsed, setMemberSidebarCollapsed] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatLayoutRef = useRef(null);

  const resizeSidebar = (event, side) => {
    if (event.buttons !== 1 || !chatLayoutRef.current) {
      return;
    }

    const bounds = chatLayoutRef.current.getBoundingClientRect();

    if (side === "left") {
      setProjectSidebarWidth(Math.min(420, Math.max(220, event.clientX - bounds.left)));
    } else {
      setMemberSidebarWidth(Math.min(420, Math.max(220, bounds.right - event.clientX)));
    }
  };


  // ==================================================
  // CHARGER LES PROJETS
  // ==================================================

  useEffect(() => {

    let isMounted = true;

    const fetchProjects = async (showLoading = false) => {

      try {

        if (showLoading) {
          setLoadingProjects(true);
          setError("");
        }

        const response = await api.get(
          "/projects/"
        );

        if (!isMounted) {
          return;
        }

        const nextProjects = response.data.map((project) => ({
          ...project,
          members: project.member_details || [],
        }));
        setProjects(nextProjects);

        setSelectedProject((currentProject) =>
          nextProjects.find((project) => project.id === currentProject?.id) || nextProjects[0] || null
        );

      } catch (error) {

        console.error(error);

        if (isMounted && showLoading) {
          setError("Impossible de récupérer vos projets.");
        }

      } finally {

        if (isMounted && showLoading) {
          setLoadingProjects(false);
        }

      }

    };

    fetchProjects(true);
    const refreshInterval = setInterval(() => fetchProjects(), 5000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };

  }, []);


  // ==================================================
  // CHARGER L'HISTORIQUE DU PROJET
  // ==================================================

  useEffect(() => {

    if (!selectedProject) {
      return;
    }

    const fetchMessages = async () => {

      try {

        setLoadingMessages(true);
        setError("");

        const response = await api.get(
          "/chat/messages/",
          {
            params: {
              project: selectedProject.id,
            },
          }
        );

        setMessages(response.data);

      } catch (error) {

        console.error(error);

        setError(
          "Impossible de récupérer les messages."
        );

      } finally {

        setLoadingMessages(false);

      }

    };

    fetchMessages();

  }, [selectedProject?.id]);


  // ==================================================
  // WEBSOCKET
  // ==================================================

  useEffect(() => {

    if (!selectedProject) {
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      return;
    }

    // Fermer une éventuelle ancienne connexion

    if (socketRef.current) {

      socketRef.current.close();

      socketRef.current = null;

    }

    const socket = new WebSocket(
      getWebSocketUrl(`/ws/projects/${selectedProject.id}/chat/?token=${encodeURIComponent(token)}`)
    );

    socketRef.current = socket;


    socket.onopen = () => {

      console.log(
        "WebSocket connecté."
      );

      setConnected(true);

    };


    socket.onmessage = (event) => {

      try {

        const newMessage =
          JSON.parse(event.data);

        if (newMessage.type === "reaction") {
          setMessages((currentMessages) => currentMessages.map((item) => (
            item.id === newMessage.message_id
              ? {
                  ...item,
                  reactions: newMessage.reactions.map((reaction) => ({
                    ...reaction,
                    reacted_by_me: newMessage.reacted_user_id === user?.id
                      ? reaction.reacted_by_me
                      : Boolean(item.reactions?.find((current) => current.emoji === reaction.emoji)?.reacted_by_me),
                  })),
                }
              : item
          )));
          return;
        }

        setMessages(
          (currentMessages) => {

            // Éviter les doublons

            const alreadyExists =
              currentMessages.some(
                (item) =>
                  item.id ===
                  newMessage.id
              );

            if (alreadyExists) {

              return currentMessages;

            }

            return [
              ...currentMessages,
              newMessage,
            ];

          }
        );

      } catch (error) {

        console.error(
          "Message WebSocket invalide :",
          error
        );

      }

    };


    socket.onclose = (event) => {

      console.log(
        "WebSocket fermé.",
        event.code
      );

      setConnected(false);

    };


    socket.onerror = (error) => {

      console.error(
        "Erreur WebSocket :",
        error
      );

      setConnected(false);

    };


    // Nettoyage

    return () => {

      socket.close();

      socketRef.current = null;

      setConnected(false);

    };

  }, [selectedProject?.id]);


  // ==================================================
  // SCROLL AUTOMATIQUE
  // ==================================================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);


  // ==================================================
  // ENVOYER MESSAGE
  // ==================================================

  const handleSubmit = (event) => {

    event.preventDefault();

    const content =
      message.trim();

    if (!content) {
      return;
    }

    if (
      !socketRef.current ||
      socketRef.current.readyState !==
        WebSocket.OPEN
    ) {

      setError(
        "La connexion au chat n'est pas disponible."
      );

      return;

    }

    socketRef.current.send(
      JSON.stringify({
        content,
      })
    );

    setMessage("");

  };


  const handleReaction = async (messageItem, emoji) => {
    const key = `${messageItem.id}:${emoji}`;
    setReactingKey(key);
    setError("");

    try {
      const response = await api.post(
        `/chat/messages/${messageItem.id}/react/`,
        { emoji }
      );

      setMessages((currentMessages) => currentMessages.map((item) => (
        item.id === messageItem.id
          ? { ...item, reactions: response.data.reactions }
          : item
      )));
      setReactionPickerMessageId(null);
    } catch (requestError) {
      console.error(requestError);
      setError("Impossible d'ajouter cette réaction.");
    } finally {
      setReactingKey("");
    }
  };


  // ==================================================
  // CHANGEMENT DE PROJET
  // ==================================================

  const handleProjectChange = (project) => {

    setMessages([]);

    setSelectedProject(project);

  };


  // ==================================================
  // LOADING
  // ==================================================

  if (loadingProjects) {

    return (

      <div className="flex min-h-[60vh] items-center justify-center">

        <p className="text-[#647276]">
          Chargement du chat...
        </p>

      </div>

    );

  }


  return (

    <div ref={chatLayoutRef} className="-m-8 flex h-[calc(100vh-5rem)] min-h-[600px] overflow-hidden border border-[#1C292D] bg-[#0E171A]">


      {/* ==================================================
          SIDEBAR PROJETS
      ================================================== */}

      <aside
        style={{ width: projectSidebarCollapsed ? 68 : projectSidebarWidth }}
        className={`flex shrink-0 flex-col border-r border-[#1C292D] transition-[width] ${projectSidebarCollapsed ? "items-center" : ""}`}
      >


        {/* Header */}

        <div className={`flex h-[68px] shrink-0 items-center border-b border-[#1C292D] ${projectSidebarCollapsed ? "justify-center px-2" : "justify-between p-5"}`}>

          <div className="flex items-center gap-3">

            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[#152400] ${projectSidebarCollapsed ? "hidden" : ""}`}>

              <MessageCircle
                size={20}
                className="text-[#B6FF00]"
              />

            </div>

            {!projectSidebarCollapsed && <div>

              <h1 className="font-semibold text-[#F1F5F2]">
                Chat
              </h1>

              <p className="text-xs text-[#647276]">
                Discussions de projet
              </p>

            </div>}

          </div>

          <button
            type="button"
            onClick={() => setProjectSidebarCollapsed((collapsed) => !collapsed)}
            title={projectSidebarCollapsed ? "Développer les projets" : "Réduire la liste des projets"}
            aria-label={projectSidebarCollapsed ? "Développer les projets" : "Réduire la liste des projets"}
            className="rounded-lg p-1.5 text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
          >
            {projectSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>

        </div>


        {/* Projets */}

        <div className={`flex-1 overflow-y-auto p-3 ${projectSidebarCollapsed ? "hidden" : ""}`}>

          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#47565A]">
            Mes projets
          </p>


          {projects.length === 0 ? (

            <div className="rounded-xl bg-[#10191C] p-4 text-center">

              <Users
                size={24}
                className="mx-auto text-[#47565A]"
              />

              <p className="mt-2 text-sm text-[#647276]">
                Aucun projet
              </p>

            </div>

          ) : (

            <div className="space-y-1">

              {projects.map((project) => {

                const isSelected =
                  selectedProject?.id ===
                  project.id;


                return (

                  <button
                    key={project.id}
                    type="button"
                    onClick={() =>
                      handleProjectChange(
                        project
                      )
                    }
                    className={`w-full rounded-xl px-3 py-3 text-left transition ${
                      isSelected
                        ? "bg-[#152400] text-[#B6FF00]"
                        : "text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-[#B6FF00]/10"
                            : "bg-[#10191C]"
                        }`}
                      >

                        <Users
                          size={17}
                        />

                      </div>


                      <div className="min-w-0">

                        <p className="truncate text-sm font-medium">

                          {project.name}

                        </p>


                        <p className="mt-0.5 text-xs opacity-60">

                          {project.members?.filter((member) => member.is_active).length ||
                            0}{" "}
                          membre(s)

                        </p>

                      </div>

                    </div>

                  </button>

                );

              })}

            </div>

          )}

        </div>

      </aside>

      {!projectSidebarCollapsed && (
        <div
          role="separator"
          aria-label="Redimensionner la liste des projets"
          aria-orientation="vertical"
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={(event) => resizeSidebar(event, "left")}
          className="z-10 -mx-1 w-2 shrink-0 cursor-col-resize touch-none hover:bg-[#B6FF00]/30"
        />
      )}


      {/* ==================================================
          CHAT AREA
      ================================================== */}

      <section className="flex min-w-0 flex-1 flex-col">


        {/* Header */}

        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#1C292D] px-6">

          <div>

            <h2 className="font-semibold text-[#F1F5F2]">

              {selectedProject?.name ||
                "Chat"}

            </h2>

            <p className="mt-0.5 text-xs text-[#647276]">

              {selectedProject
                ? `${selectedProject.members?.filter((member) => member.is_active).length || 0} membre(s)`
                : "Sélectionnez un projet"}

            </p>

          </div>


          {/* Connection */}

          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
              connected
                ? "bg-[#152400] text-[#B6FF00]"
                : "bg-[#10191C] text-[#647276]"
            }`}
          >

            {connected ? (

              <>
                <Wifi size={14} />
                Connecté
              </>

            ) : (

              <>
                <WifiOff size={14} />
                Déconnecté
              </>

            )}

          </div>

        </header>


        {/* Error */}

        {error && (

          <div className="mx-6 mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

            {error}

          </div>

        )}


        {/* Messages */}

        <div className="flex-1 overflow-y-auto p-6">


          {!selectedProject ? (

            <div className="flex h-full items-center justify-center">

              <div className="text-center">

                <MessageCircle
                  size={40}
                  className="mx-auto text-[#47565A]"
                />

                <p className="mt-3 text-[#647276]">
                  Sélectionnez un projet
                </p>

              </div>

            </div>

          ) : loadingMessages ? (

            <div className="flex h-full items-center justify-center">

              <p className="text-sm text-[#647276]">
                Chargement des messages...
              </p>

            </div>

          ) : messages.length === 0 ? (

            <div className="flex h-full items-center justify-center">

              <div className="text-center">

                <MessageCircle
                  size={40}
                  className="mx-auto text-[#47565A]"
                />

                <p className="mt-3 font-medium text-[#94A3A6]">
                  Aucun message
                </p>

                <p className="mt-1 text-sm text-[#647276]">
                  Soyez le premier à envoyer un message.
                </p>

              </div>

            </div>

          ) : (

            <div className="space-y-5">

              {messages.map((item) => {

                const isMine =
                  item.user === user?.id;


                return (

                  <div
                    key={item.id}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`flex max-w-[75%] gap-3 ${
                        isMine
                          ? "flex-row-reverse"
                          : ""
                      }`}
                    >

                      {/* Avatar */}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#152400] text-sm font-semibold text-[#B6FF00]">

                        {item.avatar ? (

                          <img
                            src={item.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />

                        ) : (

                          item.username
                            ?.charAt(0)
                            .toUpperCase()

                        )}

                      </div>


                      {/* Message */}

                      <div>

                        <div
                          className={`mb-1 flex items-center gap-2 ${
                            isMine
                              ? "justify-end"
                              : ""
                          }`}
                        >

                          <span className="text-xs font-medium text-[#94A3A6]">

                            {isMine
                              ? "Vous"
                              : item.username}

                          </span>

                          <span className="text-[10px] text-[#47565A]">

                            {new Date(
                              item.created_at
                            ).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}

                          </span>

                        </div>


                        <div
                          className={`rounded-2xl px-4 py-3 text-sm ${
                            isMine
                              ? "rounded-tr-sm bg-[#B6FF00] text-black"
                              : "rounded-tl-sm bg-[#10191C] text-[#F1F5F2]"
                          }`}
                        >

                          {item.content}

                        </div>

                        <div className={`mt-2 flex flex-wrap items-center gap-1 ${isMine ? "justify-end" : ""}`}>
                          {(item.reactions || []).map((reaction) => (
                            <button
                              key={reaction.emoji}
                              type="button"
                              onClick={() => handleReaction(item, reaction.emoji)}
                              disabled={reactingKey === `${item.id}:${reaction.emoji}`}
                              aria-label={`${reaction.emoji}, ${reaction.count} réaction(s)`}
                              aria-pressed={reaction.reacted_by_me}
                              className={`chat-reaction rounded-full border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
                                reaction.reacted_by_me
                                  ? "border-orange-400 bg-orange-100 text-orange-900"
                                  : "border-[#EADFD7] bg-white text-[#5C554F] hover:bg-[#FFF3EB]"
                              }`}
                            >
                              {reaction.emoji} {reaction.count}
                            </button>
                          ))}

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setReactionPickerMessageId((currentId) => (
                                currentId === item.id ? null : item.id
                              ))}
                              aria-label="Ajouter une réaction"
                              aria-expanded={reactionPickerMessageId === item.id}
                              className="chat-reaction-trigger rounded-full border border-[#EADFD7] bg-white p-1.5 text-[#766E67] transition-colors hover:bg-[#FFF3EB]"
                            >
                              <Smile size={15} />
                            </button>

                            {reactionPickerMessageId === item.id && (
                              <div className={`chat-reaction-picker absolute top-full z-10 mt-1 flex gap-1 rounded-xl border border-[#EADFD7] bg-white p-1.5 shadow-lg ${isMine ? "right-0" : "left-0"}`}>
                                {REACTION_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleReaction(item, emoji)}
                                    disabled={reactingKey === `${item.id}:${emoji}`}
                                    aria-label={`Réagir avec ${emoji}`}
                                    className="chat-reaction-option rounded-lg p-1 text-lg transition-colors hover:bg-[#FFF3EB] disabled:opacity-50"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>

                );

              })}


              <div
                ref={messagesEndRef}
              />

            </div>

          )}

        </div>


        {/* Input */}

        {selectedProject && (

          <form
            onSubmit={handleSubmit}
            className="border-t border-[#1C292D] p-4"
          >

            <div className="flex items-center gap-3">

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder="Écrire un message..."
                disabled={!connected}
                className="flex-1 rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/20 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={
                  !connected ||
                  !message.trim()
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#B6FF00] text-black transition hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-40"
                title="Envoyer"
              >

                <Send size={18} />

              </button>

            </div>

          </form>

        )}

      </section>

      {!memberSidebarCollapsed && (
        <div
          role="separator"
          aria-label="Redimensionner la liste des membres"
          aria-orientation="vertical"
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={(event) => resizeSidebar(event, "right")}
          className="z-10 -mx-1 w-2 shrink-0 cursor-col-resize touch-none hover:bg-[#B6FF00]/30"
        />
      )}

      <aside
        style={{ width: memberSidebarCollapsed ? 68 : memberSidebarWidth }}
        className={`flex shrink-0 flex-col border-l border-[#1C292D] bg-[#0B1215] transition-[width] ${memberSidebarCollapsed ? "items-center" : ""}`}
      >
        <div className={`flex h-[68px] shrink-0 items-center border-b border-[#1C292D] ${memberSidebarCollapsed ? "justify-center px-2" : "justify-between p-5"}`}>
          {!memberSidebarCollapsed && <div>
            <h3 className="font-semibold text-[#F1F5F2]">Membres</h3>
            <p className="mt-1 text-xs text-[#647276]">
            {selectedProject?.members?.filter((member) => member.is_active && member.is_online).length || 0} en ligne · {selectedProject?.members?.filter((member) => member.is_active).length || 0} membre(s)
            </p>
          </div>}
          <button
            type="button"
            onClick={() => setMemberSidebarCollapsed((collapsed) => !collapsed)}
            title={memberSidebarCollapsed ? "Développer les membres" : "Réduire les membres"}
            aria-label={memberSidebarCollapsed ? "Développer les membres" : "Réduire les membres"}
            className="rounded-lg p-1.5 text-[#94A3A6] transition hover:bg-[#10191C] hover:text-white"
          >
            {memberSidebarCollapsed ? <PanelRightOpen size={17} /> : <PanelRightClose size={17} />}
          </button>
        </div>

        <div className={`flex-1 space-y-1 overflow-y-auto p-3 ${memberSidebarCollapsed ? "hidden" : ""}`}>
          {(selectedProject?.members || [])
            .filter((member) => member.is_active)
            .sort((first, second) => Number(second.is_online) - Number(first.is_online))
            .map((member) => {
              const displayName = [member.first_name, member.last_name].filter(Boolean).join(" ") || member.username;

              return (
                <div key={member.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#152400] text-sm font-semibold text-[#B6FF00]">
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      member.username?.charAt(0).toUpperCase()
                    )}
                    <span
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${member.is_online ? "bg-[#22C55E]" : "bg-[#47565A]"}`}
                      aria-label={member.is_online ? "En ligne" : "Déconnecté"}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#F1F5F2]">{displayName}</p>
                    <p className={`text-xs ${member.is_online ? "text-[#4ADE80]" : "text-[#647276]"}`}>
                      {member.is_online ? "En ligne" : "Déconnecté"}
                    </p>
                  </div>
                </div>
              );
            })}

          {!selectedProject?.members?.some((member) => member.is_active) && (
            <p className="px-2 py-3 text-sm text-[#647276]">Aucun membre dans ce groupe.</p>
          )}
        </div>
      </aside>

    </div>

  );

}


export default Chat;
