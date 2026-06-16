import { NextResponse } from "next/server";

import { patchUser } from "@/lib/admin-user-routes";

type RouteContext = {
    params: Promise<{
        userId: string;
    }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    return patchUser(request, context);
}

export async function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
