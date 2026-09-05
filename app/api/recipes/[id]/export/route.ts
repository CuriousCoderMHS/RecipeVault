import { prisma } from "../../../../../lib/prisma";
import { NextResponse } from "next/server";

// POST /api/recipes/:id/export
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;

    console.log("[EXPORT API] POST hit for id=", id);

    const email = process.env.OURGROCERIES_EMAIL;
    const password = process.env.OURGROCERIES_PASSWORD;
    const envListId = process.env.OURGROCERIES_LIST_ID;

    if (!email || !password) {
        return NextResponse.json({ error: "OURGROCERIES_EMAIL and OURGROCERIES_PASSWORD must be set in environment" }, { status: 500 });
    }

    try {
        const recipe = await prisma.recipe.findUnique({ where: { id: Number(id) } });
        if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

        const BASE_URL = "https://www.ourgroceries.com";
        const SIGN_IN = `${BASE_URL}/sign-in`;
        const YOUR_LISTS = `${BASE_URL}/your-lists/`;
        const COOKIE_KEY = "ourgroceries-auth";

        // 1) sign-in (form POST)
        console.log("[EXPORT API] signing in to OurGroceries as", email);
        const form = new URLSearchParams();
        form.append("emailAddress", String(email));
        form.append("password", String(password));
        form.append("action", "sign-in");

        const signRes = await fetch(SIGN_IN, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: form.toString(),
        });

        // extract session cookie from Set-Cookie header
        const setCookieHeader = signRes.headers.get("set-cookie") || "";
        let sessionCookie: string | null = null;
        if (setCookieHeader) {
            const m = setCookieHeader.match(new RegExp(`${COOKIE_KEY}=([^;]+)`));
            if (m) sessionCookie = m[1];
        }

        if (!sessionCookie) {
            const txt = await signRes.text();
            console.error("[EXPORT API] sign-in did not return session cookie", signRes.status, txt);
            return NextResponse.json({ error: "Login failed: no session cookie returned", detail: txt }, { status: 502 });
        }

        // 2) GET /your-lists/ to extract team/master ids
        const listsRes = await fetch(YOUR_LISTS, { headers: { Cookie: `${COOKIE_KEY}=${sessionCookie}` } });
        const listsText = await listsRes.text();

        const teamMatch = listsText.match(/g_teamId = "(.*)";/);
        const teamId = teamMatch ? teamMatch[1] : undefined;

        const masterMatch = listsText.match(/g_masterListUrl = "\/your-lists\/list\/(\S*)"/);
        const masterListId = masterMatch ? masterMatch[1] : undefined;

        const metalistMatch = listsText.match(/g_staticMetalist = (\[([\s\S]*?)\]);/);
        let categoryId: string | undefined = undefined;
        if (metalistMatch) {
            try {
                const arr = JSON.parse(metalistMatch[1]);
                const categoryList = arr.find((l: any) => l.listType === "CATEGORY");
                if (categoryList) categoryId = categoryList.id;
            } catch {
                // ignore
            }
        }

        // prepare items
        const itemsArr = (recipe.ingredients || "")
            .split("\n")
            .map((l) => l.replace(/^\s*•\s*/, "").trim())
            .filter((l) => l !== "");

        // 3) create list via command=createList
        const createPayload: any = { command: "createList", name: recipe.title };
        if (teamId) createPayload.teamId = teamId;
        if (categoryId) createPayload.listType = "LIST";

        const postHeaders: any = { "Content-Type": "application/json" };
        postHeaders["Cookie"] = `${COOKIE_KEY}=${sessionCookie}`;

        const createRes = await fetch(YOUR_LISTS, { method: "POST", headers: postHeaders, body: JSON.stringify(createPayload) });
        let createdJson: any = {};
        try {
            createdJson = await createRes.json();
        } catch (e) {
            const txt = await createRes.text();
            console.warn("create list returned non-json:", txt);
        }

        const newListId = createdJson?.id ?? createdJson?.listId ?? createdJson?.uid ?? createdJson?.result?.id ?? envListId ?? masterListId;
        if (!newListId && !envListId && !masterListId) {
            return NextResponse.json({ error: "Could not determine created list id" }, { status: 502 });
        }

        const targetListId = newListId ?? envListId ?? masterListId;

        // 4) insert items via command=insertItems
        const payloadItems = itemsArr.map((v) => ({ listId: targetListId, value: v }));
        const insertPayload = { command: "insertItems", items: payloadItems };

        const insertRes = await fetch(YOUR_LISTS, { method: "POST", headers: postHeaders, body: JSON.stringify(insertPayload) });
        if (!insertRes.ok) {
            const text = await insertRes.text();
            console.error("insert items error:", insertRes.status, text);
            return NextResponse.json({ error: "Failed to insert items", detail: text }, { status: 502 });
        }

        return NextResponse.json({ message: "Exported to OurGroceries", listId: targetListId });
    } catch (err: any) {
        console.error("EXPORT ERROR:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

// GET handler for quick route check
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    return NextResponse.json({ ok: true, id: Number(id) });
}