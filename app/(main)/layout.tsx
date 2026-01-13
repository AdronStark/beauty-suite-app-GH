import Header from "@/components/shared/Header";
import IntroAnimation from "@/components/shared/IntroAnimation";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <IntroAnimation />
            <Header />
            <main style={{ paddingTop: 'var(--header-height)' }}>
                {children}
            </main>
        </>
    );
}
