import { useEffect, useRef, useState } from "react";

import {
  MessageCircle,
  X,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";


export default function ChatPanel() {

  const {
    groups,
    messages,
    unreadCounts,
    isOpen,
    activeGroupId,
    connected,
    loading,
    closeChat,
    selectGroup,
    sendMessage,
    markGroupRead,
  } = useChat();


  const {
    user,
    isSuperAdmin,
    isAdminViewer,
  } = useAuth();


  const [messageText, setMessageText] =
    useState("");


  const messagesEndRef =
    useRef(null);


  // =========================================================
  // USER ROLE
  // =========================================================

  /*
    The values below come directly from AuthContext.

    isSuperAdmin:
      Can use all admin privileges.

    isAdminViewer:
      Can view admin information but is restricted
      from privileged actions.
  */


  // =========================================================
  // VISIBLE GROUPS
  // =========================================================

  /*
    Admin Viewer can see and read all available
    chat groups.

    Therefore, we do not filter the groups.
  */

  const visibleGroups = groups || [];


  // =========================================================
  // ACTIVE GROUP
  // =========================================================

  const activeGroup =
    visibleGroups.find(
      (group) =>
        group.id === activeGroupId
    );


  const activeMessages =
    messages?.[activeGroupId] || [];


  // =========================================================
  // SEND PERMISSION
  // =========================================================

  /*
    Super Admin:
      Can send messages everywhere.

    Normal users:
      Can send messages everywhere.

    Admin Viewer:
      Can only send messages inside Admin Group.
      Other conversations are read-only.
  */

  const activeGroupName =
    activeGroup?.name
      ?.trim()
      .toLowerCase();


  const isAdminGroup =
    activeGroupName === "admin group";


  const canSendMessage =
    Boolean(activeGroup) &&
    (
      !isAdminViewer ||
      isAdminGroup
    );


  // =========================================================
  // MARK GROUP AS READ
  // =========================================================

  useEffect(() => {

    if (
      isOpen &&
      activeGroupId
    ) {

      markGroupRead(
        activeGroupId
      );

    }

  }, [
    isOpen,
    activeGroupId,
    activeMessages.length,
    markGroupRead,
  ]);


  // =========================================================
  // SCROLL TO LATEST MESSAGE
  // =========================================================

  useEffect(() => {

    if (isOpen) {

      messagesEndRef.current
        ?.scrollIntoView({
          behavior: "smooth",
        });

    }

  }, [
    activeMessages.length,
    isOpen,
    activeGroupId,
  ]);


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  async function handleSubmit(event) {

    event.preventDefault();


    // Extra frontend protection.
    if (!canSendMessage) {
      return;
    }


    const text =
      messageText.trim();


    if (!text) {
      return;
    }


    try {

      const result =
        await sendMessage(text);


      if (result?.success) {

        setMessageText("");

      } else {

        alert(
          result?.error ||
          "Unable to send message."
        );

      }

    } catch (error) {

      alert(
        error?.message ||
        "Unable to send message."
      );

    }

  }


  // =========================================================
  // DO NOT RENDER WHEN CLOSED
  // =========================================================

  if (!isOpen) {
    return null;
  }


  // =========================================================
  // COMPONENT
  // =========================================================

  return (

    <div className="chat-panel">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="chat-panel-header">


        <div className="chat-panel-heading">

          <MessageCircle size={19} />


          <div>

            <strong>
              Team Chat
            </strong>


            <span
              className={
                connected
                  ? "chat-connection connected"
                  : "chat-connection disconnected"
              }
            >

              {connected ? (

                <>

                  <Wifi size={12} />

                  Connected

                </>

              ) : (

                <>

                  <WifiOff size={12} />

                  Connecting...

                </>

              )}

            </span>

          </div>

        </div>


        <button
          className="chat-close-btn"
          onClick={closeChat}
          aria-label="Close chat"
          title="Close chat"
          type="button"
        >

          <X size={19} />

        </button>


      </div>


      {/* =====================================================
          BODY
          ===================================================== */}

      <div className="chat-panel-body">


        {/* =================================================
            GROUP LIST
            ================================================= */}

        <aside className="chat-groups">


          <div className="chat-groups-title">

            Conversations

          </div>


          {visibleGroups.map(
            (group) => {

              const unread =
                unreadCounts?.[group.id] || 0;


              return (

                <button
                  key={group.id}
                  type="button"
                  className={
                    "chat-group-item" +
                    (
                      activeGroupId === group.id
                        ? " active"
                        : ""
                    )
                  }
                  onClick={() => {

                    selectGroup(
                      group.id
                    );


                    markGroupRead(
                      group.id
                    );

                  }}
                >


                  <div className="chat-group-name">

                    {group.name}

                  </div>


                  {unread > 0 && (

                    <span className="chat-group-unread">

                      {unread > 99
                        ? "99+"
                        : unread}

                    </span>

                  )}


                </button>

              );

            }
          )}


          {visibleGroups.length === 0 && (

            <div className="chat-empty-groups">

              No conversations available.

            </div>

          )}


        </aside>


        {/* =================================================
            MESSAGES
            ================================================= */}

        <section className="chat-messages-section">


          {/* =============================================
              ACTIVE GROUP NAME
              ============================================= */}

          <div className="chat-active-group">

            {activeGroup
              ? activeGroup.name
              : "Select a conversation"}

          </div>


          {/* =============================================
              MESSAGES
              ============================================= */}

          <div className="chat-messages">


            {loading && (

              <div className="chat-loading">

                Loading messages...

              </div>

            )}


            {!loading &&
              activeGroup &&
              activeMessages.length === 0 && (

                <div className="chat-empty-messages">

                  No messages yet.

                  <br />

                  Start the conversation.

                </div>

              )}


            {!loading &&
              !activeGroup && (

                <div className="chat-empty-messages">

                  Select a conversation.

                </div>

              )}


            {activeMessages.map(
              (message) => {

                const isMine =
                  message.sender_id ===
                  user?.id;


                return (

                  <div
                    key={message.id}
                    className={
                      "chat-message-row " +
                      (
                        isMine
                          ? "mine"
                          : "theirs"
                      )
                    }
                  >


                    <div
                      className={
                        "chat-message " +
                        (
                          isMine
                            ? "mine"
                            : "theirs"
                        )
                      }
                    >


                      {!isMine && (

                        <div className="chat-message-sender">

                          {
                            message.sender_fullname ||
                            message.sender_username ||
                            "Unknown User"
                          }

                        </div>

                      )}


                      <div className="chat-message-text">

                        {message.message}

                      </div>


                      {message.created_at && (

                        <div className="chat-message-time">

                          {
                            new Date(
                              message.created_at
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          }

                        </div>

                      )}


                    </div>


                  </div>

                );

              }
            )}


            <div
              ref={messagesEndRef}
            />


          </div>


          {/* =================================================
              MESSAGE INPUT / READ ONLY
              ================================================= */}

          {canSendMessage ? (

            <form
              className="chat-message-form"
              onSubmit={handleSubmit}
            >


              <input
                className="chat-message-input"
                value={messageText}
                onChange={(event) =>
                  setMessageText(
                    event.target.value
                  )
                }
                placeholder={
                  activeGroup
                    ? "Type a message..."
                    : "Select a conversation first"
                }
                disabled={
                  !activeGroup ||
                  !connected
                }
                maxLength={5000}
              />


              <button
                className="chat-send-btn"
                type="submit"
                disabled={
                  !messageText.trim() ||
                  !activeGroup ||
                  !connected
                }
                title="Send message"
              >

                <Send size={18} />

              </button>


            </form>

          ) : (

            <div className="chat-read-only">

              You can view messages in this conversation,
              but you cannot send messages.

            </div>

          )}


        </section>


      </div>


    </div>

  );

}