import { prisma } from "../../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    console.log("[EXPORT API] POST hit for id =", id);

    const recipeId = Number(id);

    if (!id || Number.isNaN(recipeId)) {
        return NextResponse.json(
            {
                error: "Invalid recipe id",
                received: id,
            },
            { status: 400 }
        );
    }

    const email = process.env.OURGROCERIES_EMAIL;
    const password = process.env.OURGROCERIES_PASSWORD;
    const envListId = process.env.OURGROCERIES_LIST_ID;

    if (!email || !password) {
        return NextResponse.json(
            {
                error:
                    "OURGROCERIES_EMAIL and OURGROCERIES_PASSWORD must be configured",
            },
            { status: 500 }
        );
    }

    try {
        //
        // LOAD RECIPE
        //
        const recipe = await prisma.recipe.findUnique({
            where: {
                id: recipeId,
            },
        });

        if (!recipe) {
            return NextResponse.json(
                { error: "Recipe not found" },
                { status: 404 }
            );
        }

        //
        // LOGIN
        //
        console.log("[EXPORT API] Logging in");

        const loginForm = new URLSearchParams();

        loginForm.append("emailAddress", email);
        loginForm.append("password", password);
        loginForm.append("action", "sign-in");

        const loginResponse = await fetch(
            "https://www.ourgroceries.com/sign-in",
            {
                method: "POST",
                redirect: "manual",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                },
                body: loginForm.toString(),
            }
        );

        console.log(
            "[EXPORT API] Login status:",
            loginResponse.status
        );

        console.log(
            "[EXPORT API] Redirect:",
            loginResponse.headers.get("location")
        );

        const setCookieHeader =
            loginResponse.headers.get("set-cookie") ?? "";

        console.log(
            "[EXPORT API] Set Cookie:",
            setCookieHeader
        );

        const cookieMatch = setCookieHeader.match(
            /ourgroceries-auth=([^;]+)/
        );

        const sessionCookie = cookieMatch?.[1];

        if (!sessionCookie) {
            return NextResponse.json(
                {
                    error:
                        "Login succeeded but no auth cookie was found",
                    status: loginResponse.status,
                },
                { status: 502 }
            );
        }

        console.log(
            "[EXPORT API] Authenticated successfully"
        );

        //
        // LOAD LIST PAGE
        //
        const listsResponse = await fetch(
            "https://www.ourgroceries.com/your-lists",
            {
                headers: {
                    Cookie:
                        `ourgroceries-auth=${sessionCookie}`,
                },
            }
        );

        const listsHtml = await listsResponse.text();

        console.log(
            "[EXPORT API] g_teamId:",
            listsHtml.includes("g_teamId")
        );

        //
        // EXTRACT TEAM ID
        //
        const teamMatch = listsHtml.match(
            /g_teamId = "(.*?)";/
        );

        const teamId = teamMatch?.[1];

        console.log(
            "[EXPORT API] teamId:",
            teamId
        );

        //
        // EXTRACT MASTER LIST
        //
        const masterMatch = listsHtml.match(
            /g_masterListUrl = "\/your-lists\/list\/([^"]+)"/
        );

        const masterListId = masterMatch?.[1];

        console.log(
            "[EXPORT API] masterListId:",
            masterListId
        );

        //
        // EXTRACT CATEGORY LIST
        //
        let categoryId: string | undefined;

        const metalistMatch = listsHtml.match(
            /g_staticMetalist = (\[[\s\S]*?\]);/
        );

        if (metalistMatch) {
            try {
                const meta = JSON.parse(metalistMatch[1]);

                const categoryList = meta.find(
                    (x: any) => x.listType === "CATEGORY"
                );

                categoryId = categoryList?.id;
            } catch (err) {
                console.warn(
                    "[EXPORT API] Failed parsing metalist",
                    err
                );
            }
        }

        console.log(
            "[EXPORT API] categoryId:",
            categoryId
        );

        //
        // CREATE LIST
        //
        const createPayload = {
            command: "createList",
            name: recipe.title,
            listType: "RECIPE",
            locale: "en-US",
            shareId: null,
            teamId,
        };

        if (teamId) {
            createPayload.teamId = teamId;
        }

        const apiHeaders = {
            "Content-Type": "application/json; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Origin": "https://www.ourgroceries.com",
            "Referer": "https://www.ourgroceries.com/your-lists",
            "Cookie": `ourgroceries-auth=${sessionCookie}`,
        };

        console.log(
            "[EXPORT API] Creating list:",
            createPayload
        );

        const createResponse = await fetch(
            "https://www.ourgroceries.com/your-lists",
            {
                method: "POST",
                headers: apiHeaders,
                body: JSON.stringify(createPayload),
            }
        );

        console.log(
            "[EXPORT API] create status:",
            createResponse.status
        );

        console.log(
            "[EXPORT API] create location:",
            createResponse.headers.get("location")
        );

        const createResponseText =
            await createResponse.text();

        console.log(
            "[EXPORT API] create body:",
            createResponseText
        );

        const responseText = createResponseText

        console.log(
            "[EXPORT API] createList raw response:",
            responseText
        );

        let createJson: any = {};

        try {
            createJson = JSON.parse(responseText);
        } catch {
            createJson = { rawResponse: responseText };
        }

        console.log(
            "[EXPORT API] createList result:",
            createJson
        );

        const createdListId =
            createJson?.id ??
            createJson?.listId ??
            createJson?.uid ??
            createJson?.result?.id ??
            envListId ??
            masterListId;

        if (!createdListId) {
            return NextResponse.json(
                {
                    error:
                        "Could not determine created list id",
                    response: createJson,
                },
                { status: 502 }
            );
        }

        //
        // BUILD ITEMS
        //
        const items = (recipe.ingredients ?? "")
            .split("\n")
            .map((line) =>
                line.replace(/^\s*[•*-]\s*/, "").trim()
            )
            .filter(Boolean);

        console.log(
            `[EXPORT API] Exporting ${items.length} items`
        );

        //
        // IMPORT ITEMS
        //
        const importPayload = {
            command: "importItems",
            listId: createdListId,
            preview: false,
            files: [
                items.join("\n")
            ],
            locale: "en-US",
            shareId: null,
            teamId,
        };

        console.log(
            "[EXPORT API] import payload:",
            JSON.stringify(importPayload, null, 2)
        );

        const importResponse = await fetch(
            "https://www.ourgroceries.com/your-lists",
            {
                method: "POST",
                headers: apiHeaders,
                body: JSON.stringify(importPayload),
            }
        );

        const importBody = await importResponse.text();

        console.log(
            "[EXPORT API] import status:",
            importResponse.status
        );

        console.log(
            "[EXPORT API] import body:",
            importBody
        );

        if (!importResponse.ok) {
            return NextResponse.json(
                {
                    error: "Import failed",
                    detail: importBody,
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Exported to OurGroceries",
            listId: createdListId,
            itemCount: items.length,
        });
    } catch (err) {
        console.error("[EXPORT API] ERROR", err);

        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : String(err),
            },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    return NextResponse.json({
        ok: true,
        id,
        numericId: Number(id),
    });
}