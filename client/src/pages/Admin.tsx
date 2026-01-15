import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, ArrowLeft, Shield } from 'lucide-react';

type AdPosition = 'top' | 'bottom' | 'left' | 'right';
type ContentType = 'url' | 'html' | 'js';

interface SiteAd {
  id: string;
  position: AdPosition;
  contentType: ContentType;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Admin = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [ads, setAds] = useState<SiteAd[]>([]);
  const [newAd, setNewAd] = useState({
    position: 'top' as AdPosition,
    contentType: 'url' as ContentType,
    content: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/admin/ads');
      if (response.ok) {
        const data = await response.json();
        setAds(data);
      }
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
      const response = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAd),
      });

      if (!response.ok) throw new Error('Failed to create ad');

      toast({
        title: 'Success',
        description: 'Ad created successfully',
      });

      setNewAd({
        position: 'top',
        contentType: 'url',
        content: '',
        isActive: true,
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
      const response = await fetch(`/api/admin/ads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Failed to update ad');
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
      const response = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete ad');
      
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/')} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Site
          </Button>
        </div>

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
                  <SelectTrigger data-testid="select-position">
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
                  value={newAd.contentType}
                  onValueChange={(v) => setNewAd({ ...newAd, contentType: v as ContentType })}
                >
                  <SelectTrigger data-testid="select-content-type">
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
                    checked={newAd.isActive}
                    onCheckedChange={(v) => setNewAd({ ...newAd, isActive: v })}
                    data-testid="switch-active"
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
                  newAd.contentType === 'url' 
                    ? 'Enter image/banner URL...' 
                    : newAd.contentType === 'html'
                    ? 'Enter HTML code...'
                    : 'Enter JavaScript code...'
                }
                className="min-h-[100px] font-mono text-sm"
                data-testid="input-ad-content"
              />
            </div>
            <Button onClick={handleAddAd} data-testid="button-add-ad">
              <Plus className="w-4 h-4 mr-2" />
              Add Ad
            </Button>
          </CardContent>
        </Card>

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
                    data-testid={`card-ad-${ad.id}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          ad.isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {ad.position.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ad.contentType.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ad.isActive}
                          onCheckedChange={(v) => handleToggleAd(ad.id, v)}
                          data-testid={`switch-ad-${ad.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAd(ad.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-ad-${ad.id}`}
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
