import { prisma } from "@/lib/db";

export async function validateLevelConsistency(
  studentRows: Array<{ level: number }>,
): Promise<{ valid: boolean; message?: string }> {
  if (studentRows.length === 0) {
    return { valid: false, message: "No student records found" };
  }

  const levels = new Set(studentRows.map((row) => row.level));
  if (levels.size > 1) {
    return {
      valid: false,
      message: `Mixed levels detected: ${Array.from(levels).join(", ")}. All students must be at the same level.`,
    };
  }

  return { valid: true };
}

export async function checkDuplicateBatch(
  programId: string,
  session: string,
  semester: string,
  level: number,
) {
  const existing = await prisma.resultBatch.findFirst({
    where: { programId, session, semester, level },
    select: { id: true, uploadedAt: true, status: true },
  });

  return existing;
}

export async function getProgramsForHod(departmentId: string) {
  return prisma.program.findMany({
    where: { departmentId },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}
