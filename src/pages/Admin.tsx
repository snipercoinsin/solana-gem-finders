import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, LogOut, Shield, ArrowLeft } from 'lucide-react';

type AdPosition = 'top' | 'bottom' | 'left' | 'right';
type ContentType = 'url' | 'html' | 'js';

interface SiteAd {
  id: string;
  position: AdPosition;
  content_type: ContentType;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(true);
  
  const [ads, setAds] = useState<SiteAd[]>([]);
  const [newAd, setNewAd] = useState({
    position: 'top' as AdPosition,
    content_type: 'url' as ContentType,
    content: '',
    is_active: true,
  });

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setCheckingRole(false);
          setIsAdmin(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setCheckingRole(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
      
      if (data) {
        fetchAds();
      }
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
    } finally {
      setCheckingRole(false);
    }
  };

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('site_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds((data || []).map(ad => ({
        ...ad,
        content_type: ad.content_type as ContentType,
      })));
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to fetch ads',
        variant: 'destructive',
      });
    }
  };

  const handleAddAd = async () => {
    if (!newAd.content.trim()) {
      toast({
        title: 'Error',
        description: 'Content is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('site_ads')
        .insert([newAd]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ad created successfully',
      });

      setNewAd({
        position: 'top',
        content_type: 'url',
        content: '',
        is_active: true,
      });

      fetchAds();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create ad',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAd = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('site_ads')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchAds();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update ad',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      const { error } = await supabase
        .from('site_ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Ad deleted successfully',
      });
      
      fetchAds();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete ad',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Please login with your admin account to access this page.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              You don't have admin privileges. Contact the site administrator.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Add New Ad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Ad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={newAd.position}
                  onValueChange={(v) => setNewAd({ ...newAd, position: v as AdPosition })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={newAd.content_type}
                  onValueChange={(v) => setNewAd({ ...newAd, content_type: v as ContentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">URL (Image/Link)</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="js">JavaScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newAd.is_active}
                    onCheckedChange={(v) => setNewAd({ ...newAd, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={newAd.content}
                onChange={(e) => setNewAd({ ...newAd, content: e.target.value })}
                placeholder={
                  newAd.content_type === 'url' 
                    ? 'Enter image/banner URL...' 
                    : newAd.content_type === 'html'
                    ? 'Enter HTML code...'
                    : 'Enter JavaScript code...'
                }
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
            <Button onClick={handleAddAd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Ad
            </Button>
          </CardContent>
        </Card>

        {/* Existing Ads */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Ads ({ads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {ads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No ads configured yet</p>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="border border-border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          ad.is_active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {ad.position.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ad.content_type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ad.is_active}
                          onCheckedChange={(v) => handleToggleAd(ad.id, v)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAd(ad.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-24">
                      {ad.content.substring(0, 200)}
                      {ad.content.length > 200 && '...'}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
