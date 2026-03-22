'use client';

import { useState, useEffect } from 'react';
import { getPerformanceMonitor, initPerformanceMonitor } from '@/lib/performance';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function PerformanceDashboard({
  isVisible,
  onClose,
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      // Try to get existing monitor, or initialize if needed
      let monitor = getPerformanceMonitor();

      if (!monitor) {
        console.log('🔧 Performance monitor not found, initializing...');
        monitor = initPerformanceMonitor();
      }

      if (monitor) {
        // Force collect metrics if none exist
        monitor.collectTestMetrics();

        setMetrics(monitor.getMetrics());
        setVitals(monitor.getWebVitals());
        setSummary(monitor.getSummary());

        // Debug info
        console.log(
          '📊 Dashboard opened - Metrics count:',
          monitor.getMetrics().length,
        );
        console.log(
          '📊 Dashboard opened - Vitals count:',
          monitor.getWebVitals().length,
        );
      } else {
        console.warn('⚠️ Performance monitor could not be initialized');
      }
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getVitalColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-300 bg-green-900 border border-green-700';
      case 'needs-improvement':
        return 'text-yellow-300 bg-yellow-900 border border-yellow-700';
      case 'poor':
        return 'text-red-300 bg-red-900 border border-red-700';
      default:
        return 'text-gray-300 bg-gray-800 border border-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Performance Dashboard</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] bg-gray-900 text-white">
          {/* Summary */}
          {summary && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-300">Session Info</h3>
                <p className="text-sm text-blue-200">ID: {summary.sessionId}</p>
                <p className="text-sm text-blue-200">
                  Location: {summary.location?.city}, {summary.location?.region}
                </p>
                <p className="text-sm text-blue-200">
                  Timezone: {summary.location?.timezone}
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-green-300">Connection</h3>
                <p className="text-sm text-green-200">
                  Type: {summary.connection?.effectiveType || 'Unknown'}
                </p>
                <p className="text-sm text-green-200">
                  Speed:{' '}
                  {summary.connection?.downlink
                    ? `${summary.connection.downlink} Mbps`
                    : 'Unknown'}
                </p>
                <p className="text-sm text-green-200">
                  RTT:{' '}
                  {summary.connection?.rtt
                    ? `${summary.connection.rtt}ms`
                    : 'Unknown'}
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-300">Performance</h3>
                <p className="text-sm text-purple-200">
                  Session Time: {formatTime(summary.totalTime)}
                </p>
                <p className="text-sm text-purple-200">
                  Metrics: {summary.metricsCount}
                </p>
                <p className="text-sm text-purple-200">
                  Web Vitals: {summary.vitalsCount}
                </p>
              </div>
            </div>
          )}

          {/* Web Vitals */}
          {vitals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-white">
                Core Web Vitals
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {vitals.map((vital, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${getVitalColor(vital.rating)}`}
                  >
                    <div className="font-semibold">{vital.name}</div>
                    <div className="text-sm">{formatTime(vital.value)}</div>
                    <div className="text-xs capitalize">{vital.rating}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">
              Detailed Metrics
            </h3>

            {metrics.length === 0 ? (
              <div className="bg-yellow-900 border border-yellow-700 p-4 rounded-lg mb-4">
                <p className="text-yellow-300 text-sm">
                  ⚠️ No performance metrics collected yet. This might happen if:
                </p>
                <ul className="text-yellow-200 text-xs mt-2 ml-4 space-y-1">
                  <li>• The page is still loading</li>
                  <li>• Browser doesn't support Performance API</li>
                  <li>• Network issues preventing data collection</li>
                </ul>
                <p className="text-yellow-300 text-xs mt-2">
                  Try clicking "Log to Console" to force data collection.
                </p>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-600 bg-gray-800">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-600 text-gray-300">
                      Metric
                    </th>
                    <th className="px-3 py-2 text-left border-b border-gray-600 text-gray-300">
                      Value
                    </th>
                    <th className="px-3 py-2 text-left border-b border-gray-600 text-gray-300">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left border-b border-gray-600 text-gray-300">
                      Connection
                    </th>
                    <th className="px-3 py-2 text-left border-b border-gray-600 text-gray-300">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, index) => (
                    <tr key={index} className="hover:bg-gray-700">
                      <td className="px-3 py-2 border-b border-gray-600 font-mono text-xs text-gray-300">
                        {metric.name}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-600 text-gray-300">
                        {formatTime(metric.value)}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-600 text-xs text-gray-400">
                        {metric.location?.city}, {metric.location?.region}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-600 text-xs text-gray-400">
                        {metric.connection?.effectiveType || 'Unknown'}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-600 text-xs text-gray-400">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Data */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                // Try to get existing monitor, or initialize if needed
                let monitor = getPerformanceMonitor();

                if (!monitor) {
                  console.log('🔧 Performance monitor not found, initializing...');
                  monitor = initPerformanceMonitor();
                }

                if (monitor) {
                  // Force collect metrics
                  monitor.collectTestMetrics();

                  // Update the display
                  setMetrics(monitor.getMetrics());
                  setVitals(monitor.getWebVitals());
                  setSummary(monitor.getSummary());

                  // Send to analytics and log
                  monitor.sendToAnalytics();

                  console.log('🔍 PERFORMANCE DEBUG INFO:');
                  console.log('- Metrics collected:', monitor.getMetrics().length);
                  console.log(
                    '- Web Vitals collected:',
                    monitor.getWebVitals().length,
                  );
                  console.log('- Full metrics data:', monitor.getMetrics());
                  console.log('- Full vitals data:', monitor.getWebVitals());
                } else {
                  console.error('❌ Performance monitor could not be initialized');
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Log to Console
            </button>

            <button
              onClick={() => {
                const data = { metrics, vitals, summary };
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export JSON
            </button>

            <button
              onClick={() => {
                const csvData = metrics
                  .map(m =>
                    [
                      m.name,
                      m.value,
                      m.location?.city || '',
                      m.location?.region || '',
                      m.connection?.effectiveType || '',
                      new Date(m.timestamp).toISOString(),
                    ].join(','),
                  )
                  .join('\n');

                const csv =
                  'Metric,Value(ms),City,Region,Connection,Timestamp\n' + csvData;
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
