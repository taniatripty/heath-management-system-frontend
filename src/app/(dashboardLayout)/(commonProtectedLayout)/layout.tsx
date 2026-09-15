import React from "react";

export default function CommonProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <>
  Common Protected Layout
  {children}
  </>)
}
