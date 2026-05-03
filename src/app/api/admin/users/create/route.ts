import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/hod-session";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  departmentId: z.string().optional(), // null for super_admin
  role: z.enum(["super_admin", "hod"]),
});

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body: " + parsed.error.message },
      { status: 400 },
    );
  }

  const { name, email, password, departmentId, role } = parsed.data;

  // Verify email is unique
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 },
    );
  }

  // If role=hod, verify departmentId
  if (role === "hod" && !departmentId) {
    return NextResponse.json(
      { error: "Department required for HOD role" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { institutionId: true }
  });

  if (!actor) {
    return NextResponse.json({ error: "Authenticated user not found" }, { status: 404 });
  }

  const user = await prisma.user.create({
    data: {
      institutionId: actor.institutionId,
      name,
      email,
      passwordHash,
      role,
      departmentId: role === "hod" ? departmentId : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
