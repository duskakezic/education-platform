import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  PencilIcon, 
  TrashIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  HandThumbDownIcon,
  ArrowLeftIcon
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

interface Comment {
  id: number;
  content: string;
  author_id: number;
  announcement_id: number;
  created_at: string;
  updated_at?: string;
  author: {
    id: number;
    email: string;
    username: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
  };
}

interface Course {
  id: number;
  name: string;
  description: string;
  code: string;
}

export const AnnouncementDetail: React.FC = () => {
  const { announcementId } = useParams<{ announcementId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentFormData, setCommentFormData] = useState({
    content: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const announcementResponse = await axios.get(`http://localhost:8000/api/announcements/${announcementId}`);
        const courseResponse = await axios.get(`http://localhost:8000/api/courses/${announcementResponse.data.course_id}`);
        const commentsResponse = await axios.get(`http://localhost:8000/api/announcements/${announcementId}/comments`);
        
        setAnnouncement(announcementResponse.data);
        setCourse(courseResponse.data);
        setComments(commentsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (announcementId) {
      fetchData();
    }
  }, [announcementId]);

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    try {
      // If user already has this reaction, remove it
      if (announcement?.user_reaction === reactionType) {
        await axios.delete(`http://localhost:8000/api/announcements/${announcementId}/react`);
      } else {
        // Otherwise, add/update the reaction
        const formData = new FormData();
        formData.append('reaction_type', reactionType);
        
        await axios.post(`http://localhost:8000/api/announcements/${announcementId}/react`, formData);
      }
      
      // Refresh announcement data to get updated reaction counts
      const response = await axios.get(`http://localhost:8000/api/announcements/${announcementId}`);
      setAnnouncement(response.data);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to react to announcement');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await axios.delete(`http://localhost:8000/api/announcements/${announcementId}`);
      navigate(`/courses/${announcement?.course_id}/announcements`);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete announcement');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentFormData.content.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      if (editingCommentId) {
        // Update existing comment
        await axios.put(`http://localhost:8000/api/announcements/comments/${editingCommentId}`, {
          content: commentFormData.content
        });
      } else {
        // Create new comment
        await axios.post(`http://localhost:8000/api/announcements/${announcementId}/comments`, {
          content: commentFormData.content,
          announcement_id: parseInt(announcementId!)
        });
      }
      
      // Refresh comments
      const response = await axios.get(`http://localhost:8000/api/announcements/${announcementId}/comments`);
      setComments(response.data);
      
      setShowCommentForm(false);
      setEditingCommentId(null);
      setCommentFormData({ content: '' });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to submit comment');
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await axios.delete(`http://localhost:8000/api/announcements/comments/${commentId}`);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete comment');
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setCommentFormData({ content: comment.content });
    setShowCommentForm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Announcement not found</h1>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-500">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {announcement.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Course: {course?.code} - {course?.name}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  By: {announcement.author.full_name} ({announcement.author.email})
                </p>
              </div>
            </div>
            
            {user?.role === 'professor' && announcement.author_id === user.id && (
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/courses/${announcement.course_id}/announcements`)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Announcement Content */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
            </div>
            
            {announcement.image_url && (
              <div className="mt-6">
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
            
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-6">
                <span>
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
                {announcement.updated_at && (
                  <span>
                    Updated: {new Date(announcement.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {user?.role === 'student' && (
                  <>
                    <button
                      onClick={() => handleReaction('like')}
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
                      onClick={() => handleReaction('dislike')}
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
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Comments ({comments.length})
              </h3>
              {user?.role === 'student' && (
                <button
                  onClick={() => setShowCommentForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  Add Comment
                </button>
              )}
            </div>

            {/* Comment Form */}
            {showCommentForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <form onSubmit={handleCommentSubmit}>
                  <textarea
                    value={commentFormData.content}
                    onChange={(e) => setCommentFormData({ content: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Write your comment..."
                    required
                  />
                  <div className="mt-3 flex space-x-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingCommentId ? 'Update' : 'Post'} Comment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCommentForm(false);
                        setEditingCommentId(null);
                        setCommentFormData({ content: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">{comment.author.full_name}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                      
                      {user?.id === comment.author_id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditComment(comment)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 