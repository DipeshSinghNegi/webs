// src/app/page.tsx
export default function Home() {
return (
<main className="card">
<h1 style={{ marginBottom: 8 }}>Welcome</h1>
<p>
Go to <a href="/upload">Upload</a> to send a photo, then see it live in <a href="/main">Main</a>.
</p>
<p className="mono" style={{ opacity: .7, marginTop: 12 }}>
API: {process.env.NEXT_PUBLIC_API_BASE}
</p>
</main>
);
}