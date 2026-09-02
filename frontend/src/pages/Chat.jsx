import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";


function Chat() {

  const { user } = useAuth();

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [error, setError] = useState("");

  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);


  // ==================================================
  // CHARGER LES ÉQUIPES
  // ==================================================

  useEffect(() => {

    const fetchTeams = async () => {

      try {

        setLoadingTeams(true);
        setError("");

        const response = await api.get(
          "/teams/"
        );

        setTeams(response.data);

        if (response.data.length > 0) {

          setSelectedTeam(
            response.data[0]
          );

        }

      } catch (error) {

        console.error(error);

        setError(
          "Impossible de récupérer vos équipes."
        );

      } finally {

        setLoadingTeams(false);

      }

    };

    fetchTeams();

  }, []);


  // ==================================================
  // CHARGER L'HISTORIQUE
  // ==================================================

  useEffect(() => {

    if (!selectedTeam) {
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
              team: selectedTeam.id,
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

  }, [selectedTeam]);


  // ==================================================
  // WEBSOCKET
  // ==================================================

  useEffect(() => {

    if (!selectedTeam) {
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
      `ws://127.0.0.1:8000/ws/teams/${selectedTeam.id}/chat/?token=${token}`
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

  }, [selectedTeam]);


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


  // ==================================================
  // CHANGEMENT D'ÉQUIPE
  // ==================================================

  const handleTeamChange = (team) => {

    setMessages([]);

    setSelectedTeam(team);

  };


  // ==================================================
  // LOADING
  // ==================================================

  if (loadingTeams) {

    return (

      <div className="flex min-h-[60vh] items-center justify-center">

        <p className="text-[#647276]">
          Chargement du chat...
        </p>

      </div>

    );

  }


  return (

    <div className="-m-8 flex h-[calc(100vh-5rem)] min-h-[600px] overflow-hidden border border-[#1C292D] bg-[#0E171A]">


      {/* ==================================================
          SIDEBAR ÉQUIPES
      ================================================== */}

      <aside className="flex w-72 flex-col border-r border-[#1C292D]">


        {/* Header */}

        <div className="border-b border-[#1C292D] p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#152400]">

              <MessageCircle
                size={20}
                className="text-[#B6FF00]"
              />

            </div>

            <div>

              <h1 className="font-semibold text-[#F1F5F2]">
                Chat
              </h1>

              <p className="text-xs text-[#647276]">
                Discussions d'équipe
              </p>

            </div>

          </div>

        </div>


        {/* Teams */}

        <div className="flex-1 overflow-y-auto p-3">

          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#47565A]">
            Mes équipes
          </p>


          {teams.length === 0 ? (

            <div className="rounded-xl bg-[#10191C] p-4 text-center">

              <Users
                size={24}
                className="mx-auto text-[#47565A]"
              />

              <p className="mt-2 text-sm text-[#647276]">
                Aucune équipe
              </p>

            </div>

          ) : (

            <div className="space-y-1">

              {teams.map((team) => {

                const isSelected =
                  selectedTeam?.id ===
                  team.id;


                return (

                  <button
                    key={team.id}
                    type="button"
                    onClick={() =>
                      handleTeamChange(
                        team
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

                          {team.name}

                        </p>


                        <p className="mt-0.5 text-xs opacity-60">

                          {team.members?.length ||
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


      {/* ==================================================
          CHAT AREA
      ================================================== */}

      <section className="flex min-w-0 flex-1 flex-col">


        {/* Header */}

        <header className="flex items-center justify-between border-b border-[#1C292D] px-6 py-4">

          <div>

            <h2 className="font-semibold text-[#F1F5F2]">

              {selectedTeam?.name ||
                "Chat"}

            </h2>

            <p className="mt-0.5 text-xs text-[#647276]">

              {selectedTeam
                ? `${selectedTeam.members?.length || 0} membre(s)`
                : "Sélectionnez une équipe"}

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


          {!selectedTeam ? (

            <div className="flex h-full items-center justify-center">

              <div className="text-center">

                <MessageCircle
                  size={40}
                  className="mx-auto text-[#47565A]"
                />

                <p className="mt-3 text-[#647276]">
                  Sélectionnez une équipe
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

        {selectedTeam && (

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

    </div>

  );

}


export default Chat;
