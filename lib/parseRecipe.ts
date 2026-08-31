export function parseRecipe(text: string) {
    const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    let ingredients: string[] = [];
    let instructions: string[] = [];

    let mode: "ingredients" | "instructions" | "" = "";

    for (const line of lines) {
        const lower = line.toLowerCase();

        if (
            lower.includes("ingredients") ||
            lower === "ingredient"
        ) {
            mode = "ingredients";
            continue;
        }

        if (
            lower.includes("method") ||
            lower.includes("instructions") ||
            lower.includes("directions")
        ) {
            mode = "instructions";
            continue;
        }

        if (mode === "ingredients") {
            ingredients.push(`• ${line}`);
        }

        if (mode === "instructions") {
            instructions.push(
                `${instructions.length + 1}. ${line}`
            );
        }
    }

    return {
        ingredients: ingredients.join("\n"),
        instructions: instructions.join("\n"),
    };
}