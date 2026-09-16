/**
 * Centralized HTTP client for the VI-PHARMACY Flask API.
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:5000/api";


export class ApiError extends Error {

  constructor(message, status, data) {

    super(message);

    this.name = "ApiError";

    // 0 means the server could not be reached.
    this.status = status;

    this.data = data;

  }

}


function buildUrl(path, params) {

  const url = new URL(
    BASE_URL.replace(/\/$/, "") + path,
    window.location.origin
  );


  if (params) {

    Object.entries(params).forEach(
      ([key, value]) => {

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {

          url.searchParams.set(
            key,
            value
          );

        }

      }
    );

  }


  return url.toString();

}


async function request(
  path,
  {
    method = "GET",
    body,
    params,
  } = {}
) {

  let response;


  try {

    response = await fetch(

      buildUrl(
        path,
        params
      ),

      {

        method,

        credentials: "include",

        headers:

          body
            ? {
                "Content-Type":
                  "application/json",
              }
            : undefined,

        body:

          body
            ? JSON.stringify(
                body
              )
            : undefined,

      }

    );

  } catch (networkErr) {

    throw new ApiError(

      "Unable to connect to the pharmacy server. Make sure the backend is running.",

      0,

      null

    );

  }


  let data = null;


  const text =
    await response.text();


  if (text) {

    try {

      data =
        JSON.parse(
          text
        );

    } catch {

      data = null;

    }

  }


  if (!response.ok) {

    const message =

      (
        data &&
        data.error
      )

      ||

      `Request failed (${response.status}). Please try again.`;


    throw new ApiError(

      message,

      response.status,

      data

    );

  }


  return data;

}


export const api = {

  get: (
    path,
    params
  ) =>
    request(
      path,
      {
        method: "GET",
        params,
      }
    ),


  post: (
    path,
    body
  ) =>
    request(
      path,
      {
        method: "POST",
        body,
      }
    ),


  patch: (
    path,
    body
  ) =>
    request(
      path,
      {
        method: "PATCH",
        body,
      }
    ),


  delete: (
    path
  ) =>
    request(
      path,
      {
        method: "DELETE",
      }
    ),

};