import React, { useState, useEffect } from 'react';
import { SecurityScanner, SecurityVulnerability } from '../services/security-scanner';

export const SecurityDashboard: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const runSecurityScan = async () => {
      try {
        setLoading(true);
        const securityReport = await SecurityScanner.generateSecurityReport();
        setReport(securityReport);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    runSecurityScan();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Running security scan...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 text-4xl mb-4">❌</div>
        <h2 className="text-xl font-semibold mb-2">Security Scan Failed</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }
  
  if (!report) return null;
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Security Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{report.summary.critical}</div>
          <div className="text-sm text-gray-600">Critical</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">{report.summary.high}</div>
          <div className="text-sm text-gray-600">High</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{report.summary.medium}</div>
          <div className="text-sm text-gray-600">Medium</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{report.summary.low}</div>
          <div className="text-sm text-gray-600">Low</div>
        </div>
      </div>
      
      {/* Vulnerabilities List */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Vulnerabilities ({report.summary.total})</h2>
        </div>
        <div className="divide-y">
          {report.vulnerabilities.map((vuln: SecurityVulnerability, index: number) => (
            <div key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{vuln.id}</span>
                  </div>
                  <h3 className="font-medium mb-1">{vuln.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{vuln.description}</p>
                  {vuln.file && (
                    <p className="text-xs text-gray-500">
                      File: {vuln.file}{vuln.line ? `:${vuln.line}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Security Recommendations</h2>
        </div>
        <div className="p-4">
          <ul className="space-y-2">
            {report.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
