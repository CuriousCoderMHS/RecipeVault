import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export async function PUT(
    request: Request,
    { params }: Props
) {
    const { id } = await params;
    const body = await request.json();

    const recipe = await prisma.recipe.update({
        where: {
            id: Number(id),
        },
        data: {
            title: body.title,
            description: body.description,
            category: body.category,
            cuisine: body.cuisine,
            imagePrompt: body.imagePrompt,
            ingredients: body.ingredients,
            instructions: body.instructions,
            image: body.image,
            servings: body.servings,
        }
    });

    return NextResponse.json(recipe);
}

export async function DELETE(
    request: Request,
    { params }: Props
) {
    const { id } = await params;

    await prisma.recipe.delete({
        where: {
            id: Number(id),
        },
    });

    return NextResponse.json({
        success: true,
    });
}