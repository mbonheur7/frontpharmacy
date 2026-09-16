import React, {
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useFetch,
} from "../hooks/useFetch";

import {
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "../components/StateViews";

import {
  formatMoney,
  formatDate,
} from "../utils/formatters";

import {
  expensesApi,
} from "../api/expenses";


// =========================================================
// EXPENSES PAGE
// =========================================================

export default function Expenses() {

  const {
    user,
  } =
    useAuth();


  const canManageExpenses =
    user?.role ===
    "Super Admin";


  const [
    showForm,
    setShowForm,
  ] =
    useState(
      false
    );


  const [
    editingExpense,
    setEditingExpense,
  ] =
    useState(
      null
    );


  const [
    category,
    setCategory,
  ] =
    useState(
      ""
    );


  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(
      0
    );


  const {
    data,
    loading,
    error,
  } =
    useFetch(

      () =>

        expensesApi.list(
          category
            ? {
                category,
              }
            : {}
        ),

      [
        category,
        refreshKey,
      ]

    );


  const expenses =
    data?.expenses ||
    [];


  function refreshExpenses() {

    setRefreshKey(
      (value) =>
        value + 1
    );

  }


  function openCreateForm() {

    setEditingExpense(
      null
    );

    setShowForm(
      true
    );

  }


  function openEditForm(
    expense
  ) {

    setEditingExpense(
      expense
    );

    setShowForm(
      true
    );

  }


  return (

    <div>


      {/* ================================================
          HEADER
          ================================================ */}

      <div
        className="page-header"
      >

        <div>

          <h2>

            Expenses

          </h2>


          <p
            style={{

              color:
                "var(--ink-dim)",

              fontSize:
                13,

              marginTop:
                4,

            }}
          >

            Track pharmacy operating expenses.

          </p>

        </div>


        {canManageExpenses && (

          <button

            className="btn btn-primary"

            onClick={
              openCreateForm
            }

          >

            + Add expense

          </button>

        )}

      </div>


      {/* ================================================
          FILTER
          ================================================ */}

      <div
        className="toolbar"
      >

        <select

          className="input"

          style={{
            maxWidth: 220,
          }}

          value={category}

          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }

        >

          <option value="">

            All categories

          </option>

          <option value="Rent">

            Rent

          </option>

          <option value="Utilities">

            Utilities

          </option>

          <option value="Salaries">

            Salaries

          </option>

          <option value="Supplies">

            Supplies

          </option>

          <option value="Transport">

            Transport

          </option>

          <option value="Maintenance">

            Maintenance

          </option>

          <option value="Other">

            Other

          </option>

        </select>

      </div>


      {/* ================================================
          LOADING
          ================================================ */}

      {loading && (

        <LoadingState
          label="Loading expenses…"
        />

      )}


      {/* ================================================
          ERROR
          ================================================ */}

      {!loading &&
      error && (

        <ErrorBanner
          error={error}
        />

      )}


      {/* ================================================
          EMPTY
          ================================================ */}

      {!loading &&
      !error &&
      expenses.length === 0 && (

        <EmptyState
          label="No expenses found."
        />

      )}


      {/* ================================================
          EXPENSE TABLE
          ================================================ */}

      {!loading &&
      !error &&
      expenses.length > 0 && (

        <div
          className="card"
        >

          <div
            className="table-wrap"
          >

            <table
              className="table"
            >

              <thead>

                <tr>

                  <th>
                    Title
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Created by
                  </th>

                  {canManageExpenses && (

                    <th>

                      Actions

                    </th>

                  )}

                </tr>

              </thead>


              <tbody>

                {expenses.map(
                  (expense) => (

                    <tr
                      key={
                        expense.id
                      }
                    >

                      <td>

                        <div
                          style={{
                            fontWeight:
                              600,
                          }}
                        >

                          {
                            expense.title
                          }

                        </div>


                        {expense.description && (

                          <div
                            style={{

                              fontSize:
                                11.5,

                              color:
                                "var(--ink-dim)",

                              marginTop:
                                3,

                            }}
                          >

                            {
                              expense.description
                            }

                          </div>

                        )}

                      </td>


                      <td>

                        {
                          expense.category
                        }

                      </td>


                      <td
                        className="mono"
                        style={{
                          fontWeight:
                            600,
                        }}
                      >

                        {
                          formatMoney(
                            expense.amount
                          )
                        }

                      </td>


                      <td>

                        {
                          formatDate(
                            expense.expense_date
                          )
                        }

                      </td>


                      <td>

                        {
                          expense.created_by_name ||
                          "—"
                        }

                      </td>


                      {canManageExpenses && (

                        <td>

                          <button

                            className="btn btn-sm"

                            onClick={() =>
                              openEditForm(
                                expense
                              )
                            }

                          >

                            Edit

                          </button>


                          <button

                            className="btn btn-ghost btn-sm"

                            style={{

                              color:
                                "var(--danger)",

                              marginLeft:
                                6,

                            }}

                            onClick={async () => {

                              const confirmed =
                                window.confirm(
                                  `Delete "${expense.title}"?`
                                );


                              if (
                                !confirmed
                              ) {

                                return;

                              }


                              try {

                                await expensesApi.delete(
                                  expense.id
                                );


                                refreshExpenses();

                              } catch (
                                err
                              ) {

                                alert(
                                  err.message ||
                                  "Failed to delete expense."
                                );

                              }

                            }}

                          >

                            Delete

                          </button>

                        </td>

                      )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* ================================================
          EXPENSE FORM
          ================================================ */}

      {showForm && (

        <ExpenseForm

          expense={
            editingExpense
          }

          onClose={() => {

            setShowForm(
              false
            );

            setEditingExpense(
              null
            );

          }}

          onSaved={() => {

            setShowForm(
              false
            );

            setEditingExpense(
              null
            );

            refreshExpenses();

          }}

        />

      )}


    </div>

  );

}


// =========================================================
// EXPENSE FORM
// =========================================================

function ExpenseForm({

  expense,

  onClose,

  onSaved,

}) {


  const isEditing =
    Boolean(
      expense
    );


  const [
    title,
    setTitle,
  ] =
    useState(
      expense?.title ||
      ""
    );


  const [
    category,
    setCategory,
  ] =
    useState(
      expense?.category ||
      "Other"
    );


  const [
    description,
    setDescription,
  ] =
    useState(
      expense?.description ||
      ""
    );


  const [
    amount,
    setAmount,
  ] =
    useState(
      expense?.amount ||
      ""
    );


  const [
    expenseDate,
    setExpenseDate,
  ] =
    useState(
      expense?.expense_date ||
      new Date()
        .toISOString()
        .slice(
          0,
          10
        )
    );


  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  const [
    formError,
    setFormError,
  ] =
    useState(
      null
    );


  async function handleSubmit(
    e
  ) {

    e.preventDefault();


    setSaving(
      true
    );


    setFormError(
      null
    );


    const payload = {

      title,

      category,

      description,

      amount:
        Number(
          amount
        ),

      expense_date:
        expenseDate,

    };


    try {

      if (
        isEditing
      ) {

        await expensesApi.update(

          expense.id,

          payload

        );

      } else {

        await expensesApi.create(
          payload
        );

      }


      onSaved();

    } catch (
      err
    ) {

      setFormError(
        err.message ||
        "Failed to save expense."
      );

    } finally {

      setSaving(
        false
      );

    }

  }


  return (

    <div
      className="modal-backdrop"
    >

      <div
        className="card card-pad"
        style={{

          width:
            "100%",

          maxWidth:
            500,

          margin:
            "40px auto",

        }}
      >


        <h3
          style={{
            marginBottom:
              18,
          }}
        >

          {
            isEditing
              ? "Edit expense"
              : "Add expense"
          }

        </h3>


        {formError && (

          <ErrorBanner
            error={
              formError
            }
          />

        )}


        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* TITLE */}

          <div
            style={{
              marginBottom:
                12,
            }}
          >

            <label>

              Expense title

            </label>


            <input

              className="input"

              value={title}

              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }

              required

            />

          </div>


          {/* CATEGORY */}

          <div
            style={{
              marginBottom:
                12,
            }}
          >

            <label>

              Category

            </label>


            <select

              className="input"

              value={category}

              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }

            >

              <option value="Rent">
                Rent
              </option>

              <option value="Utilities">
                Utilities
              </option>

              <option value="Salaries">
                Salaries
              </option>

              <option value="Supplies">
                Supplies
              </option>

              <option value="Transport">
                Transport
              </option>

              <option value="Maintenance">
                Maintenance
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>


          {/* AMOUNT */}

          <div
            style={{
              marginBottom:
                12,
            }}
          >

            <label>

              Amount

            </label>


            <input

              className="input"

              type="number"

              min="0.01"

              step="0.01"

              value={amount}

              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }

              required

            />

          </div>


          {/* DATE */}

          <div
            style={{
              marginBottom:
                12,
            }}
          >

            <label>

              Expense date

            </label>


            <input

              className="input"

              type="date"

              value={
                expenseDate
              }

              onChange={(e) =>
                setExpenseDate(
                  e.target.value
                )
              }

              required

            />

          </div>


          {/* DESCRIPTION */}

          <div
            style={{
              marginBottom:
                18,
            }}
          >

            <label>

              Description

            </label>


            <textarea

              className="input"

              rows="4"

              value={
                description
              }

              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }

            />

          </div>


          {/* BUTTONS */}

          <div
            style={{

              display:
                "flex",

              justifyContent:
                "flex-end",

              gap:
                8,

            }}
          >

            <button

              type="button"

              className="btn"

              onClick={
                onClose
              }

            >

              Cancel

            </button>


            <button

              type="submit"

              className="btn btn-primary"

              disabled={
                saving
              }

            >

              {
                saving
                  ? "Saving…"
                  : isEditing
                    ? "Save changes"
                    : "Add expense"
              }

            </button>

          </div>


        </form>


      </div>

    </div>

  );

}