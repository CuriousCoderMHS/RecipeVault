import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import * as cheerio from "cheerio";

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL required" },
                { status: 400 }
            );
        }

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json(
                { error: "Unable to fetch URL" },
                { status: 400 }
            );
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        let recipeData: any = null;

        $('script[type="application/ld+json"]').each((_, element) => {
            try {
                const jsonText = $(element).html();
                if (!jsonText) return;

                const parsed = JSON.parse(jsonText);
                const data = Array.isArray(parsed) ? parsed : [parsed];

                const found = data.find((item) => {
                    const type = item?.["@type"] ?? item?.type;
                    return type === "Recipe";
                });

                if (found) {
                    recipeData = found;
                }
            } catch {
                // ignore invalid JSON
            }
        });

        const title =
            recipeData?.name ||
            $("title").text().trim() ||
            "Imported Recipe";

        const description =
            recipeData?.description ??
            $("meta[name='description']").attr("content") ??
            "";

        // Normalize image field
        let image = "";
        if (Array.isArray(recipeData?.image)) {
            const first = recipeData.image[0];
            image = typeof first === "string" ? first : first?.url || first?.src || "";
        } else if (recipeData?.image && typeof recipeData.image === "object") {
            image = recipeData.image?.url || recipeData.image?.src || "";
        } else {
            image = recipeData?.image ?? "";
        }

        // Ingredients
        const rawIngredients =
            recipeData?.recipeIngredient ??
            recipeData?.ingredients ??
            [];
        const ingredients = Array.isArray(rawIngredients)
            ? rawIngredients.join("\n")
            : String(rawIngredients || "");

        // Instructions - handle strings, objects, arrays
        const rawInstructions = recipeData?.recipeInstructions ?? [];
        const instructions = (Array.isArray(rawInstructions) ? rawInstructions : [rawInstructions])
            .flat()
            .map((step: any) => {
                if (!step && step !== 0) return "";
                if (typeof step === "string") return step;
                if (typeof step === "object") {
                    if (step.text) return step.text;
                    if (step.name) return step.name;
                    // Some sites wrap steps in nested arrays/objects
                    return JSON.stringify(step);
                }
                return String(step);
            })
            .filter(Boolean)
            .join("\n");

        // Servings - try to extract number
        let servings = 4;
        if (recipeData?.recipeYield) {
            const match = String(recipeData.recipeYield).match(/\d+/);
            if (match) {
                const parsed = parseInt(match[0], 10);
                if (!Number.isNaN(parsed) && parsed > 0) servings = parsed;
            }
        }

        const recipe = await prisma.recipe.create({
            data: {
                title,
                description,
                image,
                ingredients,
                instructions,
                servings,
            },
        });

        return NextResponse.json(recipe, { status: 201 });
    } catch (error: any) {
        console.error("IMPORT ERROR:", error);

        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}