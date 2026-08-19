import React from "react";
import { Metadata } from "next";
import { AdminFormsManager } from "@/components/admin/forms/AdminFormsManager";

export const metadata: Metadata = {
  title: "Forms & Submissions Manager | Admin Panel",
  description: "Manage, edit cells, delete rows, and export inquiry forms and newsletter subscriptions in Excel format.",
};

export default function AdminFormsPage() {
  return <AdminFormsManager />;
}
