import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function ArticlePage() {
  const [, params] = useRoute('/articles/:slug');
  const slug = params?.slug;
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ['/api/articles', slug],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${slug}`);
      if (!res.ok) throw new Error('Article not found');
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!article || !contentRef.current) return;

    const container = contentRef.current;
    container.innerHTML = '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;

    const scripts = tempDiv.querySelectorAll('script');
    const nonScriptContent = tempDiv.innerHTML.replace(/<script[\s\S]*?<\/script>/gi, '');
    
    if (nonScriptContent.trim()) {
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = nonScriptContent;
      container.appendChild(contentDiv);
    }

    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.src) {
        newScript.src = oldScript.src;
        newScript.async = true;
      } else if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      container.appendChild(newScript);
    });
  }, [article]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading article...</div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold text-destructive">Article Not Found</h2>
              <p className="text-muted-foreground mt-2">The article you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          {article.coverImage && (
            <div className="w-full h-64 overflow-hidden rounded-t-lg">
              <img 
                src={article.coverImage} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{article.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={contentRef}
              className="prose prose-invert max-w-none"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
