import './globals.css';

export const metadata = {
  title: 'Offline Flashcard Builder — Study Smarter',
  description: 'Create, organize, and study flashcards with spaced repetition — fully offline, no account needed.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
