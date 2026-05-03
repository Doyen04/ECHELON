import type { Session } from "next-auth";

export function filterBatchesByUserRole(user: Session["user"]) {
  if (user.role === "super_admin") {
    // No filter; super_admin sees all
    return {};
  }

  if (user.role === "hod" && user.departmentId) {
    // HOD sees only batches from programs in their department
    return {
      program: {
        departmentId: user.departmentId,
      },
    };
  }

  // Fallback: no access
  return { programId: "INVALID" };
}

export function filterProgramsByUserRole(user: Session["user"]) {
  if (user.role === "super_admin") {
    return {}; // All programs
  }

  if (user.role === "hod" && user.departmentId) {
    return { departmentId: user.departmentId };
  }

  return { id: "INVALID" };
}
