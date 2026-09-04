import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

import {
    generateRecipeImage,
} from "../../../lib/generateRecipeImage";

export async function GET(request: Request) {
    // Support server-side filtering via query params: keywords, servings, samLikes, harrietLikes
    // Example: /api/recipes?keywords=chicken&servings=4&samLikes=true
    const url = new URL(request.url);
    const keywords = url.searchParams.get("keywords")?.trim() ?? "";
    const servingsParam = url.searchParams.get("servings");
    const samLikesParam = url.searchParams.get("samLikes");
    const harrietLikesParam = url.searchParams.get("harrietLikes");
    const favouriteParam = url.searchParams.get("favourite");

    const where: any = {};

    if (servingsParam) {
        const n = Number(servingsParam);
        if (!Number.isNaN(n)) where.servings = n;
    }

    if (samLikesParam === "true") where.samLikes = true;
    if (harrietLikesParam === "true") where.harrietLikes = true;
    if (favouriteParam === "true") where.favourite = true;

    if (keywords) {
        const kw = keywords;
        where.OR = [
            { title: { contains: kw, mode: "insensitive" } },
            { description: { contains: kw, mode: "insensitive" } },
            { category: { contains: kw, mode: "insensitive" } },
            { cuisine: { contains: kw, mode: "insensitive" } },
            { imagePrompt: { contains: kw, mode: "insensitive" } },
            { ingredients: { contains: kw, mode: "insensitive" } },
            { instructions: { contains: kw, mode: "insensitive" } },
        ];
    }

    const recipes = await prisma.recipe.findMany({ where, orderBy: { createdAt: "desc" } });

    return NextResponse.json(recipes);
}

export async function POST(
    request: Request
) {
    const body =
        await request.json();

    const recipe =
        await prisma.recipe.create({
            data: {
                title: body.title,
                description:
                    body.description,
                category:
                    body.category,
                cuisine:
                    body.cuisine,
                imagePrompt:
                    body.imagePrompt,
                ingredients:
                    body.ingredients,
                instructions:
                    body.instructions,
                image: body.image,
                    servings:
                        body.servings,
                    samLikes: body.samLikes ?? false,
                    harrietLikes: body.harrietLikes ?? false,
                    favourite: body.favourite ?? false,
            },
        });

    if (recipe.imagePrompt) {
        generateRecipeImage(
            recipe.id
        ).catch(console.error);
    }

    return NextResponse.json(
        recipe
    );
}