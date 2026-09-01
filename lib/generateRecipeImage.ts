import { prisma } from "../lib/prisma";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

export async function generateRecipeImage(
    recipeId: number
) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const recipe =
        await prisma.recipe.findUnique({
            where: {
                id: recipeId,
            },
        });

    if (!recipe) {
        throw new Error("Recipe not found");
    }

    if (!recipe.imagePrompt) {
        throw new Error(
            "Recipe does not contain an image prompt"
        );
    }

    const imageResponse =
        await openai.images.generate({
            model: "gpt-image-1",
            prompt: recipe.imagePrompt,
            size: "1024x1024",
        });

    const base64Image =
        imageResponse.data?.[0]?.b64_json;

    if (!base64Image) {
        throw new Error(
            "Image generation failed"
        );
    }

    const buffer = Buffer.from(
        base64Image,
        "base64"
    );

    const generatedDir = path.join(
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

    const imagePath = `/api/images/${filename}`;

    await prisma.recipe.update({
        where: {
            id: recipe.id,
        },
        data: {
            image: imagePath,
        },
    });

    return imagePath;
}