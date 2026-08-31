export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import heicConvert from "heic-convert";



export async function POST(request: Request) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const formData = await request.formData();

        const file = formData.get(
            "image"
        ) as File | null;

        if (!file) {
            return NextResponse.json(
                {
                    error: "No image provided",
                },
                {
                    status: 400,
                }
            );
        }

        const arrayBuffer =
            await file.arrayBuffer();

        let imageBuffer =
            Buffer.from(arrayBuffer);

        const lowerName =
            file.name.toLowerCase();

        // HEIC → JPEG

        if (
            lowerName.endsWith(".heic") ||
            lowerName.endsWith(".heif")
        ) {
            const converted =
                await heicConvert({
                    buffer: imageBuffer,
                    format: "JPEG",
                    quality: 0.9,
                });

            imageBuffer =
                Buffer.from(converted);
        }

        // Image optimisation

        imageBuffer = await sharp(
            imageBuffer
        )
            .resize({
                width: 2000,
                withoutEnlargement: true,
            })
            .jpeg({
                quality: 90,
            })
            .normalize()
            .sharpen()
            .toBuffer();

        const base64Image =
            imageBuffer.toString("base64");

        const response =
            await openai.responses.create({
                model: "gpt-5",

                input: [
                    {
                        role: "user",

                        content: [
                            {
                                type: "input_text",

                                text: `
Extract the recipe from this image.

Return ONLY valid JSON.

{
  "title": "",
  "description": "",
  "category": "",
  "cuisine": "",
  "servings": 0,
  "imagePrompt": "",
  "ingredients": [],
  "instructions": []
}

Requirements:

- ingredients must contain ONLY quantity and ingredient names
- remove preparation details from ingredients

Examples:

"1 onion, finely chopped"
→ "1 onion"

"2 carrots, grated"
→ "2 carrots"

Move preparation details into instructions.

Instructions should be complete cooking steps.

imagePrompt should be a detailed photorealistic food photography prompt describing the FINISHED dish.

imagePrompt rules:

- no text
- no captions
- no watermarks
- professional food photography
- cookbook quality
- appetising
- plated and ready to serve

Return JSON only.
`,
                            },
                            {
                                type: "input_image",
                                image_url: `data:image/jpeg;base64,${base64Image}`,
                                detail: "high",
                            }
                        ],
                    },
                ],
            });

        const output =
            response.output_text?.trim() ?? "";

        let recipeData: any;

        try {
            recipeData = JSON.parse(output);
        } catch {
            const start =
                output.indexOf("{");

            const end =
                output.lastIndexOf("}");

            if (
                start === -1 ||
                end === -1
            ) {
                throw new Error(
                    "Vision did not return valid JSON"
                );
            }

            recipeData = JSON.parse(
                output.slice(
                    start,
                    end + 1
                )
            );
        }

        const ingredients =
            (
                recipeData.ingredients ??
                []
            )
                .filter(Boolean)
                .map(
                    (ingredient: string) =>
                        `• ${ingredient.trim()}`
                )
                .join("\n");

        const instructions =
            (
                recipeData.instructions ??
                []
            )
                .filter(Boolean)
                .map(
                    (
                        step: string,
                        index: number
                    ) =>
                        `${index + 1}. ${step.trim()}`
                )
                .join("\n");

        return NextResponse.json({
            title:
                recipeData.title ||
                file.name.replace(
                    /\.[^/.]+$/,
                    ""
                ),

            description:
                recipeData.description ??
                "",

            category:
                recipeData.category ??
                "",

            cuisine:
                recipeData.cuisine ??
                "",

            servings:
                Number(
                    recipeData.servings
                ) || 4,

            imagePrompt:
                recipeData.imagePrompt ??
                "",

            ingredients,
            instructions,
        });
    } catch (error: any) {
        console.error(
            "IMPORT PHOTO ERROR:",
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