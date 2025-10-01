import { getVersionWithPrefix, VERSION_HISTORY } from '../version'
import { useState } from 'react'

type VersionDisplayProps = {
  theme?: 'light' | 'dark'
}

export function VersionDisplay({ theme = 'dark' }: VersionDisplayProps) {
  const [showChangelog, setShowChangelog] = useState(false)
  
  const textColor = theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
  
  return (
    <>
      <div className="text-sm">
        <button 
          onClick={() => setShowChangelog(true)}
          className={`${textColor} transition-colors underline`}
        >
          {getVersionWithPrefix()}
        </button>
      </div>

      {showChangelog && (
        <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Version History</h2>
              <button
                onClick={() => setShowChangelog(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {VERSION_HISTORY.map((entry) => (
                <div key={entry.version} className="border-l-4 border-[#27AE60] pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold">v{entry.version}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      entry.type === 'major' ? 'bg-red-100 text-red-800' :
                      entry.type === 'minor' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {entry.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{entry.date}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {entry.changes.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
