import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { AcademicCapIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Course {
  id: number;
  name: string;
  description: string;
  code: string;
  is_active: boolean;
}

interface Enrollment {
  id: number;
  course_id: number;
  enrolled_at: string;
}

export const Courses: React.FC = () => {
  const { user: _user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [unenrolling, setUnenrolling] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/courses/'),
          axios.get('http://localhost:8000/api/courses/my-enrollments')
        ]);
        
        setCourses(coursesResponse.data);
        setEnrollments(enrollmentsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const isEnrolled = (courseId: number) => {
    return enrollments.some(enrollment => enrollment.course_id === courseId);
  };

  const handleEnroll = async (courseId: number) => {
    setEnrolling(courseId);
    try {
      await axios.post('http://localhost:8000/api/courses/enroll', { course_id: courseId });
      const newEnrollment = {
        id: Date.now(), // Temporary ID
        course_id: courseId,
        enrolled_at: new Date().toISOString()
      };
      setEnrollments(prev => [...prev, newEnrollment]);
    } catch (error: any) {
      console.error('Failed to enroll:', error);
      alert(error.response?.data?.detail || 'Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnenroll = async (courseId: number) => {
    setUnenrolling(courseId);
    try {
      await axios.delete(`http://localhost:8000/api/courses/unenroll/${courseId}`);
      setEnrollments(prev => prev.filter(enrollment => enrollment.course_id !== courseId));
    } catch (error: any) {
      console.error('Failed to unenroll:', error);
      alert(error.response?.data?.detail || 'Failed to unenroll from course');
    } finally {
      setUnenrolling(null);
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
              <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse and enroll in courses. You can enroll in up to 3 courses.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Enrolled: {enrollments.length}/3
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const enrolled = isEnrolled(course.id);
              const canEnroll = enrollments.length < 3 || enrolled;
              
              return (
                <div
                  key={course.id}
                  className={`bg-white overflow-hidden shadow rounded-lg border-2 ${
                    enrolled ? 'border-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {course.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Code: {course.code}
                          </p>
                        </div>
                      </div>
                      {enrolled && (
                        <div className="flex items-center text-blue-600">
                          <CheckIcon className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Enrolled</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="mt-4 text-sm text-gray-600">
                      {course.description}
                    </p>
                    
                    <div className="mt-6">
                      {enrolled ? (
                        <button
                          onClick={() => handleUnenroll(course.id)}
                          disabled={unenrolling === course.id}
                          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {unenrolling === course.id ? 'Unenrolling...' : 'Unenroll'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={!canEnroll || enrolling === course.id}
                          className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                            canEnroll
                              ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          } disabled:opacity-50`}
                        >
                          {enrolling === course.id ? (
                            'Enrolling...'
                          ) : (
                            <>
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Enroll
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {enrollments.length >= 3 && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Maximum courses reached
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You have enrolled in the maximum number of courses (3). 
                      To enroll in a new course, you must first unenroll from an existing one.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 