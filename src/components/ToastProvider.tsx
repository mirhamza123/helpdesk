"use client";
import { ToastContainer } from "react-toastify";

export function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      closeOnClick
      pauseOnFocusLoss
      pauseOnHover
      draggable
      newestOnTop
      limit={4}
      theme="light"
    />
  );
}
