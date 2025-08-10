import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid
} from '@heroicons/react/24/solid';

interface Announcement {
  id: number;
  title: string;
  content: string;
  course_id: number;
  image_url?: string;
  author_id: number;
  author: {
    id: number;
    email: string;
    username: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
  };
  created_at: string;
  updated_at?: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  user_reaction?: 'like' | 'dislike';
}

interface Course {
  id: number;
  name: string;
  description: string;
  code: string;
}

export const Announcements: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null as File | null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [announcementsResponse, courseResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/announcements/course/${courseId}`),
          axios.get(`http://localhost:8000/api/courses/${courseId}`)
        ]);
        
        setAnnouncements(announcementsResponse.data);
        setCourse(courseResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('course_id', courseId!);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const response = await axios.post('http://localhost:8000/api/announcements/', formDataToSend);
      setAnnouncements(prev => [response.data, ...prev]);
      setShowCreateForm(false);
      setFormData({ title: '', content: '', image: null });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create announcement');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const response = await axios.put(`http://localhost:8000/api/announcements/${editingId}`, formDataToSend);
      setAnnouncements(prev => prev.map(ann => ann.id === editingId ? response.data : ann));
      setEditingId(null);
      setFormData({ title: '', content: '', image: null });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update announcement');
    }
  };

  const handleDelete = async (announcementId: number) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await axios.delete(`http://localhost:8000/api/announcements/${announcementId}`);
      setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete announcement');
    }
  };

  const handleReaction = async (announcementId: number, reactionType: 'like' | 'dislike') => {
    try {
      if (user?.role !== 'student') return;
      
      const announcement = announcements.find(ann => ann.id === announcementId);
      if (!announcement) return;

      if (announcement.user_reaction === reactionType) {
        // Remove reaction
        await axios.delete(`http://localhost:8000/api/announcements/${announcementId}/react`);
        setAnnouncements(prev => prev.map(ann => {
          if (ann.id === announcementId) {
            const newAnn = { ...ann, user_reaction: undefined };
            if (reactionType === 'like') {
              newAnn.like_count = Math.max(0, ann.like_count - 1);
            } else {
              newAnn.dislike_count = Math.max(0, ann.dislike_count - 1);
            }
            return newAnn;
          }
          return ann;
        }));
      } else {
        // Add/change reaction
        const formData = new FormData();
        formData.append('reaction_type', reactionType);
        
        await axios.post(`http://localhost:8000/api/announcements/${announcementId}/react`, formData);
        setAnnouncements(prev => prev.map(ann => {
          if (ann.id === announcementId) {
            const newAnn = { ...ann, user_reaction: reactionType };
            if (ann.user_reaction === 'like') {
              newAnn.like_count = Math.max(0, ann.like_count - 1);
            } else if (ann.user_reaction === 'dislike') {
              newAnn.dislike_count = Math.max(0, ann.dislike_count - 1);
            }
            if (reactionType === 'like') {
              newAnn.like_count += 1;
            } else {
              newAnn.dislike_count += 1;
            }
            return newAnn;
          }
          return ann;
        }));
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to react to announcement');
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      image: null
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {course?.name} - Announcements
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Course Code: {course?.code}
              </p>
            </div>
            {user?.role === 'professor' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Announcement
              </button>
            )}
          </div>

          {/* Create/Edit Form */}
          {(showCreateForm || editingId) && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingId ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <form onSubmit={editingId ? handleEdit : handleCreate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Image (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingId(null);
                      setFormData({ title: '', content: '', image: null });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Announcements List */}
          <div className="space-y-6">
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.role === 'professor' 
                    ? 'Get started by creating an announcement.'
                    : 'No announcements have been posted yet.'
                  }
                </p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="bg-white shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {announcement.title}
                        </h3>
                        <div className="mt-1 text-sm text-gray-500">
                          <span>By: {announcement.author.full_name}</span>
                          <span className="mx-2">•</span>
                          <span>{announcement.author.email}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {announcement.content}
                        </p>
                        {announcement.image_url && (
                          <div className="mt-4">
                            <img
                              src={`http://localhost:8000/${announcement.image_url}`}
                              alt="Announcement"
                              className="max-w-md rounded-lg"
                              onError={(e) => {
                                console.error('Failed to load image:', announcement.image_url);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                          <span>
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </span>
                          {announcement.updated_at && (
                            <span>
                              Updated: {new Date(announcement.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {user?.role === 'professor' && announcement.author_id === user.id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(announcement)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Reactions and Comments */}
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {user?.role === 'student' && (
                          <>
                            <button
                              onClick={() => handleReaction(announcement.id, 'like')}
                              className={`flex items-center space-x-1 ${
                                announcement.user_reaction === 'like' 
                                  ? 'text-red-500' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                            >
                              {announcement.user_reaction === 'like' ? (
                                <HeartIconSolid className="h-4 w-4" />
                              ) : (
                                <HeartIcon className="h-4 w-4" />
                              )}
                              <span className="text-sm">{announcement.like_count}</span>
                            </button>
                            
                            <button
                              onClick={() => handleReaction(announcement.id, 'dislike')}
                              className={`flex items-center space-x-1 ${
                                announcement.user_reaction === 'dislike' 
                                  ? 'text-blue-500' 
                                  : 'text-gray-400 hover:text-blue-500'
                              }`}
                            >
                              {announcement.user_reaction === 'dislike' ? (
                                <HandThumbDownIconSolid className="h-4 w-4" />
                              ) : (
                                <HandThumbDownIcon className="h-4 w-4" />
                              )}
                              <span className="text-sm">{announcement.dislike_count}</span>
                            </button>
                          </>
                        )}
                        
                        {user?.role === 'professor' && (
                          <div className="flex items-center space-x-4 text-gray-400">
                            <div className="flex items-center space-x-1">
                              <HeartIcon className="h-4 w-4" />
                              <span className="text-sm">{announcement.like_count} likes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <HandThumbDownIcon className="h-4 w-4" />
                              <span className="text-sm">{announcement.dislike_count} dislikes</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1 text-gray-400">
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                          <span className="text-sm">{announcement.comment_count} comments</span>
                        </div>
                      </div>
                      
                      <Link
                        to={`/announcements/${announcement.id}`}
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 