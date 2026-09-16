import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { medicineCommentsApi } from "../api/medicineComments";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

import {
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "./StateViews";


export default function MedicineComments({
  medicine,
  onClose,
}) {

  // =====================================================
  // AUTH
  // =====================================================

  const { user } = useAuth();


  // =====================================================
  // COMMENTS STATE
  // =====================================================

  const [comments, setComments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [commentText, setCommentText] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [deleteConfirm, setDeleteConfirm] =
    useState(null);


  // =====================================================
  // DRAGGING STATE
  // =====================================================

  const modalRef =
    useRef(null);

  const dragRef =
    useRef(null);


  const [position, setPosition] =
    useState(null);

  const [isDragging, setIsDragging] =
    useState(false);


  // =====================================================
  // ROLE CHECK
  // =====================================================

  const role =
    (user?.role || "")
      .trim()
      .toLowerCase();


  const isViewer =
    role === "admin viewer" ||
    role === "admin_viewer" ||
    role === "viewer";


  // =====================================================
  // ADMIN VIEWER PERMISSION MESSAGE
  // =====================================================

  function denyAdminViewer() {

    setError(
      new ApiError(
        "You are logged in as an Admin Viewer. You can view all information, but you do not have permission to make changes.",
        403,
        null
      )
    );

  }


  // =====================================================
  // LOAD COMMENTS
  // =====================================================

  async function loadComments() {

    setLoading(true);

    setError(null);

    try {

      const data =
        await medicineCommentsApi.list(
          medicine.id
        );


      setComments(
        data?.comments || []
      );

    } catch (err) {

      setError(err);

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    loadComments();

  }, [medicine.id]);


  // =====================================================
  // DRAG START
  // =====================================================

  function handlePointerDown(event) {

    /*
      Do not drag when clicking
      on a button.
    */

    if (
      event.target.closest("button")
    ) {
      return;
    }


    if (!modalRef.current) {
      return;
    }


    const rect =
      modalRef.current.getBoundingClientRect();


    /*
      Convert the centered window
      into a fixed-position window.
    */

    setPosition({

      x: rect.left,

      y: rect.top,

    });


    dragRef.current = {

      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      modalX:
        rect.left,

      modalY:
        rect.top,

    };


    setIsDragging(true);


    event.currentTarget.setPointerCapture(
      event.pointerId
    );


    event.preventDefault();

  }


  // =====================================================
  // DRAG MOVE
  // =====================================================

  function handlePointerMove(event) {

    if (!dragRef.current) {
      return;
    }


    if (
      dragRef.current.pointerId !==
      event.pointerId
    ) {
      return;
    }


    const deltaX =
      event.clientX -
      dragRef.current.startX;


    const deltaY =
      event.clientY -
      dragRef.current.startY;


    let nextX =
      dragRef.current.modalX +
      deltaX;


    let nextY =
      dragRef.current.modalY +
      deltaY;


    const modalWidth =
      modalRef.current
        ?.offsetWidth || 560;


    const modalHeight =
      modalRef.current
        ?.offsetHeight || 500;


    /*
      Keep part of the window
      visible on screen.
    */

    const visibleArea =
      100;


    const minX =
      -modalWidth +
      visibleArea;


    const maxX =
      window.innerWidth -
      visibleArea;


    const minY =
      0;


    const maxY =
      window.innerHeight -
      visibleArea;


    nextX =
      Math.max(
        minX,
        Math.min(
          nextX,
          maxX
        )
      );


    nextY =
      Math.max(
        minY,
        Math.min(
          nextY,
          maxY
        )
      );


    setPosition({

      x: nextX,

      y: nextY,

    });

  }


  // =====================================================
  // DRAG END
  // =====================================================

  function handlePointerUp(event) {

    if (
      dragRef.current &&
      dragRef.current.pointerId ===
      event.pointerId
    ) {

      dragRef.current =
        null;


      setIsDragging(false);

    }

  }


  // =====================================================
  // ADD COMMENT
  // =====================================================

  async function handleAddComment(event) {

    event.preventDefault();


    /*
      Admin Viewer can see the button,
      but cannot execute the action.
    */

    if (isViewer) {

      denyAdminViewer();

      return;

    }


    const text =
      commentText.trim();


    if (!text) {

      setError(
        new ApiError(
          "Comment cannot be empty.",
          400,
          null
        )
      );

      return;

    }


    setSubmitting(true);

    setError(null);


    try {

      const result =
        await medicineCommentsApi.create(
          medicine.id,
          {
            comment: text,
          }
        );


      setComments(
        (current) => [

          ...current,

          result.comment,

        ]
      );


      setCommentText("");

    } catch (err) {

      setError(err);

    } finally {

      setSubmitting(false);

    }

  }


  // =====================================================
  // REQUEST DELETE
  // =====================================================

  function handleRequestDelete(comment) {

    /*
      Admin Viewer sees the Delete button
      but cannot perform the action.
    */

    if (isViewer) {

      denyAdminViewer();

      return;

    }


    setDeleteConfirm(
      comment
    );

  }


  // =====================================================
  // CONFIRM DELETE
  // =====================================================

  async function handleDeleteComment() {

    if (!deleteConfirm) {
      return;
    }


    /*
      Extra protection.
    */

    if (isViewer) {

      setDeleteConfirm(null);

      denyAdminViewer();

      return;

    }


    setSubmitting(true);

    setError(null);


    try {

      await medicineCommentsApi.delete(
        medicine.id,
        deleteConfirm.id
      );


      setComments(
        (current) =>
          current.filter(
            (comment) =>
              comment.id !==
              deleteConfirm.id
          )
      );


      setDeleteConfirm(null);

    } catch (err) {

      setError(err);

      setDeleteConfirm(null);

    } finally {

      setSubmitting(false);

    }

  }


  // =====================================================
  // BACKDROP CLOSE
  // =====================================================

  function handleBackdropPointerDown(
    event
  ) {

    if (
      event.target ===
      event.currentTarget
    ) {

      onClose();

    }

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className="modal-backdrop"
      onPointerDown={
        handleBackdropPointerDown
      }
      style={{

        position:
          "fixed",

        inset:
          0,

        zIndex:
          1000,

      }}
    >


      {/* ================================================= */}
      {/* MAIN DRAGGABLE WINDOW */}
      {/* ================================================= */}

      <div
        ref={modalRef}
        className="modal"
        onPointerDown={(event) =>
          event.stopPropagation()
        }
        style={{

          width:
            "min(560px, 92vw)",


          maxHeight:
            "75vh",


          position:
            "fixed",


          left:
            position
              ? `${position.x}px`
              : "50%",


          top:
            position
              ? `${position.y}px`
              : "50%",


          transform:
            position
              ? "none"
              : "translate(-50%, -50%)",


          display:
            "flex",


          flexDirection:
            "column",


          overflow:
            "hidden",


          /*
            IMPORTANT:
            This makes the confirmation
            overlay position itself inside
            this window.
          */

          isolation:
            "isolate",


          userSelect:
            isDragging
              ? "none"
              : "auto",

        }}
      >


        {/* =============================================== */}
        {/* DRAGGABLE HEADER */}
        {/* =============================================== */}

        <div
          className="modal-header"
          onPointerDown={
            handlePointerDown
          }
          onPointerMove={
            handlePointerMove
          }
          onPointerUp={
            handlePointerUp
          }
          onPointerCancel={
            handlePointerUp
          }
          style={{

            cursor:
              isDragging
                ? "grabbing"
                : "grab",


            flexShrink:
              0,


            display:
              "flex",


            alignItems:
              "center",


            justifyContent:
              "space-between",


            gap:
              16,

          }}
        >


          {/* TITLE */}

          <div
            style={{
              minWidth: 0,
            }}
          >

            <h2
              style={{
                margin: 0,
              }}
            >

              Medicine Comments

            </h2>


            <div
              style={{

                color:
                  "var(--ink-dim)",

                fontSize:
                  13,

                marginTop:
                  4,

                whiteSpace:
                  "nowrap",

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",

              }}
            >

              {medicine.generic_name}

              {medicine.brand_name
                ? ` — ${medicine.brand_name}`
                : ""}

            </div>

          </div>


          {/* CLOSE BUTTON */}

          <button
            className="btn btn-ghost btn-sm"
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onClick={onClose}
            style={{

              flexShrink:
                0,

            }}
          >

            Close

          </button>


        </div>


        {/* =============================================== */}
        {/* CONTENT */}
        {/* =============================================== */}

        <div
          style={{

            padding:
              "16px 18px",


            overflowY:
              "auto",


            flex:
              1,

          }}
        >


          {/* ERROR */}

          {error && (

            <ErrorBanner
              error={error}
            />

          )}


          {/* ============================================= */}
          {/* ADD COMMENT */}
          {/* ============================================= */}

          <form
            onSubmit={
              handleAddComment
            }
            style={{

              marginBottom:
                18,

            }}
          >


            <textarea
              className="input"
              placeholder="Write a comment about this medicine…"
              value={
                commentText
              }
              onChange={(event) =>
                setCommentText(
                  event.target.value
                )
              }
              rows={3}
              maxLength={5000}
              style={{

                width:
                  "100%",

                resize:
                  "vertical",

              }}
            />


            <div
              style={{

                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap:
                  12,

                marginTop:
                  8,

              }}
            >


              <span
                style={{

                  fontSize:
                    12,

                  color:
                    "var(--ink-dim)",

                }}
              >

                {commentText.length}
                /5000

              </span>


              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  submitting
                }
              >

                {submitting
                  ? "Adding…"
                  : "Add comment"}

              </button>


            </div>


          </form>


          {/* ============================================= */}
          {/* COMMENTS */}
          {/* ============================================= */}

          {loading ? (

            <LoadingState
              label="Loading comments…"
            />

          ) : comments.length === 0 ? (

            <EmptyState
              label="No comments yet."
            />

          ) : (

            <div
              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  10,

              }}
            >

              {comments.map(
                (comment) => (

                  <div
                    key={
                      comment.id
                    }
                    className="card"
                    style={{

                      padding:
                        "13px 14px",

                    }}
                  >


                    {/* COMMENT HEADER */}

                    <div
                      style={{

                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        alignItems:
                          "flex-start",

                        gap:
                          12,

                        marginBottom:
                          8,

                      }}
                    >


                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >


                        <div
                          style={{
                            fontWeight: 600,
                          }}
                        >

                          {
                            comment.fullname
                          }

                        </div>


                        <div
                          style={{

                            fontSize:
                              11.5,

                            color:
                              "var(--ink-dim)",

                            marginTop:
                              2,

                          }}
                        >

                          @
                          {
                            comment.username
                          }

                          {" · "}

                          {
                            comment.created_at
                              ? new Date(
                                  comment.created_at
                                ).toLocaleString()
                              : ""
                          }

                        </div>


                      </div>


                      {/* DELETE */}

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{

                          color:
                            "var(--danger)",

                          flexShrink:
                            0,

                        }}
                        onClick={() =>
                          handleRequestDelete(
                            comment
                          )
                        }
                      >

                        Delete

                      </button>


                    </div>


                    {/* COMMENT TEXT */}

                    <div
                      style={{

                        whiteSpace:
                          "pre-wrap",

                        lineHeight:
                          1.5,

                        fontSize:
                          14,

                      }}
                    >

                      {
                        comment.comment
                      }

                    </div>


                  </div>

                )
              )}

            </div>

          )}


        </div>


        {/* ================================================= */}
        {/* DELETE CONFIRMATION INSIDE COMMENTS WINDOW */}
        {/* ================================================= */}

        {deleteConfirm && (

          <div
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            style={{

              /*
                This overlay covers only
                the Medicine Comments window.
              */

              position:
                "absolute",


              inset:
                0,


              zIndex:
                50,


              display:
                "flex",


              alignItems:
                "center",


              justifyContent:
                "center",


              padding:
                20,


              background:
                "rgba(0, 0, 0, 0.45)",

            }}
          >


            {/* CONFIRMATION BOX */}

            <div
              className="card"
              style={{

                width:
                  "min(400px, 100%)",


                padding:
                  22,


                boxShadow:
                  "0 20px 50px rgba(0, 0, 0, 0.4)",

              }}
            >


              {/* TITLE */}

              <h3
                style={{

                  marginTop:
                    0,

                  marginBottom:
                    10,

                }}
              >

                Delete comment?

              </h3>


              {/* MESSAGE */}

              <div
                style={{

                  color:
                    "var(--ink-dim)",

                  lineHeight:
                    1.5,

                  marginBottom:
                    20,

                }}
              >

                Are you sure you want to delete this comment?
                This action cannot be undone.

              </div>


              {/* ACTIONS */}

              <div
                style={{

                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    10,

                }}
              >


                {/* CANCEL */}

                <button
                  className="btn"
                  disabled={
                    submitting
                  }
                  onClick={() =>
                    setDeleteConfirm(
                      null
                    )
                  }
                >

                  Cancel

                </button>


                {/* DELETE */}

                <button
                  className="btn"
                  disabled={
                    submitting
                  }
                  onClick={
                    handleDeleteComment
                  }
                  style={{

                    color:
                      "#fff",

                    background:
                      "var(--danger)",

                  }}
                >

                  {submitting
                    ? "Deleting…"
                    : "Delete"}

                </button>


              </div>


            </div>


          </div>

        )}


      </div>


    </div>

  );

}