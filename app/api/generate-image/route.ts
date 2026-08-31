export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
    request: Request
) {
    try {
        const body = await request.json();

        const recipeId = Number(
            body.recipeId
        );

        if (!recipeId) {
            return NextResponse.json(
                {
                    error: "Recipe ID required",
                },
                {
                    status: 400,
                }
            );
        }

        const recipe =
            await prisma.recipe.findUnique({
                where: {
                    id: recipeId,
                },
            });

        if (!recipe) {
            return NextResponse.json(
                {
                    error: "Recipe not found",
                },
                {
                    status: 404,
                }
            );
        }

        if (!recipe.imagePrompt) {
            return NextResponse.json(
                {
                    error:
                        "Recipe does not contain an image prompt",
                },
                {
                    status: 400,
                }
            );
        }

        const imageResponse =
            await openai.images.generate({
                model: "gpt-image-1",

                prompt:
                    recipe.imagePrompt,

                size: "1024x1024",
            });

        const base64Image =
            imageResponse.data?.[0]
                ?.b64_json;

        if (!base64Image) {
            throw new Error(
                "Image generation failed"
            );
        }

        const buffer = Buffer.from(
            base64Image,
            "base64"
        );

        const generatedDir =
            path.join(
                process.cwd(),
                "public",
                "generated"
            );

        await fs.mkdir(
            generatedDir,
            {
                recursive: true,
            }
        );

        const filename =
            `${recipe.id}.png`;

        const filepath =
            path.join(
                generatedDir,
                filename
            );

        await fs.writeFile(
            filepath,
            buffer
        );

        const imagePath =
            `/generated/${filename}`;

        const updatedRecipe =
            await prisma.recipe.update({
                where: {
                    id: recipe.id,
                },

                data: {
                    image: imagePath,
                },
            });

        return NextResponse.json(
            {
                success: true,
                image: imagePath,
                recipe:
                    updatedRecipe,
            },
            {
                status: 200,
            }
        );
    } catch (error: any) {
        console.error(
            "GENERATE IMAGE ERROR:",
            error
        );

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