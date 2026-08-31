import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const recipes = await prisma.recipe.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });

    return NextResponse.json(recipes);
}

export async function POST(request: Request) {
    const body = await request.json();

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
            },
        });

    fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-image`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                recipeId: recipe.id,
            }),
        }
    ).catch(console.error);

    return NextResponse.json(recipe);
}