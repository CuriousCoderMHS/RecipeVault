import "./globals.css";

export const metadata = {
    title: "RecipeVault",
    description: "Self-hosted recipe manager",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}