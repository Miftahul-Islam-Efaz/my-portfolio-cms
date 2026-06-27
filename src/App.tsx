import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Save, RefreshCw, CheckCircle2, AlertCircle, X, ExternalLink, Eye,
  FileText
} from 'lucide-react';
import { supabase } from './lib/supabase';
import confetti from 'canvas-confetti';

// Database interfaces
interface Project {
  id: string;
  title: string;
  category: string;
  accent_color: string;
  badge: string;
  tech: string[];
  description: string;
  link_text: string;
  link_url: string;
  glow: string;
  sort_order: number;
}

interface VideoSettings {
  id: string;
  video_url: string;
  video_opacity: number;
  multiply_overlay_opacity: number;
  gradient_overlay_opacity_from: number;
  gradient_overlay_opacity_to: number;
  muted: boolean;
  loop_video: boolean;
}

interface Submission {
  id: string | number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

interface Rating {
  id: string;
  user_name: string;
  rating: number;
  vibe_label: string;
  created_at: string;
}

interface ServiceCard {
  id: string;
  title: string;
  image_url: string;
  sort_order: number;
}

interface AdminNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface OutcomesImage {
  id: string;
  image_url: string;
  label: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  image_url: string;
  sort_order: number;
}

interface SectionBackground {
  id: string;
  image_url: string;
  label: string;
}

export default function App() {
  // Auth & Connection state
  const [isAuthenticated] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionErrorMessage, setConnectionErrorMessage] = useState('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'projects' | 'services' | 'video' | 'ai' | 'inbox' | 'ratings' | 'notes' | 'outcomes' | 'testimonials' | 'footer'>('projects');

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Database lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [outcomesImages, setOutcomesImages] = useState<OutcomesImage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [sectionBackgrounds, setSectionBackgrounds] = useState<SectionBackground[]>([]);

  // CRUD Editing states
  const [editingServiceCard, setEditingServiceCard] = useState<Partial<ServiceCard> | null>(null);
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Partial<AdminNote> | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [editingOutcomesImage, setEditingOutcomesImage] = useState<Partial<OutcomesImage> | null>(null);
  const [isOutcomesDrawerOpen, setIsOutcomesDrawerOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [isTestimonialDrawerOpen, setIsTestimonialDrawerOpen] = useState(false);
  const [editingSectionBg, setEditingSectionBg] = useState<Partial<SectionBackground> | null>(null);
  const [isSectionBgDrawerOpen, setIsSectionBgDrawerOpen] = useState(false);
  
  const [activeVideoSection, setActiveVideoSection] = useState<'hero' | 'contact'>('hero');
  const [contactVideo, setContactVideo] = useState<VideoSettings>({
    id: 'contact_section',
    video_url: '',
    video_opacity: 1.0,
    multiply_overlay_opacity: 0.35,
    gradient_overlay_opacity_from: 0.9,
    gradient_overlay_opacity_to: 0.3,
    muted: false,
    loop_video: true
  });
  const [heroVideo, setHeroVideo] = useState<VideoSettings>({
    id: 'hero_section',
    video_url: '',
    video_opacity: 1.0,
    multiply_overlay_opacity: 0.0,
    gradient_overlay_opacity_from: 0.0,
    gradient_overlay_opacity_to: 0.0,
    muted: true,
    loop_video: true
  });
  
  const [llmText, setLlmText] = useState('');

  // CRUD Editing states
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Authenticate silently in the background on mount and monitor Supabase database connectivity
  useEffect(() => {
    async function silentAuth() {
      try {
        setConnectionStatus('checking');
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          // Perform background credentials handshake
          const email = 'admin@miftahulislamefaz.xyz';
          const password = 'miftahul_admin_password_4203';
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          // Auto-register if the credentials do not exist in Auth yet
          if (signInError && signInError.message.toLowerCase().includes('invalid login credentials')) {
            await supabase.auth.signUp({
              email,
              password
            });
          }
        }
        
        // Ping database query to verify active table connections
        const { error: pingError } = await supabase.from('projects').select('id', { head: true, count: 'exact' });
        if (pingError) throw pingError;

        setConnectionStatus('connected');
        setConnectionErrorMessage('');
      } catch (err: any) {
        console.warn('Supabase connectivity/auth check failed:', err);
        setConnectionStatus('error');
        setConnectionErrorMessage(err.message || 'Connection timeout or invalid API keys');
      }
    }
    silentAuth();
  }, []);

  // Fetch tab-specific data when logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

  // Show auto-dismiss notifications
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const celebrate = () => {
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#1C1917', '#78716C', '#d97706', '#10b981']
    });
  };

  // Central data loader
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'projects') {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        setProjects(data || []);
      } else if (activeTab === 'video') {
        const { data: contactData } = await supabase
          .from('video_settings')
          .select('*')
          .eq('id', 'contact_section')
          .single();
        if (contactData) setContactVideo(contactData);

        const { data: heroData } = await supabase
          .from('video_settings')
          .select('*')
          .eq('id', 'hero_section')
          .single();
        if (heroData) setHeroVideo(heroData);
      } else if (activeTab === 'ai') {
        const { data, error } = await supabase
          .from('llms_content')
          .select('content')
          .eq('id', 'default')
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) setLlmText(data.content);
      } else if (activeTab === 'inbox') {
        const { data, error } = await supabase
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setSubmissions(data || []);
      } else if (activeTab === 'ratings') {
        const { data, error } = await supabase
          .from('portfolio_ratings')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRatings(data || []);
      } else if (activeTab === 'services') {
        const { data, error } = await supabase
          .from('service_cards')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        setServiceCards(data || []);

        const { data: bgData } = await supabase
          .from('section_backgrounds')
          .select('*')
          .eq('id', 'services')
          .single();
        if (bgData) {
          setSectionBackgrounds(prev => {
            const filtered = prev.filter(b => b.id !== 'services');
            return [...filtered, bgData];
          });
        }
      } else if (activeTab === 'testimonials') {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        setTestimonials(data || []);

        const { data: bgData } = await supabase
          .from('section_backgrounds')
          .select('*')
          .eq('id', 'testimonials')
          .single();
        if (bgData) {
          setSectionBackgrounds(prev => {
            const filtered = prev.filter(b => b.id !== 'testimonials');
            return [...filtered, bgData];
          });
        }
      } else if (activeTab === 'notes') {
        const { data, error } = await supabase
          .from('admin_notes')
          .select('*')
          .order('updated_at', { ascending: false });
        if (error) throw error;
        setAdminNotes(data || []);
      } else if (activeTab === 'outcomes') {
        const { data, error } = await supabase
          .from('outcomes_images')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        setOutcomesImages(data || []);
      } else if (activeTab === 'footer') {
        const { data, error } = await supabase
          .from('section_backgrounds')
          .select('*')
          .in('id', ['footer_portrait', 'footer_bg']);
        if (error) throw error;
        if (data) {
          setSectionBackgrounds(prev => {
            const filtered = prev.filter(b => b.id !== 'footer_portrait' && b.id !== 'footer_bg');
            return [...filtered, ...data];
          });
        }
      }
    } catch (err: any) {
      console.error('Data fetch error:', err);
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open the drawer for new or edited project
  const openProjectDrawer = (proj: Partial<Project> | null) => {
    setEditingProject(proj);
    setIsDrawerOpen(true);
  };

  const closeProjectDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setEditingProject(null), 300); // clear edit state after animation finishes
  };

  // Project CRUD Actions
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.id || !editingProject?.title) return;
    setSaveLoading(true);

    // Auto calculate glow if not specified (rgba match of hex accent color)
    let finalGlow = editingProject.glow || 'rgba(28, 25, 23, 0.08)';
    if (editingProject.accent_color && !editingProject.glow) {
      const hex = editingProject.accent_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        finalGlow = `rgba(${r}, ${g}, ${b}, 0.12)`;
      }
    }

    try {
      const cleanProject = {
        ...editingProject,
        glow: finalGlow,
        tech: typeof editingProject.tech === 'string' 
          ? (editingProject.tech as string).split(',').map(s => s.trim()).filter(Boolean)
          : editingProject.tech
      };

      const { error } = await supabase.from('projects').upsert([cleanProject]);
      if (error) throw error;

      showToast('Project saved successfully! Website rebuild triggered.');
      closeProjectDrawer();
      fetchData();
      celebrate();
    } catch (err: any) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    setConfirmModal({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This will trigger an automatic portfolio rebuild.',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('projects').delete().eq('id', id);
          if (error) throw error;
          showToast('Project deleted successfully.');
          fetchData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete project', 'error');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Video Settings Save
  const handleSaveVideoSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    const settingsToSave = activeVideoSection === 'hero' ? heroVideo : contactVideo;
    try {
      const { error } = await supabase.from('video_settings').upsert([settingsToSave]);
      if (error) throw error;
      showToast(`${activeVideoSection === 'hero' ? 'Hero' : 'Contact'} video settings saved successfully!`);
      celebrate();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Service Cards Save
  const handleSaveServiceCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceCard?.id || !editingServiceCard?.image_url) return;
    setSaveLoading(true);
    try {
      const { error } = await supabase.from('service_cards').upsert([editingServiceCard]);
      if (error) throw error;
      showToast('Service card updated successfully!');
      setIsServiceDrawerOpen(false);
      setEditingServiceCard(null);
      fetchData();
      celebrate();
    } catch (err: any) {
      showToast(err.message || 'Failed to save service card', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Outcomes Images Save
  const handleSaveOutcomesImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOutcomesImage?.id || !editingOutcomesImage?.image_url) return;
    setSaveLoading(true);
    try {
      const { error } = await supabase.from('outcomes_images').upsert([editingOutcomesImage]);
      if (error) throw error;
      showToast('Outcomes image updated successfully!');
      setIsOutcomesDrawerOpen(false);
      setEditingOutcomesImage(null);
      fetchData();
      celebrate();
    } catch (err: any) {
      showToast(err.message || 'Failed to save outcomes image', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Testimonials Save
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial?.id || !editingTestimonial?.name || !editingTestimonial?.image_url) return;
    setSaveLoading(true);
    try {
      const { error } = await supabase.from('testimonials').upsert([editingTestimonial]);
      if (error) throw error;
      showToast('Testimonial saved successfully!');
      setIsTestimonialDrawerOpen(false);
      setEditingTestimonial(null);
      fetchData();
      celebrate();
    } catch (err: any) {
      showToast(err.message || 'Failed to save testimonial', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Testimonials Delete
  const handleDeleteTestimonial = (id: string) => {
    setConfirmModal({
      title: 'Delete Testimonial',
      message: 'Are you sure you want to permanently delete this client testimonial?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('testimonials').delete().eq('id', id);
          if (error) throw error;
          showToast('Testimonial deleted successfully.');
          fetchData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete testimonial', 'error');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Section Backgrounds Save
  const handleSaveSectionBg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSectionBg?.id || !editingSectionBg?.image_url) return;
    setSaveLoading(true);
    try {
      const { error } = await supabase.from('section_backgrounds').upsert([editingSectionBg]);
      if (error) throw error;
      showToast('Section background updated successfully!');
      setIsSectionBgDrawerOpen(false);
      setEditingSectionBg(null);
      fetchData();
      celebrate();
    } catch (err: any) {
      showToast(err.message || 'Failed to save background image', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Notes Save
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote?.title || !activeNote?.content) return;
    setSaveLoading(true);
    try {
      const noteToSave = {
        ...activeNote,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('admin_notes')
        .upsert([noteToSave])
        .select();
        
      if (error) throw error;
      
      showToast(activeNote.id ? 'Note updated successfully!' : 'Note created successfully!');
      fetchData();
      celebrate();
      
      if (data && data[0]) {
        setActiveNote(data[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save note', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Notes Delete
  const handleDeleteNote = (id: string) => {
    setConfirmModal({
      title: 'Delete Note',
      message: 'Are you sure you want to permanently delete this developer note?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('admin_notes').delete().eq('id', id);
          if (error) throw error;
          showToast('Note deleted successfully.');
          setActiveNote(null);
          fetchData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete note', 'error');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // LLMs Content Save
  const handleSaveLlmText = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const { error } = await supabase
        .from('llms_content')
        .upsert([{ id: 'default', content: llmText }]);
      if (error) throw error;
      showToast('AI profile saved successfully! Search index will update.');
      celebrate();
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile text', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Rating
  const handleDeleteRating = (id: string) => {
    setConfirmModal({
      title: 'Delete Rating Log',
      message: 'Are you sure you want to remove this rating from the database log?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('portfolio_ratings').delete().eq('id', id);
          if (error) throw error;
          showToast('Rating deleted.');
          fetchData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete rating', 'error');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Calculate live preview glow value
  const getLiveGlow = () => {
    if (!editingProject) return 'rgba(28, 25, 23, 0.08)';
    if (editingProject.glow) return editingProject.glow;
    if (editingProject.accent_color) {
      const hex = editingProject.accent_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return `rgba(${r}, ${g}, ${b}, 0.15)`;
      }
    }
    return 'rgba(28, 25, 23, 0.08)';
  };

  // --- RENDERS ---



  // Calculate rating stats
  const averageRating = ratings.length > 0 
    ? Math.round(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) 
    : 0;

  // Main Dashboard Render (Desktop Fixed-Sidebar Layout)
  return (
    <div className="h-screen bg-bg-main flex flex-col font-sans overflow-hidden animate-fade-in">
      
      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/20 backdrop-blur-xs animate-fade-in">
          <div className="bg-bg-surface border-2 border-brand-dark rounded-none max-w-sm w-full p-6 shadow-[8px_8px_0px_0px_rgba(26,26,24,1)] animate-slide-up space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={20} />
              <h3 className="font-semibold text-txt-main text-base uppercase tracking-wider font-mono">{confirmModal.title}</h3>
            </div>
            <p className="text-sm text-txt-muted leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-border-subtle hover:bg-bg-hover text-txt-muted hover:text-txt-main text-sm font-mono uppercase rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-mono uppercase rounded shadow-xs cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Right Drawer for Project Editor */}
      {isDrawerOpen && editingProject && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={closeProjectDrawer} 
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-xs animate-fade-in"
          />

          {/* Drawer container */}
          <div className={`relative w-full max-w-xl bg-bg-surface border-l border-border-subtle shadow-2xl h-full flex flex-col z-10 transition-transform duration-300 ease-out translate-x-0`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-sidebar">
              <div>
                <h3 className="font-display font-black text-xl text-txt-main uppercase tracking-wider">
                  {editingProject.id ? 'Edit Project' : 'Add New Project'}
                </h3>
                <p className="text-xs font-mono text-txt-muted uppercase mt-0.5">Live changes preview enabled</p>
              </div>
              <button 
                onClick={closeProjectDrawer}
                className="p-2 text-txt-muted hover:text-txt-main hover:bg-bg-hover rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body (Scrollable form + live preview) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* LIVE CARD PREVIEW SECTION */}
              <div className="space-y-3">
                <span className="text-xs font-mono text-txt-dim uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={12} />
                  Live Website Mockup
                </span>
                
                {/* Embedded dynamic project card preview */}
                <div 
                  className="bg-[#0F0B0A] text-[#F2F0F1] rounded-lg p-6 relative flex flex-col justify-between h-56 border border-white/5 shadow-2xl overflow-hidden transition-all duration-300"
                  style={{ 
                    boxShadow: `0 10px 30px -10px rgba(0,0,0,0.7), 0 0 40px -10px ${getLiveGlow()}` 
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 transition-colors duration-300"
                    style={{ backgroundColor: editingProject.accent_color || '#1C1917' }}
                  />

                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                      {editingProject.badge || '01. BADGE TITLE'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-xs text-neutral-400">
                      Sort: {editingProject.sort_order || 1}
                    </span>
                  </div>

                  <div className="my-auto">
                    <h4 className="font-display font-black text-xl text-white tracking-wide leading-tight">
                      {editingProject.title || 'Untitled Project'}
                    </h4>
                    <p className="text-xs font-mono text-neutral-400 italic mt-0.5">
                      {editingProject.category || 'Visual Design Atelier'}
                    </p>
                    <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed mt-2.5">
                      {editingProject.description || 'Description will outline project goals, metrics, technologies and automation stack values.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-auto">
                    <span className="text-xs font-mono text-neutral-300 flex items-center gap-1">
                      {editingProject.link_text || 'Launch'}
                      <ExternalLink size={10} />
                    </span>

                    <div className="flex gap-1.5">
                      {typeof editingProject.tech === 'string' 
                        ? (editingProject.tech as string).split(',').map((t, i) => (
                            <span key={i} className="bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono px-1.5 py-0.5 rounded">
                              {t.trim()}
                            </span>
                          ))
                        : (editingProject.tech || []).slice(0, 3).map((t, i) => (
                            <span key={i} className="bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* EDITOR FORM */}
              <form onSubmit={handleSaveProject} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Project ID (Unique Slug)</label>
                    <input
                      type="text"
                      required
                      disabled={projects.some(p => p.id === editingProject.id && editingProject.id !== '')}
                      value={editingProject.id || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus disabled:opacity-40"
                      placeholder="e.g. n8n-workflows"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Title / Brand Name</label>
                    <input
                      type="text"
                      required
                      value={editingProject.title || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                      className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus"
                      placeholder="e.g. n8n Workflow Automation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Category / Subheading</label>
                    <input
                      type="text"
                      required
                      value={editingProject.category || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                      className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus"
                      placeholder="e.g. AI-Powered Workflow Sync"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Badge Tag</label>
                    <input
                      type="text"
                      required
                      value={editingProject.badge || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, badge: e.target.value })}
                      className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus"
                      placeholder="e.g. 02. AUTOMATION DECK"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Theme Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editingProject.accent_color || '#1C1917'}
                        onChange={(e) => setEditingProject({ ...editingProject, accent_color: e.target.value })}
                        className="bg-transparent border border-border-subtle rounded h-11 w-12 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        required
                        maxLength={7}
                        value={editingProject.accent_color || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, accent_color: e.target.value })}
                        className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus flex-1 font-mono"
                        placeholder="e.g. #1C1917"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Glow Value (CSS color/rgba)</label>
                    <input
                      type="text"
                      value={editingProject.glow || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, glow: e.target.value })}
                      className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                      placeholder="Auto-calculates if empty"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Project Description</label>
                  <textarea
                    required
                    rows={4}
                    value={editingProject.description || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus resize-none leading-relaxed"
                    placeholder="Provide a description outlining what this project accomplishes..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Tools & Tech (Comma separated)</label>
                  <input
                    type="text"
                    required
                    value={typeof editingProject.tech === 'string' ? editingProject.tech : (editingProject.tech || []).join(', ')}
                    onChange={(e) => setEditingProject({ ...editingProject, tech: e.target.value as any })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                    placeholder="React, n8n, Supabase, Tailwind"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Link Display Text</label>
                    <input
                      type="text"
                      required
                      value={editingProject.link_text || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, link_text: e.target.value })}
                      className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus"
                      placeholder="Launch Deployment"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Link Target URL</label>
                    <input
                      type="url"
                      required
                      value={editingProject.link_url || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, link_url: e.target.value })}
                      className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Sorting Order Weight</label>
                    <input
                      type="number"
                      required
                      value={editingProject.sort_order || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, sort_order: parseInt(e.target.value) || 0 })}
                      className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                      placeholder="e.g. 1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white py-3.5 rounded text-sm font-semibold font-mono tracking-wider transition-all disabled:opacity-50 uppercase shadow-xs cursor-pointer active:scale-98"
                  >
                    {saveLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Save Project</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={closeProjectDrawer}
                    className="flex-1 py-3.5 border border-border-subtle hover:bg-bg-hover text-txt-muted hover:text-txt-main rounded text-sm font-mono transition-all uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Right Drawer for Service Card Editor */}
      {isServiceDrawerOpen && editingServiceCard && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => { setIsServiceDrawerOpen(false); setEditingServiceCard(null); }} 
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-xs animate-fade-in"
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-bg-surface border-l border-border-subtle shadow-2xl h-full flex flex-col z-10 transition-transform duration-300 ease-out translate-x-0">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-sidebar">
              <div>
                <h3 className="font-display font-black text-xl text-txt-main uppercase tracking-wider">
                  Edit Service Card
                </h3>
                <p className="text-xs font-mono text-txt-muted uppercase mt-0.5">Card Slug: {editingServiceCard.id}</p>
              </div>
              <button 
                onClick={() => { setIsServiceDrawerOpen(false); setEditingServiceCard(null); }}
                className="p-2 text-txt-muted hover:text-txt-main hover:bg-bg-hover rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {editingServiceCard.image_url && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-txt-dim uppercase tracking-wider">Image Preview</span>
                  <div className="aspect-video w-full rounded border border-border-subtle overflow-hidden bg-bg-main relative shadow-inner">
                    <img 
                      src={editingServiceCard.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveServiceCard} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Card Title / Badge Tag</label>
                  <input
                    type="text"
                    required
                    value={editingServiceCard.title || ''}
                    onChange={(e) => setEditingServiceCard({ ...editingServiceCard, title: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus"
                    placeholder="e.g. CRAFT"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Image URL</label>
                  <input
                    type="url"
                    required
                    value={editingServiceCard.image_url || ''}
                    onChange={(e) => setEditingServiceCard({ ...editingServiceCard, image_url: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                    placeholder="https://res.cloudinary.com/..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Sorting Order</label>
                  <input
                    type="number"
                    required
                    value={editingServiceCard.sort_order || ''}
                    onChange={(e) => setEditingServiceCard({ ...editingServiceCard, sort_order: parseInt(e.target.value) || 0 })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white py-3.5 rounded text-sm font-semibold font-mono tracking-wider transition-all disabled:opacity-50 uppercase shadow-xs cursor-pointer active:scale-98"
                  >
                    {saveLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Save Changes</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { setIsServiceDrawerOpen(false); setEditingServiceCard(null); }}
                    className="flex-1 py-3.5 border border-border-subtle hover:bg-bg-hover text-txt-muted hover:text-txt-main rounded text-sm font-mono transition-all uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Right Drawer for Outcomes Image Editor */}
      {isOutcomesDrawerOpen && editingOutcomesImage && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => { setIsOutcomesDrawerOpen(false); setEditingOutcomesImage(null); }} 
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-xs animate-fade-in"
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-bg-surface border-l border-border-subtle shadow-2xl h-full flex flex-col z-10 transition-transform duration-300 ease-out translate-x-0">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-sidebar">
              <div>
                <h3 className="font-display font-black text-xl text-txt-main uppercase tracking-wider">
                  Edit Outcomes Asset
                </h3>
                <p className="text-xs font-mono text-txt-muted uppercase mt-0.5">Asset ID: {editingOutcomesImage.id}</p>
              </div>
              <button 
                onClick={() => { setIsOutcomesDrawerOpen(false); setEditingOutcomesImage(null); }}
                className="p-2 text-txt-muted hover:text-txt-main hover:bg-bg-hover rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {editingOutcomesImage.image_url && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-txt-dim uppercase tracking-wider">Image Preview</span>
                  <div className="aspect-video w-full rounded border border-border-subtle overflow-hidden bg-[#0A0A0A] relative shadow-inner flex items-center justify-center">
                    <img 
                      src={editingOutcomesImage.image_url} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveOutcomesImage} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Friendly Label</label>
                  <input
                    type="text"
                    required
                    value={editingOutcomesImage.label || ''}
                    onChange={(e) => setEditingOutcomesImage({ ...editingOutcomesImage, label: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus"
                    placeholder="e.g. Background Glow"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Image URL</label>
                  <input
                    type="url"
                    required
                    value={editingOutcomesImage.image_url || ''}
                    onChange={(e) => setEditingOutcomesImage({ ...editingOutcomesImage, image_url: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                    placeholder="https://res.cloudinary.com/..."
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white py-3.5 rounded text-sm font-semibold font-mono tracking-wider transition-all disabled:opacity-50 uppercase shadow-xs cursor-pointer active:scale-98"
                  >
                    {saveLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Save Changes</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { setIsOutcomesDrawerOpen(false); setEditingOutcomesImage(null); }}
                    className="flex-1 py-3.5 border border-border-subtle hover:bg-bg-hover text-txt-muted hover:text-txt-main rounded text-sm font-mono transition-all uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Right Drawer for Testimonials Editor */}
      {isTestimonialDrawerOpen && editingTestimonial && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => { setIsTestimonialDrawerOpen(false); setEditingTestimonial(null); }} 
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-xs animate-fade-in"
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-bg-surface border-l border-border-subtle shadow-2xl h-full flex flex-col z-10 transition-transform duration-300 ease-out translate-x-0">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-sidebar">
              <div>
                <h3 className="font-display font-black text-xl text-txt-main uppercase tracking-wider">
                  {editingTestimonial.id ? 'Edit Testimonial' : 'Add Testimonial'}
                </h3>
                <p className="text-xs font-mono text-txt-muted uppercase mt-0.5">Client ID: {editingTestimonial.id || 'new'}</p>
              </div>
              <button 
                onClick={() => { setIsTestimonialDrawerOpen(false); setEditingTestimonial(null); }}
                className="p-2 text-txt-muted hover:text-txt-main hover:bg-bg-hover rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {editingTestimonial.image_url && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-txt-dim uppercase tracking-wider">Client Portrait Preview</span>
                  <div className="aspect-square w-48 mx-auto rounded-full border border-border-subtle overflow-hidden bg-[#0A0A0A] relative shadow-inner flex items-center justify-center">
                    <img 
                      src={editingTestimonial.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveTestimonial} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Client Name</label>
                  <input
                    type="text"
                    required
                    value={editingTestimonial.name || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Role / Designation</label>
                  <input
                    type="text"
                    required
                    value={editingTestimonial.role || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus"
                    placeholder="e.g. CEO, TechCorp"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Testimonial Quote</label>
                  <textarea
                    required
                    rows={4}
                    value={editingTestimonial.quote || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus resize-none leading-relaxed"
                    placeholder="e.g. “This service was exceptional...”"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Photo URL</label>
                  <input
                    type="url"
                    required
                    value={editingTestimonial.image_url || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, image_url: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                    placeholder="https://res.cloudinary.com/..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Sorting Order</label>
                  <input
                    type="number"
                    required
                    value={editingTestimonial.sort_order || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, sort_order: parseInt(e.target.value) || 0 })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white py-3.5 rounded text-sm font-semibold font-mono tracking-wider transition-all disabled:opacity-50 uppercase shadow-xs cursor-pointer active:scale-98"
                  >
                    {saveLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Save Testimonial</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { setIsTestimonialDrawerOpen(false); setEditingTestimonial(null); }}
                    className="flex-1 py-3.5 border border-border-subtle hover:bg-bg-hover text-txt-muted hover:text-txt-main rounded text-sm font-mono transition-all uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Right Drawer for Section Background Editor */}
      {isSectionBgDrawerOpen && editingSectionBg && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => { setIsSectionBgDrawerOpen(false); setEditingSectionBg(null); }} 
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-xs animate-fade-in"
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-bg-surface border-l border-border-subtle shadow-2xl h-full flex flex-col z-10 transition-transform duration-300 ease-out translate-x-0">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-sidebar">
              <div>
                <h3 className="font-display font-black text-xl text-txt-main uppercase tracking-wider">
                  Edit Section Background
                </h3>
                <p className="text-xs font-mono text-txt-muted uppercase mt-0.5">Section: {editingSectionBg.id}</p>
              </div>
              <button 
                onClick={() => { setIsSectionBgDrawerOpen(false); setEditingSectionBg(null); }}
                className="p-2 text-txt-muted hover:text-txt-main hover:bg-bg-hover rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {editingSectionBg.image_url && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-txt-dim uppercase tracking-wider">Image Preview</span>
                  <div className="aspect-video w-full rounded border border-border-subtle overflow-hidden bg-[#0A0A0A] relative shadow-inner flex items-center justify-center">
                    <img 
                      src={editingSectionBg.image_url} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveSectionBg} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Section Label</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={editingSectionBg.label || ''}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">Image URL</label>
                  <input
                    type="url"
                    required
                    value={editingSectionBg.image_url || ''}
                    onChange={(e) => setEditingSectionBg({ ...editingSectionBg, image_url: e.target.value })}
                    className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                    placeholder="https://res.cloudinary.com/..."
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white py-3.5 rounded text-sm font-semibold font-mono tracking-wider transition-all disabled:opacity-50 uppercase shadow-xs cursor-pointer active:scale-98"
                  >
                    {saveLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Save Background</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { setIsSectionBgDrawerOpen(false); setEditingSectionBg(null); }}
                    className="flex-1 py-3.5 border border-border-subtle hover:bg-bg-hover text-txt-muted hover:text-txt-main rounded text-sm font-mono transition-all uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b-2 border-brand-dark py-4 px-6 md:px-8 bg-bg-sidebar flex items-center justify-between z-10 shrink-0 font-sans">
        <div className="flex items-center gap-4">
          <h1 className="font-serif italic text-2xl text-txt-main tracking-tight font-medium select-none">
            Efaz <span className="font-sans text-[10px] uppercase tracking-widest not-italic font-bold ml-1.5 border-l border-brand-dark pl-2">CMS</span>
          </h1>
          {connectionStatus === 'checking' && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 border border-brand-dark font-mono text-[10px] uppercase bg-brand-light text-brand-dark font-bold">
              <RefreshCw size={8} className="animate-spin" />
              Checking...
            </span>
          )}
          {connectionStatus === 'connected' && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 border border-brand-dark font-mono text-[10px] uppercase bg-brand-light text-brand-dark font-bold">
              ● Supabase Connected
            </span>
          )}
          {connectionStatus === 'error' && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 border border-rose-600 font-mono text-[10px] uppercase bg-rose-50 text-rose-700 font-bold animate-pulse" title={connectionErrorMessage}>
              ▲ Supabase Error
            </span>
          )}
        </div>
        
        <a
          href="https://www.miftahulislamefaz.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-mono text-txt-main hover:text-brand-light hover:bg-brand-dark px-4 py-2 border border-brand-dark rounded-none transition-all active:scale-98 cursor-pointer uppercase tracking-wider font-semibold"
        >
          <ExternalLink size={12} />
          <span>View Site</span>
        </a>
      </header>

      {/* Body Container (Split Layout, height locked, scrolls internally) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Navigation (Strictly fixed left panel with vertical scroll) */}
        <aside className="w-full md:w-64 bg-bg-sidebar border-b md:border-b-0 md:border-r border-brand-dark py-8 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0 px-6">
          <div className="hidden md:block border-b-2 border-double border-brand-dark pb-3 mb-6">
            <p className="text-xs font-mono text-txt-main uppercase tracking-widest font-bold">
              Directory Index
            </p>
          </div>

          {[
            { id: 'projects', label: 'Projects', index: 'I.' },
            { id: 'services', label: 'Services', index: 'II.' },
            { id: 'outcomes', label: 'Outcomes', index: 'III.' },
            { id: 'testimonials', label: 'Testimonials', index: 'IV.' },
            { id: 'video', label: 'Section Videos', index: 'V.' },
            { id: 'ai', label: 'AI Profile', index: 'VI.' },
            { id: 'notes', label: 'Dev Notes', index: 'VII.' },
            { id: 'inbox', label: 'Inbox Messages', index: 'VIII.' },
            { id: 'ratings', label: 'Vibe Check', index: 'IX.' },
            { id: 'footer', label: 'Footer Showcase', index: 'X.' }
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all duration-300 group cursor-pointer border rounded-none shrink-0 md:w-full select-none ${
                  isActive 
                    ? 'bg-brand-dark text-brand-light border-brand-dark' 
                    : 'bg-transparent text-txt-muted border-transparent hover:text-txt-main hover:bg-bg-hover hover:border-border-subtle'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-serif italic text-base select-none transition-colors duration-300 ${isActive ? 'text-brand-light/70' : 'text-txt-dim group-hover:text-txt-main'}`}>
                    {item.index}
                  </span>
                  <span className="font-sans text-xs uppercase tracking-widest font-semibold transition-transform duration-300 group-hover:translate-x-1">
                    {item.label}
                  </span>
                </div>
                <span className={`hidden md:inline font-mono text-sm transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                  →
                </span>
              </button>
            );
          })}
        </aside>

        {/* Content Pane (Only scrollable container in the viewport) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {connectionStatus === 'error' && (
            <div className="mb-6 p-4 bg-rose-50/50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 animate-slide-up shrink-0">
              <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold font-mono text-sm uppercase tracking-wider">Database Connection Error</h4>
                <p className="text-sm leading-relaxed text-rose-700/90 font-sans">
                  The dashboard is unable to communicate with Supabase. Please ensure your project environment keys are active and that the database services are online.
                </p>
                {connectionErrorMessage && (
                  <p className="text-xs font-mono bg-rose-100/50 p-2 rounded border border-rose-200 text-rose-900 overflow-x-auto max-w-full">
                    {connectionErrorMessage}
                  </p>
                )}
              </div>
              <button 
                type="button"
                onClick={async () => {
                  setConnectionStatus('checking');
                  try {
                    const { error: pingError } = await supabase.from('projects').select('id', { head: true, count: 'exact' });
                    if (pingError) throw pingError;
                    setConnectionStatus('connected');
                    setConnectionErrorMessage('');
                    showToast('Successfully reconnected to Supabase!');
                  } catch (err: any) {
                    setConnectionStatus('error');
                    setConnectionErrorMessage(err.message || 'Connection ping failed');
                    showToast('Reconnection attempt failed.', 'error');
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold font-mono uppercase tracking-wider transition-colors active:scale-95 cursor-pointer shrink-0"
              >
                Retry Ping
              </button>
            </div>
          )}
          
          {/* Projects View */}
          {activeTab === 'projects' && (
            <div className="animate-slide-up space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-double border-brand-dark pb-6">
                <div>
                  <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Projects Showcase</h2>
                  <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Manage dynamically sorting portfolio web projects</p>
                </div>
                <button
                  type="button"
                  onClick={() => openProjectDrawer({
                    id: '',
                    title: '',
                    category: '',
                    accent_color: '#1A1A18',
                    badge: '',
                    tech: [],
                    description: '',
                    link_text: 'Launch Project',
                    link_url: '',
                    sort_order: projects.length + 1
                  })}
                  className="flex items-center gap-2 bg-brand-dark hover:bg-neutral-800 text-white px-5 py-3 rounded-none text-xs font-semibold font-mono tracking-wider transition-all active:scale-98 w-fit uppercase cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Project</span>
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading Supabase tables...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((proj) => (
                    <div 
                      key={proj.id} 
                      className="bg-bg-surface border border-brand-dark rounded-none p-6 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26,26,24,1)] transition-all duration-300 relative group cursor-default"
                    >
                      {/* Accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-dark rounded-t-lg" />
                      
                      <div className="mb-6">
                        <div className="flex justify-between items-start gap-2 mb-4">
                          <span className="text-xs font-mono text-txt-dim font-semibold">{proj.badge || 'No Badge'}</span>
                          <span className="px-2.5 py-1 bg-bg-sidebar border border-border-subtle rounded font-mono text-xs text-txt-muted">Order: {proj.sort_order}</span>
                        </div>
                        <h3 className="font-display font-black text-xl mb-1 text-txt-main">
                          {proj.title}
                        </h3>
                        <p className="text-sm font-semibold font-mono text-txt-muted italic mb-4">{proj.category}</p>
                        <p className="text-sm text-txt-muted line-clamp-3 leading-relaxed mb-4">
                          {proj.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1">
                          {proj.tech.map((t, idx) => (
                            <span key={idx} className="bg-bg-sidebar border border-border-subtle text-txt-muted text-xs font-mono px-2 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border-subtle pt-4 mt-auto">
                        <a 
                          href={proj.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm font-mono text-txt-main hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>{proj.link_text || 'Launch'}</span>
                          <ExternalLink size={14} className="opacity-60" />
                        </a>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openProjectDrawer(proj)}
                            className="p-2.5 bg-bg-sidebar hover:bg-bg-hover text-txt-muted rounded hover:text-txt-main transition-all border border-border-subtle cursor-pointer active:scale-95"
                            title="Edit Project"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-2.5 bg-bg-sidebar hover:bg-rose-50/50 text-txt-muted hover:text-rose-600 hover:border-rose-200 rounded border border-border-subtle transition-colors cursor-pointer active:scale-95"
                            title="Delete Project"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {projects.length === 0 && (
                    <div className="col-span-full border border-dashed border-border-subtle rounded-lg p-12 text-center text-txt-dim font-mono text-sm">
                      No projects found in database. Create one to begin!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="animate-slide-up space-y-8">
              <div className="border-b-4 border-double border-brand-dark pb-6">
                <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Services Showcase</h2>
                <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Manage the visual cards displayed in the Core Expertise section</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading services...
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Services Background Card */}
                  <div className="bg-bg-surface border border-brand-dark rounded-none p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-dark rounded-t-lg" />
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                      <div className="aspect-video w-full md:w-48 rounded border border-border-subtle overflow-hidden bg-bg-main shrink-0 relative shadow-inner">
                        {sectionBackgrounds.find(b => b.id === 'services')?.image_url ? (
                          <img 
                            src={sectionBackgrounds.find(b => b.id === 'services')?.image_url} 
                            alt="Services Background" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-txt-dim font-mono">No Image</div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <h3 className="font-display font-black text-xl text-txt-main">Services Section Background</h3>
                        <p className="text-sm text-txt-muted font-sans">Manage the background image behind the Core Expertise services cards</p>
                        <p className="text-xs font-mono text-txt-dim truncate max-w-md bg-bg-main p-1.5 rounded border border-border-subtle">
                          {sectionBackgrounds.find(b => b.id === 'services')?.image_url || 'Default Cloudinary Asset'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const bg = sectionBackgrounds.find(b => b.id === 'services') || { id: 'services', label: 'Services Section Background', image_url: '' };
                          setEditingSectionBg(bg);
                          setIsSectionBgDrawerOpen(true);
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-bg-sidebar hover:bg-bg-hover text-txt-muted hover:text-txt-main px-5 py-3 rounded text-sm font-semibold font-mono border border-border-subtle cursor-pointer active:scale-98 transition-all shrink-0 animate-fade-in"
                      >
                        <Edit size={14} />
                        <span>Edit Background</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {serviceCards.map((card) => (
                    <div 
                      key={card.id} 
                      className="bg-bg-surface border border-brand-dark rounded-none p-6 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26,26,24,1)] transition-all duration-300 relative group cursor-default"
                    >
                      {/* Top border */}
                      <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-dark rounded-t-lg" />
                      
                      <div className="mb-6 space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-mono text-txt-dim font-semibold uppercase tracking-wider">{card.id}</span>
                          <span className="px-2.5 py-1 bg-bg-sidebar border border-border-subtle rounded font-mono text-xs text-txt-muted">Order: {card.sort_order}</span>
                        </div>
                        
                        <div>
                          <h3 className="font-display font-black text-2xl text-txt-main tracking-wide">
                            {card.title}
                          </h3>
                        </div>

                        {/* Image Preview */}
                        <div className="aspect-video w-full rounded border border-border-subtle overflow-hidden bg-bg-main relative shadow-inner">
                          {card.image_url ? (
                            <img 
                              src={card.image_url} 
                              alt={card.title} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-txt-dim font-mono">No Image Configured</div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-txt-dim font-mono block">Image URL</span>
                          <p className="text-xs font-mono text-txt-muted truncate bg-bg-main p-2 rounded border border-border-subtle">{card.image_url}</p>
                        </div>
                      </div>

                      <div className="border-t border-border-subtle pt-4 mt-auto">
                        <button
                          onClick={() => {
                            setEditingServiceCard(card);
                            setIsServiceDrawerOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-bg-sidebar hover:bg-bg-hover text-txt-muted hover:text-txt-main py-2.5 rounded text-sm font-semibold font-mono border border-border-subtle cursor-pointer active:scale-98 transition-all"
                        >
                          <Edit size={14} />
                          <span>Edit Card Image</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

          {/* Section Videos Tab */}
          {activeTab === 'video' && (
            <div className="animate-slide-up">
              <div className="max-w-2xl bg-bg-surface border border-border-subtle rounded-none p-8 shadow-none">
                <div className="border-b-4 border-double border-brand-dark pb-6 mb-6">
                  <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Section Videos</h2>
                  <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Manage video loops, overlays and opacity configurations for website sections</p>
                </div>        
                  {/* Segment Switcher */}
                  <div className="flex gap-1.5 p-1 bg-bg-main border border-border-subtle rounded-md w-fit font-mono text-sm">
                    <button
                      type="button"
                      onClick={() => setActiveVideoSection('hero')}
                      className={`px-5 py-2.5 rounded transition-all cursor-pointer ${
                        activeVideoSection === 'hero' 
                          ? 'bg-bg-surface text-txt-main shadow-xs font-semibold' 
                          : 'text-txt-muted hover:text-txt-main'
                      }`}
                    >
                      Hero Section
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVideoSection('contact')}
                      className={`px-5 py-2.5 rounded transition-all cursor-pointer ${
                        activeVideoSection === 'contact' 
                          ? 'bg-bg-surface text-txt-main shadow-xs font-semibold' 
                          : 'text-txt-muted hover:text-txt-main'
                      }`}
                    >
                      Contact Section
                    </button>
                  </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading Supabase settings...
                  </div>
                ) : (
                  <form onSubmit={handleSaveVideoSettings} className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold font-mono text-txt-muted uppercase tracking-wider">Video Source URL (.mp4 / .webm / Cloudinary)</label>
                      <input
                        type="url"
                        required
                        value={activeVideoSection === 'hero' ? heroVideo.video_url : contactVideo.video_url}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (activeVideoSection === 'hero') {
                            setHeroVideo({ ...heroVideo, video_url: val });
                          } else {
                            setContactVideo({ ...contactVideo, video_url: val });
                          }
                        }}
                        className="bg-bg-main border border-border-subtle rounded px-4 py-3 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                        placeholder="https://res.cloudinary.com/.../video.mp4"
                      />
                    </div>

                    {(activeVideoSection === 'hero' ? heroVideo.video_url : contactVideo.video_url) && (
                      <div className="aspect-video w-full rounded border border-border-subtle overflow-hidden bg-bg-main shadow-inner relative">
                        <video 
                          key={activeVideoSection === 'hero' ? heroVideo.video_url : contactVideo.video_url}
                          src={activeVideoSection === 'hero' ? heroVideo.video_url : contactVideo.video_url} 
                          className="w-full h-full object-cover transition-opacity duration-500 z-0 pointer-events-none" 
                          style={{ opacity: activeVideoSection === 'hero' ? heroVideo.video_opacity : contactVideo.video_opacity }}
                          muted 
                          autoPlay 
                          loop 
                        />
                        {/* Overlay previews */}
                        <div 
                          className="absolute inset-0 bg-[#0F0B0A] z-10 pointer-events-none mix-blend-multiply transition-opacity" 
                          style={{ opacity: activeVideoSection === 'hero' ? heroVideo.multiply_overlay_opacity : contactVideo.multiply_overlay_opacity }}
                        />
                        <div 
                          className="absolute inset-0 z-10 pointer-events-none" 
                          style={{
                            background: `linear-gradient(to top, rgba(15, 11, 10, ${activeVideoSection === 'hero' ? heroVideo.gradient_overlay_opacity_from : contactVideo.gradient_overlay_opacity_from}) 0%, rgba(15, 11, 10, 0) 50%, rgba(15, 11, 10, ${activeVideoSection === 'hero' ? heroVideo.gradient_overlay_opacity_to : contactVideo.gradient_overlay_opacity_to}) 100%)`
                          }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-txt-muted uppercase tracking-wider">
                          Video Layer Opacity ({Math.round((activeVideoSection === 'hero' ? heroVideo.video_opacity : contactVideo.video_opacity) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={activeVideoSection === 'hero' ? heroVideo.video_opacity : contactVideo.video_opacity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (activeVideoSection === 'hero') {
                              setHeroVideo({ ...heroVideo, video_opacity: val });
                            } else {
                              setContactVideo({ ...contactVideo, video_opacity: val });
                            }
                          }}
                          className="w-full h-1 bg-bg-sidebar rounded-lg appearance-none cursor-pointer accent-brand-dark mt-2"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-txt-muted uppercase tracking-wider">
                          Dark Multiply Blend Opacity ({Math.round((activeVideoSection === 'hero' ? heroVideo.multiply_overlay_opacity : contactVideo.multiply_overlay_opacity) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={activeVideoSection === 'hero' ? heroVideo.multiply_overlay_opacity : contactVideo.multiply_overlay_opacity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (activeVideoSection === 'hero') {
                              setHeroVideo({ ...heroVideo, multiply_overlay_opacity: val });
                            } else {
                              setContactVideo({ ...contactVideo, multiply_overlay_opacity: val });
                            }
                          }}
                          className="w-full h-1 bg-bg-sidebar rounded-lg appearance-none cursor-pointer accent-brand-dark mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-txt-muted uppercase tracking-wider">
                          Top Gradient Shadow-In ({Math.round((activeVideoSection === 'hero' ? heroVideo.gradient_overlay_opacity_from : contactVideo.gradient_overlay_opacity_from) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={activeVideoSection === 'hero' ? heroVideo.gradient_overlay_opacity_from : contactVideo.gradient_overlay_opacity_from}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (activeVideoSection === 'hero') {
                              setHeroVideo({ ...heroVideo, gradient_overlay_opacity_from: val });
                            } else {
                              setContactVideo({ ...contactVideo, gradient_overlay_opacity_from: val });
                            }
                          }}
                          className="w-full h-1 bg-bg-sidebar rounded-lg appearance-none cursor-pointer accent-brand-dark mt-2"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-txt-muted uppercase tracking-wider">
                          Bottom Gradient Shadow-Out ({Math.round((activeVideoSection === 'hero' ? heroVideo.gradient_overlay_opacity_to : contactVideo.gradient_overlay_opacity_to) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={activeVideoSection === 'hero' ? heroVideo.gradient_overlay_opacity_to : contactVideo.gradient_overlay_opacity_to}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (activeVideoSection === 'hero') {
                              setHeroVideo({ ...heroVideo, gradient_overlay_opacity_to: val });
                            } else {
                              setContactVideo({ ...contactVideo, gradient_overlay_opacity_to: val });
                            }
                          }}
                          className="w-full h-1 bg-bg-sidebar rounded-lg appearance-none cursor-pointer accent-brand-dark mt-2"
                        />
                      </div>
                    </div>

                    <div className="flex gap-8 border-t border-border-subtle pt-6">
                      <label className="flex items-center gap-3 cursor-pointer text-sm font-mono text-txt-muted">
                        <input
                          type="checkbox"
                          checked={!(activeVideoSection === 'hero' ? heroVideo.muted : contactVideo.muted)}
                          onChange={(e) => {
                            const val = !e.target.checked;
                            if (activeVideoSection === 'hero') {
                              setHeroVideo({ ...heroVideo, muted: val });
                            } else {
                              setContactVideo({ ...contactVideo, muted: val });
                            }
                          }}
                          className="rounded border-border-subtle bg-bg-main h-4 w-4 focus:ring-0 focus:ring-offset-0 text-brand-dark cursor-pointer"
                        />
                        <span>Enable Video Sound on Autoplay</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer text-sm font-mono text-txt-muted">
                        <input
                          type="checkbox"
                          checked={activeVideoSection === 'hero' ? heroVideo.loop_video : contactVideo.loop_video}
                          onChange={(e) => {
                            const val = e.target.checked;
                            if (activeVideoSection === 'hero') {
                              setHeroVideo({ ...heroVideo, loop_video: val });
                            } else {
                              setContactVideo({ ...contactVideo, loop_video: val });
                            }
                          }}
                          className="rounded border-border-subtle bg-bg-main h-4 w-4 focus:ring-0 focus:ring-offset-0 text-brand-dark cursor-pointer"
                        />
                        <span>Loop Playback continuously</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="flex items-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white px-7 py-3.5 rounded text-sm font-semibold font-mono tracking-wider transition-all disabled:opacity-50 uppercase shadow-xs active:scale-98 cursor-pointer"
                      >
                        {saveLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                        <span>Save Settings</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* AI Profile Tab */}
          {activeTab === 'ai' && (
            <div className="animate-slide-up">
              <div className="max-w-3xl bg-bg-surface border border-border-subtle rounded-none p-8 shadow-none">
                <div className="border-b-4 border-double border-brand-dark pb-6 mb-6">
                  <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">AI Profile (llms.txt)</h2>
                  <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Update the markdown file read directly by LLMs, scrapers, and chat interfaces</p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading Supabase profile...
                  </div>
                ) : (
                  <form onSubmit={handleSaveLlmText} className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold font-mono text-txt-muted uppercase tracking-wider">Markdown Content</label>
                      <textarea
                        required
                        rows={20}
                        value={llmText}
                        onChange={(e) => setLlmText(e.target.value)}
                        className="w-full bg-bg-main border border-border-subtle rounded px-4 py-4 text-sm font-mono text-txt-main focus:outline-none focus:border-border-focus resize-y leading-relaxed"
                        placeholder="# Miftahul Islam Efaz - Portfolio Index..."
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="flex items-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white px-7 py-3.5 rounded text-sm font-semibold font-mono tracking-wider transition-all disabled:opacity-50 uppercase shadow-xs active:scale-98 cursor-pointer"
                      >
                        {saveLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                        <span>Save Profile</span>
                      </button>
                      
                      <span className="text-xs font-mono text-txt-dim uppercase tracking-wider">
                        Updating triggers auto-build of static /llms.txt
                      </span>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Developer Notes Tab */}
          {activeTab === 'notes' && (
            <div className="animate-slide-up h-full flex flex-col min-h-[600px]">
              <div className="mb-6 flex justify-between items-center shrink-0 border-b-4 border-double border-brand-dark pb-6">
                <div>
                  <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Developer Notes</h2>
                  <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Keep track of Google Drive accounts, Supabase credentials, and project configurations</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNote({
                    title: '',
                    content: ''
                  })}
                  className="flex items-center gap-2 bg-brand-dark hover:bg-neutral-800 text-white px-4 py-2.5 rounded-none text-xs font-semibold font-mono tracking-wider transition-all active:scale-98 uppercase cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Note</span>
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading developer notes...
                </div>
              ) : (
                <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden pb-8">
                  {/* Notes Sidebar List */}
                  <div className="w-full md:w-80 flex flex-col bg-bg-surface border border-brand-dark rounded-none p-4 shrink-0 overflow-hidden h-[500px]">
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search notes..."
                        value={noteSearchQuery}
                        onChange={(e) => setNoteSearchQuery(e.target.value)}
                        className="w-full bg-bg-main border border-border-subtle rounded px-3 py-2 text-sm text-txt-main focus:outline-none focus:border-border-focus font-mono"
                      />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {adminNotes
                        .filter(note => 
                          note.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) || 
                          note.content.toLowerCase().includes(noteSearchQuery.toLowerCase())
                        )
                        .map(note => {
                          const isActive = activeNote?.id === note.id;
                          return (
                            <button
                              key={note.id}
                              onClick={() => setActiveNote(note)}
                              className={`w-full text-left p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-1 select-none ${
                                isActive 
                                  ? 'bg-bg-sidebar border-brand-dark' 
                                  : 'bg-transparent border-border-subtle hover:bg-bg-hover hover:border-border-hover'
                              }`}
                            >
                              <span className="font-semibold text-sm text-txt-main line-clamp-1">{note.title || 'Untitled Note'}</span>
                              <span className="text-xs text-txt-muted line-clamp-2 leading-relaxed">{note.content || 'Empty note content'}</span>
                              <span className="text-[10px] font-mono text-txt-dim mt-1.5 uppercase">
                                {new Date(note.updated_at).toLocaleDateString()}
                              </span>
                            </button>
                          );
                        })}

                      {adminNotes.length === 0 && (
                        <div className="text-center py-10 text-xs font-mono text-txt-dim">
                          No notes found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes Edit Pane */}
                  <div className="flex-1 flex flex-col bg-bg-surface border border-brand-dark rounded-none p-6 overflow-hidden h-[500px]">
                    {activeNote ? (
                      <form onSubmit={handleSaveNote} className="flex-1 flex flex-col min-h-0">
                        <div className="mb-4 shrink-0 flex items-center justify-between gap-4">
                          <input
                            type="text"
                            required
                            placeholder="Note Title..."
                            value={activeNote.title || ''}
                            onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                            className="bg-transparent border-b border-border-subtle focus:border-border-focus pb-2 font-display font-black text-xl text-txt-main focus:outline-none w-full tracking-wide"
                          />
                          {activeNote.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(activeNote.id!)}
                              className="p-2 bg-bg-main hover:bg-rose-50 text-txt-muted hover:text-rose-600 border border-border-subtle hover:border-rose-200 rounded transition-all cursor-pointer shrink-0 active:scale-95"
                              title="Delete Note"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 min-h-0 mb-6">
                          <textarea
                            required
                            placeholder="Write your account credentials, folder IDs, and mappings here..."
                            value={activeNote.content || ''}
                            onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })}
                            className="w-full h-full bg-bg-main border border-border-subtle rounded p-4 text-sm font-mono text-txt-main focus:outline-none focus:border-border-focus resize-none leading-relaxed"
                          />
                        </div>

                        <div className="flex justify-end gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveNote(null)}
                            className="px-5 py-2.5 border border-border-subtle hover:bg-bg-hover text-txt-muted hover:text-txt-main text-sm font-mono rounded transition-all uppercase cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saveLoading}
                            className="flex items-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white px-6 py-2.5 rounded text-sm font-semibold font-mono tracking-wider transition-all disabled:opacity-50 uppercase shadow-xs cursor-pointer active:scale-98"
                          >
                            {saveLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            <span>Save Note</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-subtle rounded-md">
                        <FileText size={32} className="text-txt-dim opacity-40 mb-3" />
                        <h3 className="text-sm font-mono font-semibold text-txt-main uppercase tracking-wider">No Note Selected</h3>
                        <p className="text-xs text-txt-muted mt-1 max-w-xs leading-relaxed">
                          Select a note from the sidebar or click "New Note" to create a fresh record.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inbox Submissions Tab */}
          {activeTab === 'inbox' && (
            <div className="animate-slide-up">
              <div className="border-b-4 border-double border-brand-dark pb-6 mb-8">
                <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Inbox Submissions</h2>
                <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Review contact form submissions logged directly by client leads</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading submissions...
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl animate-slide-up">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="bg-bg-surface border border-brand-dark rounded-none p-6 hover:shadow-[4px_4px_0px_0px_rgba(26,26,24,1)] transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-txt-main text-base">{sub.name}</h3>
                          <a href={`mailto:${sub.email}`} className="text-sm font-mono text-txt-main hover:underline font-semibold">
                            {sub.email}
                          </a>
                        </div>
                        <span className="text-xs font-mono text-txt-dim">
                          {new Date(sub.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-txt-muted whitespace-pre-wrap leading-relaxed">
                        {sub.message}
                      </p>
                    </div>
                  ))}

                  {submissions.length === 0 && (
                    <div className="border border-dashed border-border-subtle rounded-lg p-12 text-center text-txt-dim font-mono text-sm">
                      Inbox is empty. No submissions recorded yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vibe Check Tab */}
          {activeTab === 'ratings' && (
            <div className="animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-4 border-double border-brand-dark pb-6">
                <div>
                  <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Vibe Check Ratings</h2>
                  <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Client and visitor experience logs</p>
                </div>
                
                {/* Analytics card */}
                <div className="bg-bg-surface border border-border-subtle rounded-none px-6 py-4 flex gap-8 shadow-none">
                  <div className="text-center">
                    <p className="text-[10px] font-semibold font-mono text-txt-dim uppercase tracking-widest mb-1">Average Vibe</p>
                    <p className="font-serif italic text-3xl text-txt-main font-medium">{averageRating}%</p>
                  </div>
                  <div className="w-px bg-border-subtle my-1" />
                  <div className="text-center">
                    <p className="text-[10px] font-semibold font-mono text-txt-dim uppercase tracking-widest mb-1">Total Ratings</p>
                    <p className="font-serif italic text-3xl text-txt-main font-medium">{ratings.length}</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-[#a3a3a3] font-mono text-sm gap-3">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading vibe check...
                </div>
              ) : (
                <div className="max-w-4xl bg-bg-surface border border-brand-dark rounded-none overflow-hidden animate-slide-up">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-subtle text-xs font-bold font-mono text-txt-muted uppercase tracking-wider bg-bg-sidebar">
                          <th className="py-4 px-6">Visitor / Client</th>
                          <th className="py-4 px-6 text-center">Score</th>
                          <th className="py-4 px-6">Vibe Label</th>
                          <th className="py-4 px-6">Timestamp</th>
                          <th className="py-4 px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle font-mono text-sm text-txt-muted bg-bg-surface">
                        {ratings.map((rate) => (
                          <tr key={rate.id} className="hover:bg-bg-hover transition-colors">
                            <td className="py-4 px-6 text-txt-main font-sans font-semibold">{rate.user_name}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                                rate.rating >= 80 
                                  ? 'bg-brand-dark text-white border-brand-dark' 
                                  : rate.rating >= 50
                                  ? 'bg-bg-sidebar text-txt-main border-border-subtle'
                                  : 'bg-transparent text-txt-muted border-border-subtle'
                              }`}>
                                {rate.rating}%
                              </span>
                            </td>
                            <td className="py-4 px-6 italic">{rate.vibe_label}</td>
                            <td className="py-4 px-6 text-txt-dim">
                              {new Date(rate.created_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleDeleteRating(rate.id)}
                                className="p-2 bg-bg-sidebar hover:bg-rose-50/50 text-txt-muted hover:text-rose-600 hover:border-rose-200 rounded border border-border-subtle transition-colors cursor-pointer active:scale-95"
                                title="Delete rating entry"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {ratings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-txt-dim">
                              No vibe logs found in the database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outcomes Gallery Tab */}
          {activeTab === 'outcomes' && (
            <div className="animate-slide-up space-y-8">
              <div className="border-b-4 border-double border-brand-dark pb-6">
                <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Outcomes Gallery</h2>
                <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Manage the layered parallax images displayed in the Outcomes section</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading outcomes images...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outcomesImages.map((card) => (
                    <div 
                      key={card.id} 
                      className="bg-bg-surface border border-brand-dark rounded-none p-6 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26,26,24,1)] transition-all duration-300 relative group cursor-default"
                    >
                      {/* Top border */}
                      <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-dark rounded-t-lg" />
                      
                      <div className="mb-6 space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-mono text-txt-dim font-semibold uppercase tracking-wider">{card.id}</span>
                        </div>
                        
                        <div>
                          <h3 className="font-display font-black text-xl text-txt-main tracking-wide">
                            {card.label}
                          </h3>
                        </div>

                        {/* Image Preview */}
                        <div className="aspect-video w-full rounded border border-border-subtle overflow-hidden bg-[#0A0A0A] relative shadow-inner flex items-center justify-center">
                          {card.image_url ? (
                            <img 
                              src={card.image_url} 
                              alt={card.label} 
                              className="max-w-full max-h-full object-contain" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-txt-dim font-mono">No Image Configured</div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-txt-dim font-mono block">Image URL</span>
                          <p className="text-xs font-mono text-txt-muted truncate bg-bg-main p-2 rounded border border-border-subtle">{card.image_url}</p>
                        </div>
                      </div>

                      <div className="border-t border-border-subtle pt-4 mt-auto">
                        <button
                          onClick={() => {
                            setEditingOutcomesImage(card);
                            setIsOutcomesDrawerOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-bg-sidebar hover:bg-bg-hover text-txt-muted hover:text-txt-main py-2.5 rounded text-sm font-semibold font-mono border border-border-subtle cursor-pointer active:scale-98 transition-all"
                        >
                          <Edit size={14} />
                          <span>Edit Asset Image</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Testimonials Showcase Tab */}
          {activeTab === 'testimonials' && (
            <div className="animate-slide-up space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-double border-brand-dark pb-6">
                <div>
                  <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Testimonials Showcase</h2>
                  <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Manage dynamic client reviews, portrait images, and section background</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTestimonial({
                      id: 'client-' + Date.now(),
                      name: '',
                      role: '',
                      quote: '',
                      image_url: '',
                      sort_order: testimonials.length + 1
                    });
                    setIsTestimonialDrawerOpen(true);
                  }}
                  className="flex items-center gap-2 bg-brand-dark hover:bg-neutral-800 text-white px-5 py-3 rounded-none text-xs font-semibold font-mono tracking-wider transition-all active:scale-98 w-fit uppercase cursor-pointer animate-fade-in"
                >
                  <Plus size={14} />
                  <span>Add Testimonial</span>
                </button>
              </div>

              {/* Testimonials Background Card */}
              <div className="bg-bg-surface border border-brand-dark rounded-none p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-dark rounded-t-lg" />
                <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                  <div className="aspect-video w-full md:w-48 rounded border border-border-subtle overflow-hidden bg-bg-main shrink-0 relative shadow-inner">
                    {sectionBackgrounds.find(b => b.id === 'testimonials')?.image_url ? (
                      <img 
                        src={sectionBackgrounds.find(b => b.id === 'testimonials')?.image_url} 
                        alt="Testimonials Background" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-txt-dim font-mono">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <h3 className="font-display font-black text-xl text-txt-main">Testimonials Section Background</h3>
                    <p className="text-sm text-txt-muted font-sans">Manage the background overlay layout image inside the testimonials feedback section</p>
                    <p className="text-xs font-mono text-txt-dim truncate max-w-md bg-bg-main p-1.5 rounded border border-border-subtle">
                      {sectionBackgrounds.find(b => b.id === 'testimonials')?.image_url || 'Default Cloudinary Asset'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const bg = sectionBackgrounds.find(b => b.id === 'testimonials') || { id: 'testimonials', label: 'Testimonials Section Background', image_url: '' };
                      setEditingSectionBg(bg);
                      setIsSectionBgDrawerOpen(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-bg-sidebar hover:bg-bg-hover text-txt-muted hover:text-txt-main px-5 py-3 rounded text-sm font-semibold font-mono border border-border-subtle cursor-pointer active:scale-98 transition-all shrink-0"
                  >
                    <Edit size={14} />
                    <span>Edit Background</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading client reviews...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {testimonials.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-bg-surface border border-brand-dark rounded-none p-6 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26,26,24,1)] transition-all duration-300 relative group cursor-default animate-fade-in"
                    >
                      <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-dark rounded-t-lg" />
                      
                      <div className="mb-6 space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-mono text-txt-dim font-semibold uppercase tracking-wider">{item.id}</span>
                          <span className="px-2.5 py-1 bg-bg-sidebar border border-border-subtle rounded font-mono text-xs text-txt-muted">Order: {item.sort_order}</span>
                        </div>

                        {/* Client image preview */}
                        <div className="aspect-square w-24 h-24 mx-auto rounded-full border border-border-subtle overflow-hidden bg-bg-main relative shadow-inner">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-txt-dim font-mono">No Image</div>
                          )}
                        </div>

                        <div className="text-center">
                          <h3 className="font-semibold text-lg text-txt-main">{item.name}</h3>
                          <p className="text-xs font-mono text-txt-muted uppercase tracking-wider mt-0.5">{item.role}</p>
                        </div>

                        <p className="text-sm text-txt-muted italic text-center px-2 line-clamp-4 leading-relaxed font-sans">
                          {item.quote}
                        </p>
                      </div>

                      <div className="flex gap-2 border-t border-border-subtle pt-4 mt-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTestimonial(item);
                            setIsTestimonialDrawerOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-bg-sidebar hover:bg-bg-hover text-txt-muted hover:text-txt-main py-2.5 rounded text-sm font-semibold font-mono border border-border-subtle cursor-pointer active:scale-95 transition-all animate-fade-in"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTestimonial(item.id)}
                          className="p-2.5 bg-bg-sidebar hover:bg-rose-50/50 text-txt-muted hover:text-rose-600 hover:border-rose-200 rounded border border-border-subtle transition-colors cursor-pointer active:scale-95 animate-fade-in"
                          title="Delete testimonial"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {testimonials.length === 0 && (
                    <div className="col-span-full border border-dashed border-border-subtle rounded-lg p-12 text-center text-txt-dim font-mono text-sm">
                      No testimonials found in database. Create one to begin!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer Showcase Tab */}
          {activeTab === 'footer' && (
            <div className="animate-slide-up space-y-8">
              <div className="border-b-4 border-double border-brand-dark pb-6">
                <h2 className="font-serif italic text-4xl text-txt-main font-semibold tracking-tight">Footer Showcase</h2>
                <p className="text-xs font-mono text-txt-muted uppercase tracking-widest mt-1.5">Manage the portrait card and background layout images inside the website footer</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-txt-muted font-mono text-sm gap-3">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading footer settings...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Footer Portrait Card */}
                  <div className="bg-bg-surface border border-brand-dark rounded-none p-6 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26,26,24,1)] transition-all duration-300 relative group cursor-default">
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-dark" />
                    
                    <div className="mb-6 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-mono text-txt-dim font-semibold uppercase tracking-wider">footer_portrait</span>
                        <span className="px-2.5 py-1 bg-bg-sidebar border border-brand-dark font-mono text-xs text-txt-muted">Section: Footer</span>
                      </div>
                      
                      <div>
                        <h3 className="font-display font-black text-xl text-txt-main tracking-wide">
                          Footer Portrait Image
                        </h3>
                        <p className="text-sm text-txt-muted mt-1">Updates the grayscale portrait photo card of Efaz shown in both desktop and mobile viewports</p>
                      </div>

                      {/* Image Preview */}
                      <div className="aspect-square w-32 h-32 mx-auto rounded-none border border-brand-dark overflow-hidden bg-bg-main relative shadow-inner">
                        {sectionBackgrounds.find(b => b.id === 'footer_portrait')?.image_url ? (
                          <img 
                            src={sectionBackgrounds.find(b => b.id === 'footer_portrait')?.image_url} 
                            alt="Footer Portrait" 
                            className="w-full h-full object-cover object-top" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-txt-dim font-mono">No Image</div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-txt-dim font-mono block">Image URL</span>
                        <p className="text-xs font-mono text-txt-muted truncate bg-bg-main p-2 rounded-none border border-brand-dark">
                          {sectionBackgrounds.find(b => b.id === 'footer_portrait')?.image_url || 'No URL configured'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-brand-dark pt-4 mt-auto">
                      <button
                        onClick={() => {
                          const bg = sectionBackgrounds.find(b => b.id === 'footer_portrait') || { id: 'footer_portrait', label: 'Footer Portrait Image', image_url: '' };
                          setEditingSectionBg(bg);
                          setIsSectionBgDrawerOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-bg-sidebar hover:bg-brand-dark text-txt-main hover:text-brand-light py-2.5 rounded-none text-xs font-semibold font-mono border border-brand-dark cursor-pointer active:scale-98 transition-all uppercase tracking-wider"
                      >
                        <Edit size={14} />
                        <span>Edit Portrait Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Background Card */}
                  <div className="bg-bg-surface border border-brand-dark rounded-none p-6 flex flex-col justify-between hover:shadow-[4px_4px_0px_0px_rgba(26,26,24,1)] transition-all duration-300 relative group cursor-default">
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-brand-dark" />
                    
                    <div className="mb-6 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-mono text-txt-dim font-semibold uppercase tracking-wider">footer_bg</span>
                        <span className="px-2.5 py-1 bg-bg-sidebar border border-brand-dark font-mono text-xs text-txt-muted">Section: Footer</span>
                      </div>
                      
                      <div>
                        <h3 className="font-display font-black text-xl text-txt-main tracking-wide">
                          Footer Section Background
                        </h3>
                        <p className="text-sm text-txt-muted mt-1">Updates the deep layout parallax background image displayed behind the name text in desktop viewports</p>
                      </div>

                      {/* Image Preview */}
                      <div className="aspect-video w-full rounded-none border border-brand-dark overflow-hidden bg-bg-main relative shadow-inner">
                        {sectionBackgrounds.find(b => b.id === 'footer_bg')?.image_url ? (
                          <img 
                            src={sectionBackgrounds.find(b => b.id === 'footer_bg')?.image_url} 
                            alt="Footer Background" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-txt-dim font-mono">No Image</div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-txt-dim font-mono block">Image URL</span>
                        <p className="text-xs font-mono text-txt-muted truncate bg-bg-main p-2 rounded-none border border-brand-dark">
                          {sectionBackgrounds.find(b => b.id === 'footer_bg')?.image_url || 'No URL configured'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-brand-dark pt-4 mt-auto">
                      <button
                        onClick={() => {
                          const bg = sectionBackgrounds.find(b => b.id === 'footer_bg') || { id: 'footer_bg', label: 'Footer Section Background', image_url: '' };
                          setEditingSectionBg(bg);
                          setIsSectionBgDrawerOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-bg-sidebar hover:bg-brand-dark text-txt-main hover:text-brand-light py-2.5 rounded-none text-xs font-semibold font-mono border border-brand-dark cursor-pointer active:scale-98 transition-all uppercase tracking-wider"
                      >
                        <Edit size={14} />
                        <span>Edit Background Image</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-lg border shadow-lg animate-slide-up font-sans text-sm ${
          toast.type === 'success'
            ? 'bg-bg-surface border-emerald-200 text-emerald-800'
            : 'bg-bg-surface border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
