import {
  api,
} from "./client";


// =========================================================
// EXPENSES API
// =========================================================

export const expensesApi = {

  // =======================================================
  // GET ALL EXPENSES
  // =======================================================

  list(params = {}) {

    const query = new URLSearchParams();


    Object.entries(
      params
    ).forEach(

      ([
        key,
        value,
      ]) => {

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {

          query.append(
            key,
            value
          );

        }

      }

    );


    const queryString =
      query.toString();


    return api.get(

      `/expenses${
        queryString
          ? `?${queryString}`
          : ""
      }`

    );

  },


  // =======================================================
  // GET ONE EXPENSE
  // =======================================================

  get(
    expenseId
  ) {

    return api.get(

      `/expenses/${expenseId}`

    );

  },


  // =======================================================
  // CREATE EXPENSE
  // =======================================================

  create(
    data
  ) {

    return api.post(

      "/expenses",

      data

    );

  },


  // =======================================================
  // UPDATE EXPENSE
  // =======================================================

  update(

    expenseId,

    data

  ) {

    return api.put(

      `/expenses/${expenseId}`,

      data

    );

  },


  // =======================================================
  // DELETE EXPENSE
  // =======================================================

  delete(
    expenseId
  ) {

    return api.delete(

      `/expenses/${expenseId}`

    );

  },


  // =======================================================
  // EXPENSE SUMMARY
  // =======================================================

  summary() {

    return api.get(

      "/expenses/summary"

    );

  },

};