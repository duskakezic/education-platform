import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface Material {
  id: number;
  title: string;
  description: string;
  course_id: number;
  file_url: string;
  file_name: string;
  file_size: number;
  author_id: number;
  created_at: string;
}

interface Course {
  id: number;
  name: string;
  description: string;
  code: string;
}

export const Materials: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsResponse, courseResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/materials/course/${courseId}`),
          axios.get(`http://localhost:8000/api/courses/${courseId}`)
        ]);
        
        setMaterials(materialsResponse.data);
        setCourse(courseResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      alert('Please select a file');
      return;
    }
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('course_id', courseId!);
    formDataToSend.append('file', formData.file);

    try {
      const response = await axios.post('http://localhost:8000/api/materials/', formDataToSend);
      setMaterials(prev => [response.data, ...prev]);
      setShowUploadForm(false);
      setFormData({ title: '', description: '', file: null });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to upload material');
    }
  };

  const handleDelete = async (materialId: number) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await axios.delete(`http://localhost:8000/api/materials/${materialId}`);
      setMaterials(prev => prev.filter(material => material.id !== materialId));
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete material');
    }
  };

  const handleDownload = async (materialId: number, fileName: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/materials/download/${materialId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      default:
        return '📄';
    }
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
                {course?.name} - Learning Materials
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Course Code: {course?.code}
              </p>
            </div>
            {user?.role === 'professor' && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload Material
              </button>
            )}
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upload New Material
              </h3>
              <form onSubmit={handleUpload}>
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
                      Description
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      File (PDF or TXT)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      required
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum file size: 10MB. Supported formats: PDF, TXT
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Upload Material
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadForm(false);
                      setFormData({ title: '', description: '', file: null });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Materials List */}
          <div className="space-y-4">
            {materials.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No materials</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.role === 'professor' 
                    ? 'Get started by uploading learning materials.'
                    : 'No learning materials have been uploaded yet.'
                  }
                </p>
              </div>
            ) : (
              materials.map((material) => (
                <div key={material.id} className="bg-white shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <span className="text-3xl">{getFileIcon(material.file_name)}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {material.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {material.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>File: {material.file_name}</span>
                            <span>Size: {formatFileSize(material.file_size)}</span>
                            <span>Uploaded: {new Date(material.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(material.id, material.file_name)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Download
                        </button>
                        
                        {user?.role === 'professor' && material.author_id === user.id && (
                          <button
                            onClick={() => handleDelete(material.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
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