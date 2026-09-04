import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import * as cheerio from "cheerio";

const OPENAI_URL = "https://api.openai.com/v1/responses";

function truncate(str: string, max = 15000) {
  if (!str) return "";
  if (str.length <= max) return str;
  return str.slice(0, max);
}

function extractResponseText(aiJson: any): string | null {
  try {
    if (aiJson?.output && Array.isArray(aiJson.output) && aiJson.output.length > 0) {
      let texts: string[] = [];
      for (const out of aiJson.output) {
        const content = out?.content;
        if (!content) continue;
        if (typeof content === "string") {
          texts.push(content);
          continue;
        }
        if (Array.isArray(content)) {
          for (const c of content) {
            if (!c) continue;
            if (typeof c === "string") {
              texts.push(c);
              continue;
            }
            if (c.type === "output_text" && c.text) texts.push(c.text);
            else if (c.type === "message" && Array.isArray(c.content)) {
              for (const m of c.content) {
                if (m?.type === "output_text" && m?.text) texts.push(m.text);
              }
            } else if (c.text) texts.push(c.text);
          }
        } else if (content?.type === "output_text" && content?.text) {
          texts.push(content.text);
        } else if (content?.text) {
          texts.push(content.text);
        }
      }
      const joined = texts.join("\n").trim();
      if (joined) return joined;
    }

    const fallback = aiJson?.choices?.[0]?.message?.content ?? aiJson?.choices?.[0]?.text;
    return fallback ? String(fallback).trim() : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: "Unable to fetch URL" }, { status: 400 });

    const html = await response.text();
    const $ = cheerio.load(html);

    let recipeData: any = null;
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonText = $(element).html();
        if (!jsonText) return;
        const parsed = JSON.parse(jsonText);
        let data: any[] = [];
        if (Array.isArray(parsed)) data = parsed;
        else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) data = parsed['@graph'];
        else data = [parsed];
        if (parsed.mainEntity) data.push(parsed.mainEntity);
        const found = data.find((item) => {
          const type = item?.['@type'] ?? item?.type;
          if (!type) return false;
          if (Array.isArray(type)) return type.includes('Recipe');
          return type === 'Recipe' || type === 'http://schema.org/Recipe';
        });
        if (found) recipeData = found;
      } catch {
        /* ignore */
      }
    });

    const pageTitle = recipeData?.name || $("title").text().trim() || "";
    const metaDesc = recipeData?.description ?? $("meta[name='description']").attr("content") ?? "";
    const pageText = ($("main").text() || $("article").text() || $("body").text() || "").replace(/\s+/g, " ").trim();

    const contentForAI = truncate(
      JSON.stringify({ url, title: pageTitle, description: metaDesc, jsonld: recipeData || undefined, snippet: pageText })
    );

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });

    const systemPrompt = `You are an assistant that extracts recipes from web pages. Given a web page (HTML/text/JSON-LD snippet), return a single JSON object with these fields: title (string), description (string), image (string URL or empty), ingredients (array of strings, plain lines, no bullets), instructions (array of strings, only the full recipe steps), servings (number or null), notes (string or empty). Only return valid JSON (no surrounding text). Prefer the "Full Recipe" section and any recipe notes; if not found, use the main instructions. Clean up headings and remove unrelated labels.`;

    const userContent = `Page content (truncated):\n${contentForAI}\n\nReturn JSON only.`;

    const aiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_output_tokens: 4000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return NextResponse.json({ error: "OpenAI error", detail: errText }, { status: 502 });
    }

    const aiJson = await aiRes.json();
    const reply = extractResponseText(aiJson);
    if (!reply) return NextResponse.json({ error: "No response from OpenAI" }, { status: 502 });

    const cleaned = String(reply).replace(/^[`\n\s]*```(?:json)?\n?/, "").replace(/\n?```[\s`]*$/, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 });
    }

    const title = parsed.title ?? pageTitle ?? "Imported Recipe";
    const description = parsed.description ?? metaDesc ?? "";
    const image = parsed.image ?? "";
    const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients.join("\n") : parsed.ingredients ?? "";
    const instructions = Array.isArray(parsed.instructions) ? parsed.instructions.join("\n") : parsed.instructions ?? "";
    const servings = parsed.servings ? Number(parsed.servings) : null;
    const notes = parsed.notes ?? "";

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        image,
        ingredients,
        instructions: instructions + (notes ? "\n\nNotes:\n" + notes : ""),
        servings,
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error: any) {
    console.error("IMPORT ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
