export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { generateRecipeImage }
    from "../../../lib/generateRecipeImage";

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json();

        const image =
            await generateRecipeImage(
                Number(body.recipeId)
            );

        return NextResponse.json({
            success: true,
            image,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                error:
                    error?.message ??
                    String(error),
            },
            {
                status: 500,
            }
        );
    }
}