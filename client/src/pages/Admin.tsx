import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  LayoutDashboard, 
  Megaphone, 
  FileText, 
  Users, 
  Star, 
  BarChart3,
  Plus,
  Trash2,
  Save,
  LogOut,
  Flame,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  ExternalLink,
  Bot
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

const ADMIN_PASSWORD_HASH = 'U3BsaW50ZXJLaGF5cm9EYXJrRFowMDMzNiM=';

async function adminApiRequest(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...options,
    headers: { 
      "Content-Type": "application/json", 
      "X-Admin-Auth": ADMIN_PASSWORD_HASH,
      ...options?.headers 
    },
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return await res.json();
}

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_unlocked');
    if (saved === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    const encoded = btoa(password);
    if (encoded === ADMIN_PASSWORD_HASH) {
      setIsUnlocked(true);
      sessionStorage.setItem('admin_unlocked', 'true');
      toast({ description: 'Access granted!' });
    } else {
      toast({ title: 'Access Denied', description: 'Incorrect password', variant: 'destructive' });
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('admin_unlocked');
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder="Enter admin password"
                  data-testid="input-admin-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleUnlock} className="w-full" data-testid="button-unlock">
              Unlock
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/'} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <Badge variant="outline" className="text-primary border-primary">
              Super Admin
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleLock}>
              <Lock className="w-4 h-4 mr-2" />
              Lock
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full max-w-3xl mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="bot" className="flex items-center gap-1">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Bot</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-1">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Ads</span>
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Articles</span>
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Featured</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Admins</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <VisitorStatsPanel />
          </TabsContent>

          <TabsContent value="bot">
            <BotSettingsPanel />
          </TabsContent>

          <TabsContent value="ads">
            <AdsPanel />
          </TabsContent>

          <TabsContent value="articles">
            <ArticlesPanel />
          </TabsContent>

          <TabsContent value="featured">
            <FeaturedTokensPanel />
          </TabsContent>

          <TabsContent value="admins">
            <AdminsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface VisitorStats {
  today: number;
  week: number;
  month: number;
  year: number;
  total: number;
}

function VisitorStatsPanel() {
  const { data: stats, isLoading } = useQuery<VisitorStats>({
    queryKey: ['/api/admin/visitor-stats'],
    queryFn: () => adminApiRequest('/api/admin/visitor-stats'),
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{stats?.today || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{stats?.week || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{stats?.month || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">This Year</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{stats?.year || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{stats?.total || 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface Ad {
  id: number;
  position: string;
  contentType: string;
  content: string;
  isActive: boolean;
}

function AdsPanel() {
  const { toast } = useToast();
  const { data: ads, isLoading } = useQuery<Ad[]>({ 
    queryKey: ['/api/admin/ads'],
    queryFn: () => adminApiRequest('/api/admin/ads'),
  });
  const [newAd, setNewAd] = useState({
    position: 'top',
    contentType: 'html',
    content: '',
    isActive: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApiRequest('/api/admin/ads', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
      toast({ description: 'Ad created successfully' });
      setNewAd({ position: 'top', contentType: 'html', content: '', isActive: true });
    },
    onError: () => {
      toast({ description: 'Failed to create ad', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiRequest(`/api/admin/ads/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
      toast({ description: 'Ad deleted' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApiRequest(`/api/admin/ads/${id}`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Ad (HTML/CSS/JS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Position</Label>
              <Select value={newAd.position} onValueChange={(v) => setNewAd({ ...newAd, position: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="popup">Popup (Center)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content Type</Label>
              <Select value={newAd.contentType} onValueChange={(v) => setNewAd({ ...newAd, contentType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="html">HTML/CSS/JS</SelectItem>
                  <SelectItem value="image">Image URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newAd.isActive}
                  onCheckedChange={(v) => setNewAd({ ...newAd, isActive: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <div>
            <Label>Content (supports HTML, CSS, and JavaScript)</Label>
            <Textarea
              value={newAd.content}
              onChange={(e) => setNewAd({ ...newAd, content: e.target.value })}
              placeholder={`<script>
  // Your JavaScript ad code here
  console.log('Ad loaded');
</script>
<div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 8px;">
  <p style="color: #22c55e;">Your ad content</p>
</div>`}
              className="min-h-[150px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: &lt;script&gt;...your ad script...&lt;/script&gt;
            </p>
          </div>
          <Button 
            onClick={() => createMutation.mutate(newAd)} 
            disabled={createMutation.isPending || !newAd.content.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Create Ad
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Ads ({ads?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : !ads?.length ? (
            <p className="text-muted-foreground text-center py-8">No ads yet</p>
          ) : (
            <div className="space-y-4">
              {ads?.map((ad: any) => (
                <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Badge variant={ad.isActive ? 'default' : 'secondary'}>{ad.position}</Badge>
                    <pre className="text-xs text-muted-foreground truncate max-w-xs bg-muted/50 p-2 rounded">
                      {ad.content.slice(0, 80)}...
                    </pre>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ad.isActive}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: ad.id, isActive: checked })}
                    />
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(ad.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string | null;
  isPublished: boolean;
  createdAt: string;
}

function ArticlesPanel() {
  const { toast } = useToast();
  const { data: articles, isLoading } = useQuery<Article[]>({ 
    queryKey: ['/api/admin/articles'],
    queryFn: () => adminApiRequest('/api/admin/articles'),
  });
  const [newArticle, setNewArticle] = useState({
    title: '',
    slug: '',
    content: '',
    coverImage: '',
    isPublished: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApiRequest('/api/admin/articles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      toast({ description: 'Article created' });
      setNewArticle({ title: '', slug: '', content: '', coverImage: '', isPublished: false });
    },
    onError: () => {
      toast({ description: 'Failed to create article', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiRequest(`/api/admin/articles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      toast({ description: 'Article deleted' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      adminApiRequest(`/api/admin/articles/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ isPublished, publishedAt: isPublished ? new Date().toISOString() : null }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
    },
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Article (HTML/CSS/JS supported)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newArticle.title}
                onChange={(e) => setNewArticle({ 
                  ...newArticle, 
                  title: e.target.value,
                  slug: generateSlug(e.target.value)
                })}
                placeholder="Article title"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={newArticle.slug}
                onChange={(e) => setNewArticle({ ...newArticle, slug: e.target.value })}
                placeholder="article-slug"
              />
            </div>
          </div>
          <div>
            <Label>Cover Image URL</Label>
            <Input
              value={newArticle.coverImage}
              onChange={(e) => setNewArticle({ ...newArticle, coverImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label>Content (HTML/CSS/JS)</Label>
            <Textarea
              value={newArticle.content}
              onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
              placeholder="<article><h1>Title</h1><p>Content...</p></article>"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={newArticle.isPublished}
              onCheckedChange={(checked) => setNewArticle({ ...newArticle, isPublished: checked })}
            />
            <Label>Publish immediately</Label>
          </div>
          <Button 
            onClick={() => createMutation.mutate(newArticle)} 
            disabled={createMutation.isPending || !newArticle.title.trim() || !newArticle.content.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Create Article
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Articles ({articles?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : !articles?.length ? (
            <p className="text-muted-foreground text-center py-8">No articles yet</p>
          ) : (
            <div className="space-y-4">
              {articles?.map((article: any) => (
                <div key={article.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Badge variant={article.isPublished ? 'default' : 'secondary'}>
                        {article.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      <p className="font-medium">{article.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMutation.mutate({ id: article.id, isPublished: !article.isPublished })}
                      >
                        {article.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(article.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <a 
                    href={`/articles/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-sm font-mono bg-primary/10 px-3 py-2 rounded-lg w-fit"
                  >
                    <ExternalLink className="w-4 h-4" />
                    /articles/{article.slug}
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FeaturedToken {
  id: number;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  priority: number;
}

function FeaturedTokensPanel() {
  const { toast } = useToast();
  const { data: tokens, isLoading } = useQuery<FeaturedToken[]>({ 
    queryKey: ['/api/admin/featured-tokens'],
    queryFn: () => adminApiRequest('/api/admin/featured-tokens'),
  });
  const [newToken, setNewToken] = useState({
    contractAddress: '',
    tokenName: '',
    tokenSymbol: '',
    imageUrl: '',
    dexscreenerUrl: '',
    displayOrder: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApiRequest('/api/admin/featured-tokens', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-tokens'] });
      toast({ description: 'Featured token added - will appear with fire icon!' });
      setNewToken({ contractAddress: '', tokenName: '', tokenSymbol: '', imageUrl: '', dexscreenerUrl: '', displayOrder: 0 });
    },
    onError: () => {
      toast({ description: 'Failed to add token', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiRequest(`/api/admin/featured-tokens/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-tokens'] });
      toast({ description: 'Featured token removed' });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            Add Featured Token (Appears First with Fire Icon)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Contract Address</Label>
              <Input
                value={newToken.contractAddress}
                onChange={(e) => setNewToken({ ...newToken, contractAddress: e.target.value })}
                placeholder="Token contract address"
              />
            </div>
            <div>
              <Label>Token Symbol</Label>
              <Input
                value={newToken.tokenSymbol}
                onChange={(e) => setNewToken({ ...newToken, tokenSymbol: e.target.value })}
                placeholder="e.g. SOL"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Token Name</Label>
              <Input
                value={newToken.tokenName}
                onChange={(e) => setNewToken({ ...newToken, tokenName: e.target.value })}
                placeholder="e.g. Solana"
              />
            </div>
            <div>
              <Label>Display Order (lower = first)</Label>
              <Input
                type="number"
                value={newToken.displayOrder}
                onChange={(e) => setNewToken({ ...newToken, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Image URL</Label>
              <Input
                value={newToken.imageUrl}
                onChange={(e) => setNewToken({ ...newToken, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>DexScreener URL</Label>
              <Input
                value={newToken.dexscreenerUrl}
                onChange={(e) => setNewToken({ ...newToken, dexscreenerUrl: e.target.value })}
                placeholder="https://dexscreener.com/..."
              />
            </div>
          </div>
          <Button 
            onClick={() => createMutation.mutate(newToken)} 
            disabled={createMutation.isPending || !newToken.contractAddress.trim() || !newToken.tokenSymbol.trim()}
          >
            <Flame className="w-4 h-4 mr-2" />
            Add Featured Token
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Featured Tokens ({tokens?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : !tokens?.length ? (
            <p className="text-muted-foreground text-center py-8">No featured tokens yet</p>
          ) : (
            <div className="space-y-4">
              {tokens?.map((token: any) => (
                <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg border-orange-500/30">
                  <div className="flex items-center gap-4">
                    <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                    <div>
                      <p className="font-medium">{token.tokenSymbol}</p>
                      <p className="text-sm text-muted-foreground">{token.tokenName}</p>
                    </div>
                    <Badge variant="outline">Order: {token.displayOrder}</Badge>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(token.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AdminUser {
  id: number;
  userId: string;
  email: string;
  role: string;
  createdAt: string;
}

function AdminsPanel() {
  const { toast } = useToast();
  const { data: admins, isLoading } = useQuery<AdminUser[]>({ 
    queryKey: ['/api/admin/admins'],
    queryFn: () => adminApiRequest('/api/admin/admins'),
  });
  const [newAdmin, setNewAdmin] = useState({ userId: '', email: '' });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApiRequest('/api/admin/admins', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] });
      toast({ description: 'Sub-admin added' });
      setNewAdmin({ userId: '', email: '' });
    },
    onError: () => {
      toast({ description: 'Failed to add admin', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiRequest(`/api/admin/admins/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] });
      toast({ description: 'Admin removed' });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Sub-Admin (Lower rank than you)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>User ID (from Replit Auth)</Label>
              <Input
                value={newAdmin.userId}
                onChange={(e) => setNewAdmin({ ...newAdmin, userId: e.target.value })}
                placeholder="User ID"
              />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>
          </div>
          <Button 
            onClick={() => createMutation.mutate(newAdmin)} 
            disabled={createMutation.isPending || !newAdmin.userId.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Admin
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Admins ({admins?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : !admins?.length ? (
            <p className="text-muted-foreground text-center py-8">No admins yet</p>
          ) : (
            <div className="space-y-4">
              {admins?.map((admin: any) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                      {admin.role}
                    </Badge>
                    <div>
                      <p className="font-medium">{admin.email || 'No email'}</p>
                      <p className="text-sm text-muted-foreground font-mono">{admin.userId}</p>
                    </div>
                  </div>
                  {admin.role !== 'super_admin' && (
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(admin.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface BotSettings {
  id: string;
  isEnabled: boolean;
  isFree: boolean;
  subscriptionPriceSOL: string;
  profitSharePercent: string;
  minBuyAmountSOL: string;
  maxBuyAmountSOL: string;
  defaultSlippagePercent: string;
  jitoTipLamports: number;
  autoSellEnabled: boolean;
  takeProfitPercent: string;
  stopLossPercent: string;
}

function BotSettingsPanel() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<BotSettings>({
    queryKey: ['/api/admin/bot/settings'],
    queryFn: () => adminApiRequest('/api/admin/bot/settings'),
  });

  const [formData, setFormData] = useState<Partial<BotSettings>>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<BotSettings>) =>
      adminApiRequest('/api/admin/bot/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bot/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/settings'] });
      toast({ description: 'Bot settings updated!' });
    },
    onError: () => {
      toast({ variant: 'destructive', description: 'Failed to update settings' });
    },
  });

  if (isLoading) {
    return <p>Loading bot settings...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Trading Bot Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Bot Enabled</Label>
                  <p className="text-sm text-muted-foreground">Allow users to use the trading bot</p>
                </div>
                <Switch
                  checked={formData.isEnabled ?? true}
                  onCheckedChange={(v) => setFormData({ ...formData, isEnabled: v })}
                  data-testid="switch-bot-enabled"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Free Mode</Label>
                  <p className="text-sm text-muted-foreground">Bot is free (no subscription required)</p>
                </div>
                <Switch
                  checked={formData.isFree ?? true}
                  onCheckedChange={(v) => setFormData({ ...formData, isFree: v })}
                  data-testid="switch-bot-free"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Auto Sell</Label>
                  <p className="text-sm text-muted-foreground">Enable automatic take profit / stop loss</p>
                </div>
                <Switch
                  checked={formData.autoSellEnabled ?? true}
                  onCheckedChange={(v) => setFormData({ ...formData, autoSellEnabled: v })}
                  data-testid="switch-auto-sell"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Subscription Price (SOL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.subscriptionPriceSOL || '0'}
                  onChange={(e) => setFormData({ ...formData, subscriptionPriceSOL: e.target.value })}
                  disabled={formData.isFree}
                  data-testid="input-subscription-price"
                />
              </div>

              <div>
                <Label>Profit Share (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={formData.profitSharePercent || '5'}
                  onChange={(e) => setFormData({ ...formData, profitSharePercent: e.target.value })}
                  data-testid="input-profit-share"
                />
                <p className="text-xs text-muted-foreground mt-1">Commission on profits only (not losses)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Buy (SOL)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.minBuyAmountSOL || '0.01'}
                    onChange={(e) => setFormData({ ...formData, minBuyAmountSOL: e.target.value })}
                    data-testid="input-min-buy"
                  />
                </div>
                <div>
                  <Label>Max Buy (SOL)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.maxBuyAmountSOL || '1'}
                    onChange={(e) => setFormData({ ...formData, maxBuyAmountSOL: e.target.value })}
                    data-testid="input-max-buy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Slippage (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={formData.defaultSlippagePercent || '15'}
                    onChange={(e) => setFormData({ ...formData, defaultSlippagePercent: e.target.value })}
                    data-testid="input-slippage"
                  />
                </div>
                <div>
                  <Label>Jito Tip (lamports)</Label>
                  <Input
                    type="number"
                    data-testid="input-jito-tip"
                    step="1000"
                    min="1000"
                    value={formData.jitoTipLamports || 10000}
                    onChange={(e) => setFormData({ ...formData, jitoTipLamports: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Take Profit (%)</Label>
                  <Input
                    type="number"
                    step="5"
                    min="10"
                    max="500"
                    value={formData.takeProfitPercent || '50'}
                    onChange={(e) => setFormData({ ...formData, takeProfitPercent: e.target.value })}
                    data-testid="input-take-profit"
                  />
                </div>
                <div>
                  <Label>Stop Loss (%)</Label>
                  <Input
                    type="number"
                    step="5"
                    min="5"
                    max="90"
                    value={formData.stopLossPercent || '30'}
                    onChange={(e) => setFormData({ ...formData, stopLossPercent: e.target.value })}
                    data-testid="input-stop-loss"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => updateMutation.mutate(formData)}
            disabled={updateMutation.isPending}
            className="w-full"
            data-testid="button-save-bot-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Bot Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
