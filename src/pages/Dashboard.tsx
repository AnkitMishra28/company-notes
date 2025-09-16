import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  FileText,
  Crown,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { user, supabase } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      // Use direct Supabase calls in development mode
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('tenant_id', user?.tenant.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching notes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canCreateNote = () => {
    if (user?.tenant.plan === 'pro') return true;
    return notes.length < 3;
  };

  const handleCreateNote = async () => {
    if (!canCreateNote()) {
      setShowUpgradeDialog(true);
      return;
    }

    if (!newNote.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use direct Supabase calls in development mode
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title: newNote.title,
            content: newNote.content,
            tenant_id: user?.tenant.id,
            user_id: user?.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote({ title: '', content: '' });
      setShowNewNoteDialog(false);
      
      toast({
        title: "Note created",
        description: "Your note has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error creating note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;

    try {
      // Use direct Supabase calls in development mode
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: editingNote.title,
          content: editingNote.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNote.id)
        .eq('tenant_id', user?.tenant.id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      setNotes(notes.map(note => note.id === editingNote.id ? data : note));
      setEditingNote(null);
      
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async () => {
    if (!deletingNote) return;

    try {
      // Use direct Supabase calls in development mode
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', deletingNote.id)
        .eq('tenant_id', user?.tenant.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== deletingNote.id));
      setDeletingNote(null);
      
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch(`/api/tenants/${user?.tenant.slug}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Upgrade failed');

      // Refresh user data to get updated plan
      window.location.reload();
      
      toast({
        title: "Upgraded to Pro!",
        description: "You now have unlimited notes",
      });
    } catch (error: any) {
      toast({
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Notes</h1>
          <p className="text-muted-foreground">
            Manage your personal notes and ideas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.tenant.plan === 'free' && (
            <Badge variant="secondary" className="text-xs">
              {notes.length}/3 notes used
            </Badge>
          )}
          <Dialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog}>
            <DialogTrigger asChild>
              <Button className="gradient-primary shadow-primary hover:shadow-glow">
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Add a new note to your collection
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <Textarea
                  placeholder="Write your note content here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={6}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewNoteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNote}>
                    <Save className="w-4 h-4 mr-2" />
                    Create Note
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Free plan limit warning */}
      {user?.tenant.plan === 'free' && notes.length >= 3 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div className="flex-1">
                <h3 className="font-medium">Note limit reached</h3>
                <p className="text-sm text-muted-foreground">
                  You've reached the free plan limit of 3 notes. Upgrade to Pro for unlimited notes.
                </p>
              </div>
              {user?.role === 'admin' && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowUpgradeDialog(true)}
                  className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first note to get started
            </p>
            <Button 
              onClick={() => setShowNewNoteDialog(true)}
              className="gradient-primary shadow-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Card key={note.id} className="group hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingNote?.id === note.id ? (
                      <Input
                        value={editingNote.title}
                        onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                        className="font-medium"
                        autoFocus
                      />
                    ) : (
                      <CardTitle className="truncate">{note.title}</CardTitle>
                    )}
                    <CardDescription className="text-xs">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingNote?.id === note.id ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={handleUpdateNote}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingNote(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setEditingNote(note)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setDeletingNote(note)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingNote?.id === note.id ? (
                  <Textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {note.content || 'No content'}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Upgrade to Pro
            </DialogTitle>
            <DialogDescription>
              Unlock unlimited notes and advanced features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$9.99/month</div>
              <div className="text-sm text-muted-foreground">Billed monthly</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Unlimited notes
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Advanced formatting
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Team collaboration
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Maybe Later
              </Button>
              <Button onClick={handleUpgrade} className="gradient-primary shadow-primary">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingNote} onOpenChange={() => setDeletingNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingNote?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;