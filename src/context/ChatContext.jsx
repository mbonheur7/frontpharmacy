import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

import { chatApi } from "../api/chat";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";


export function ChatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const socketRef = useRef(null);

  // These refs allow the socket listener to always
  // know the latest chat state without reconnecting.
  const activeGroupIdRef = useRef(null);
  const isOpenRef = useRef(false);
  const userIdRef = useRef(null);

  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  const [isOpen, setIsOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);


  // ---------------------------------------------------
  // KEEP REFS SYNCHRONIZED
  // ---------------------------------------------------

  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);


  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);


  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);


  // ---------------------------------------------------
  // LOAD UNREAD COUNTS
  // ---------------------------------------------------

  const loadUnreadCounts = useCallback(async () => {
    try {
      const data = await chatApi.getUnread();

      const counts = {};

      for (const item of data.unread || []) {
        counts[item.group_id] =
          item.unread_count;
      }

      setUnreadCounts(counts);

    } catch (error) {
      console.error(
        "Failed to load unread chat counts:",
        error
      );
    }
  }, []);


  // ---------------------------------------------------
  // LOAD CHAT GROUPS
  // ---------------------------------------------------

  const loadGroups = useCallback(async () => {
    try {
      const data = await chatApi.getGroups();

      const chatGroups =
        data.groups || [];

      setGroups(chatGroups);

      setActiveGroupId((current) => {

        // Keep the currently selected group
        // if it still exists.
        if (
          current &&
          chatGroups.some(
            (group) =>
              group.id === current
          )
        ) {
          return current;
        }

        // Otherwise select the first group.
        return chatGroups.length > 0
          ? chatGroups[0].id
          : null;
      });

      return chatGroups;

    } catch (error) {
      console.error(
        "Failed to load chat groups:",
        error
      );

      setGroups([]);
      setActiveGroupId(null);

      return [];
    }
  }, []);


  // ---------------------------------------------------
  // LOAD MESSAGES
  // ---------------------------------------------------

  const loadMessages = useCallback(
    async (groupId) => {

      if (!groupId) return;

      setLoading(true);

      try {
        const data =
          await chatApi.getMessages(
            groupId
          );

        setMessages((current) => ({
          ...current,
          [groupId]:
            data.messages || [],
        }));

      } catch (error) {
        console.error(
          "Failed to load chat messages:",
          error
        );

      } finally {
        setLoading(false);
      }
    },
    []
  );


  // ---------------------------------------------------
  // MARK GROUP AS READ
  // ---------------------------------------------------

  const markGroupRead = useCallback(
    async (groupId) => {

      if (!groupId) return;

      try {
        await chatApi.markGroupRead(
          groupId
        );

        setUnreadCounts(
          (current) => ({
            ...current,
            [groupId]: 0,
          })
        );

      } catch (error) {
        console.error(
          "Failed to mark chat messages as read:",
          error
        );
      }
    },
    []
  );


  // ---------------------------------------------------
  // CHAT PANEL CONTROLS
  // ---------------------------------------------------

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);


  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);


  const toggleChat = useCallback(() => {
    setIsOpen((open) => !open);
  }, []);


  const selectGroup = useCallback(
    (groupId) => {
      setActiveGroupId(groupId);
    },
    []
  );


  // ---------------------------------------------------
  // SEND MESSAGE
  // ---------------------------------------------------

  const sendMessage = useCallback(
    (messageText) => {

      return new Promise(
        (resolve) => {

          const socket =
            socketRef.current;

          // Extra frontend protection.
          // The backend should also enforce this.
          if (
            user?.role === "viewer"
          ) {
            resolve({
              success: false,
              error:
                "View-only accounts cannot send messages.",
            });

            return;
          }


          if (
            !socket ||
            !socket.connected
          ) {
            resolve({
              success: false,
              error:
                "Chat connection is not available.",
            });

            return;
          }


          const groupId =
            activeGroupIdRef.current;


          if (!groupId) {
            resolve({
              success: false,
              error:
                "No chat group selected.",
            });

            return;
          }


          socket.emit(
            "send_message",
            {
              group_id: groupId,
              message: messageText,
            },
            (result) => {
              resolve(result);
            }
          );
        }
      );
    },
    [user]
  );


  // ---------------------------------------------------
  // CONNECT SOCKET ONLY AFTER LOGIN
  // ---------------------------------------------------

  useEffect(() => {

    if (
      !isAuthenticated ||
      !user
    ) {

      setGroups([]);
      setMessages({});
      setUnreadCounts({});
      setActiveGroupId(null);
      setConnected(false);

      if (
        socketRef.current
      ) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      return;
    }


    let cancelled = false;
    let socket = null;


    async function initializeChat() {

      // Load all groups the backend allows
      // this logged-in user to see.
      const chatGroups =
        await loadGroups();


      if (cancelled) return;


      await loadUnreadCounts();


      if (cancelled) return;


      socket = io(
        SOCKET_URL,
        {
          withCredentials: true,
          transports: [
            "websocket",
            "polling",
          ],
        }
      );


      socketRef.current = socket;


      // -----------------------------------------------
      // CONNECTED
      // -----------------------------------------------

      socket.on(
        "connect",
        () => {

          if (cancelled) return;

          setConnected(true);


          // Join every chat group returned
          // by the backend.
          chatGroups.forEach(
            (group) => {

              socket.emit(
                "join_chat",
                {
                  group_id:
                    group.id,
                },
                (result) => {

                  if (
                    !result?.success
                  ) {
                    console.error(
                      `Failed to join chat group ${group.id}:`,
                      result?.error
                    );
                  }
                }
              );
            }
          );
        }
      );


      // -----------------------------------------------
      // DISCONNECTED
      // -----------------------------------------------

      socket.on(
        "disconnect",
        () => {

          if (!cancelled) {
            setConnected(false);
          }
        }
      );


      // -----------------------------------------------
      // CONNECTION ERROR
      // -----------------------------------------------

      socket.on(
        "connect_error",
        (error) => {

          console.error(
            "Chat socket connection failed:",
            error.message
          );

          if (!cancelled) {
            setConnected(false);
          }
        }
      );


      // -----------------------------------------------
      // NEW MESSAGE
      // -----------------------------------------------

      socket.on(
        "new_message",
        (message) => {

          if (
            !message?.group_id
          ) {
            return;
          }


          setMessages(
            (current) => {

              const groupMessages =
                current[
                  message.group_id
                ] || [];


              const alreadyExists =
                groupMessages.some(
                  (existing) =>
                    existing.id ===
                    message.id
                );


              if (
                alreadyExists
              ) {
                return current;
              }


              return {
                ...current,

                [message.group_id]: [
                  ...groupMessages,
                  message,
                ],
              };
            }
          );


          const currentUserId =
            userIdRef.current;

          const currentGroupId =
            activeGroupIdRef.current;

          const chatIsOpen =
            isOpenRef.current;


          // Only increase unread count if:
          //
          // 1. Someone else sent the message
          // AND
          // 2. The user is not currently
          //    reading that group.
          if (
            message.sender_id !==
              currentUserId &&
            (
              !chatIsOpen ||
              currentGroupId !==
                message.group_id
            )
          ) {

            setUnreadCounts(
              (current) => ({
                ...current,

                [message.group_id]:
                  (
                    current[
                      message.group_id
                    ] || 0
                  ) + 1,
              })
            );
          }
        }
      );
    }


    initializeChat();


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {

      cancelled = true;

      if (socket) {
        socket.disconnect();
      }

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current = null;
      }
    };

  }, [
    isAuthenticated,
    user,
    loadGroups,
    loadUnreadCounts,
  ]);


  // ---------------------------------------------------
  // LOAD / MARK READ WHEN USER OPENS CHAT
  // ---------------------------------------------------

  useEffect(() => {

    if (
      isOpen &&
      activeGroupId
    ) {

      loadMessages(
        activeGroupId
      );

      markGroupRead(
        activeGroupId
      );
    }

  }, [
    isOpen,
    activeGroupId,
    loadMessages,
    markGroupRead,
  ]);


  // ---------------------------------------------------
  // TOTAL UNREAD
  // ---------------------------------------------------

  const totalUnread =
    Object.values(
      unreadCounts
    ).reduce(
      (total, count) =>
        total + count,
      0
    );


  // ---------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------

  const value = {

    groups,
    messages,
    unreadCounts,
    totalUnread,

    isOpen,
    activeGroupId,

    connected,
    loading,

    openChat,
    closeChat,
    toggleChat,

    selectGroup,

    loadGroups,
    loadMessages,
    markGroupRead,

    sendMessage,
  };


  return (
    <ChatContext.Provider
      value={value}
    >
      {children}
    </ChatContext.Provider>
  );
}


export function useChat() {

  const context =
    useContext(ChatContext);


  if (!context) {
    throw new Error(
      "useChat must be used within a ChatProvider"
    );
  }


  return context;
}