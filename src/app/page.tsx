import { getPrompts } from '@/lib/data';
import PromptPage from '@/components/prompt-page';

export default async function Home() {
  const prompts = await getPrompts();
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <PromptPage initialPrompts={prompts} />
    </main>
  );
}
