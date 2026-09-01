import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    const filePath = path.join(
        process.cwd(),
        "public",
        "generated",
        filename
    );

    try {
        const file = await fs.readFile(filePath);

        return new NextResponse(file, {
            headers: {
                "Content-Type": "image/png",
            },
        });
    } catch {
        return new NextResponse("Not found", {
            status: 404,
        });
    }
}