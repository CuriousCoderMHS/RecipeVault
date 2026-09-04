import { prisma } from "../../../../../lib/prisma";
import { NextResponse } from "next/server";

type Props = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
    const { id } = await params;

    try {
        const body = await request.json();
        const fav = Boolean(body.favourite);

        const recipe = await prisma.recipe.update({
            where: { id: Number(id) },
            data: { favourite: fav },
        });

        return NextResponse.json(recipe);
    } catch (err: any) {
        console.error("FAV PATCH ERROR:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
