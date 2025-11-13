import React, { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  TrendingUp,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';

import { useDarkMode } from '../store';

import type { ResumeData, ScoreData } from '../interfaces/interfaces';

type TabType = 'upload' | 'insights' | 'job' | 'score' | 'settings';

const Dashboard: React.FC = () => {
  const darkMode = useDarkMode((state) => state.darkMode);
  const [activeTab, setActiveTab] = useState<TabType>('upload');

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Sample data (will be populated from API)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);

  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        setResumeFile(file);
        showNotification('success', 'Resume uploaded successfully!');
      } else {
        showNotification('error', 'Please upload a valid PDF file');
      }
    },
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      showNotification('success', 'Resume uploaded successfully!');
    } else {
      showNotification('error', 'Please upload a valid PDF file');
    }
  }, []);

  const handleSubmit = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      showNotification(
        'error',
        'Please upload a resume and enter job description'
      );
      return;
    }

    setIsLoading(true);

    // Simulating API call - Replace with actual Axios call
    setTimeout(() => {
      // Mock data
      setResumeData({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        skills: [
          'React',
          'TypeScript',
          'Python',
          'Django',
          'Node.js',
          'AWS',
          'Docker',
        ],
        experience:
          '5+ years in full-stack development with expertise in modern web technologies',
        education: 'B.S. Computer Science, MIT',
      });

      setScoreData({
        overallScore: 85,
        matchedSkills: ['React', 'TypeScript', 'Python', 'Django'],
        missingSkills: ['Kubernetes', 'GraphQL', 'Redis'],
        recommendations: [
          'Add more details about cloud deployment experience',
          'Include specific project metrics and outcomes',
          'Highlight leadership and team collaboration skills',
        ],
        skillsMatch: 82,
        experienceMatch: 88,
        keywordMatch: 85,
      });

      setIsLoading(false);
      setActiveTab('insights');
      showNotification('success', 'Analysis complete! Check your results.');
    }, 2000);

    /* Actual API implementation:
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('job_description', jobDescription);

    try {
      const response = await axios.post('http://your-django-api/api/analyze/', formData);
      setResumeData(response.data.resume);
      setScoreData(response.data.score);
      setActiveTab('insights');
      showNotification('success', 'Analysis complete!');
    } catch (error) {
      showNotification('error', 'Failed to analyze resume');
    } finally {
      setIsLoading(false);
    }
    */
  };

  const tabs = [
    { id: 'upload' as TabType, label: 'Upload', icon: Upload },
    { id: 'insights' as TabType, label: 'Resume Insights', icon: FileText },
    { id: 'score' as TabType, label: 'Score Overview', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className={`min-h-screen ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-green-500'
              : notification.type === 'error'
              ? 'bg-red-500'
              : 'bg-blue-500'
          } text-white`}
        >
          {notification.type === 'success' ? (
            <CheckCircle size={20} />
          ) : notification.type === 'error' ? (
            <XCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside
          className={`w-64 min-h-screen ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          } border-r p-6`}
        >
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Upload & Analyze</h2>

              {/* Resume Upload */}
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-6`}
              >
                <h3 className="text-xl font-semibold mb-4">
                  Upload Resume (PDF)
                </h3>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center ${
                    darkMode
                      ? 'border-gray-600 hover:border-blue-500'
                      : 'border-gray-300 hover:border-blue-500'
                  } transition-colors cursor-pointer`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="mx-auto mb-4 text-blue-500" size={48} />
                    <p className="text-lg font-medium mb-2">
                      {resumeFile
                        ? resumeFile.name
                        : 'Drop your resume here or click to browse'}
                    </p>
                    <p
                      className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Supports PDF format only
                    </p>
                  </label>
                </div>
              </div>

              {/* Job Description */}
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-6`}
              >
                <h3 className="text-xl font-semibold mb-4">Job Description</h3>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className={`w-full h-48 p-4 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading || !resumeFile || !jobDescription.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp size={20} />
                    Analyze Resume
                  </>
                )}
              </button>
            </div>
          )}

          {/* Resume Insights Tab */}
          {activeTab === 'insights' && resumeData && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Resume Insights</h2>

              {/* Profile Card */}
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-6`}
              >
                <div className="flex items-start gap-6">
                  <div className="bg-blue-500 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold">
                    {resumeData.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">
                      {resumeData.name}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail size={18} className="text-blue-500" />
                        <span>{resumeData.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={18} className="text-blue-500" />
                        <span>{resumeData.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase size={18} className="text-blue-500" />
                        <span>{resumeData.experience}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-6`}
              >
                <h3 className="text-xl font-semibold mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-6`}
              >
                <h3 className="text-xl font-semibold mb-4">Education</h3>
                <p>{resumeData.education}</p>
              </div>
            </div>
          )}

          {/* Score Overview Tab */}
          {activeTab === 'score' && scoreData && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">ATS Score Overview</h2>

              {/* Overall Score */}
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-8 text-center`}
              >
                <h3 className="text-xl font-semibold mb-6">
                  Overall ATS Match Score
                </h3>
                <div className="relative inline-flex items-center justify-center">
                  <svg
                    className="transform -rotate-90"
                    width="200"
                    height="200"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke={darkMode ? '#374151' : '#e5e7eb'}
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      stroke="#3b82f6"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 80}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 80 * (1 - scoreData.overallScore / 100)
                      }`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute">
                    <div className="text-5xl font-bold text-blue-500">
                      {scoreData.overallScore}%
                    </div>
                  </div>
                </div>
                <p
                  className={`mt-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {scoreData.overallScore >= 80
                    ? 'Excellent Match!'
                    : scoreData.overallScore >= 60
                    ? 'Good Match'
                    : 'Needs Improvement'}
                </p>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Skills Match', value: scoreData.skillsMatch },
                  {
                    label: 'Experience Match',
                    value: scoreData.experienceMatch,
                  },
                  { label: 'Keyword Match', value: scoreData.keywordMatch },
                ].map((metric, idx) => (
                  <div
                    key={idx}
                    className={`${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    } rounded-xl shadow-lg p-6`}
                  >
                    <h4
                      className={`text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {metric.label}
                    </h4>
                    <div className="text-3xl font-bold text-blue-500">
                      {metric.value}%
                    </div>
                    <div className="mt-3 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${metric.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matched & Missing Skills */}
              <div className="grid grid-cols-2 gap-6">
                <div
                  className={`${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-xl shadow-lg p-6`}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="text-green-500" />
                    Matched Skills
                  </h3>
                  <div className="space-y-2">
                    {scoreData.matchedSkills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-xl shadow-lg p-6`}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="text-red-500" />
                    Missing Skills
                  </h3>
                  <div className="space-y-2">
                    {scoreData.missingSkills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <XCircle size={16} className="text-red-500" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-6`}
              >
                <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
                <ul className="space-y-3">
                  {scoreData.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-3">
                      <AlertCircle
                        size={20}
                        className="text-blue-500 shrink-0 mt-0.5"
                      />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Export Button */}
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Download size={20} />
                Export Report (PDF)
              </button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Settings</h2>
              <div
                className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-6`}
              >
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Settings panel coming soon. Configure API endpoints,
                  preferences, and more.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeTab === 'insights' && !resumeData && (
            
          )}

          {activeTab === 'score' && !scoreData && (
            <div className="text-center py-20">
              <BarChart3 size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Score Data</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Complete the analysis to view your ATS score
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
