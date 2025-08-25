
"use client";
import Image from "next/image";
import { useMemo, useState,useRef } from "react";
export default function UploadPage() {
  const API_BASE = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE;
    if (!base) throw new Error("Set NEXT_PUBLIC_API_BASE in .env.local (e.g. http://localhost:5001) and restart dev.");
    return base.replace(/\/+$/, "");
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setStatus("Pick an image first.");

    const form = new FormData();
    form.append("image", file);
    setStatus("Uploading…");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setStatus(`Uploaded ✅ ${data.url}`);
      setFile(null);
      setPreview(null);
    } catch (err) {
      if (err instanceof Error) {
        setStatus(`Error: ${err.message}`);
      } else {
        setStatus(`Error: ${String(err)}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setStatus("");
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setPreview(e.target.result);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  const selectedFile = files && files.length > 0 ? files[0] : null;
  handleFileSelect(selectedFile);
  };

  const getStatusColor = () => {
    if (status.includes('✅')) return '#10B981';
    if (status.includes('Error')) return '#EF4444';
    return '#6366F1';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E0E7FF 0%, #FFFFFF 50%, #F3E8FF 100%)',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(circle at 1px 1px, #6366F1 1px, transparent 0)',
        backgroundSize: '20px 20px',
        zIndex: 1
      }}></div>

      {/* Header */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        paddingTop: '0.3rem',
        paddingBottom: '1rem'
      }}>
        <div style={{
          maxWidth: '32rem',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.75rem',
            lineHeight: '1.2'
          }}>
            Share Your Moment
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#6B7280',
            fontWeight: '500'
          }}>
            Upload your photos to be featured in our live event showcase
          </p>
              <h1 style={{
            fontSize: '0.9rem',
           
            background: 'linear-gradient(135deg, #10B981 0%, #9333EA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.75rem',
            lineHeight: '1.2'
          }}>
            Light.Camera.BIAS
          </h1>
        </div>
      </div>

      
      {/* Main Upload Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '32rem',
        margin: '0 auto',
        padding: '0 1rem 3rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '2rem' }}>
            <form onSubmit={handleUpload}>
              {/* Drag and Drop Area */}
        <div
  style={{
    position: 'relative',
    border: `2px dashed ${isDragOver ? '#6366F1' : file ? '#10B981' : '#D1D5DB'}`,
    borderRadius: '1rem',
    padding: '3rem',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.05)' : file ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
    cursor: 'pointer',
    marginBottom: '2rem'
  }}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
    
  <input
    type="file"
    accept="image/*"
    onChange={handleInputChange}
    ref={fileInputRef}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer',
      pointerEvents: 'none'
    }}
  />
  

  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  }}>
    
    {/* Icon and Instructional Text */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '5rem',
      height: '5rem',
      borderRadius: '50%',
      backgroundColor: isDragOver ? '#E0E7FF' : file ? '#DCFCE7' : '#F3F4F6',
      color: isDragOver ? '#6366F1' : file ? '#10B981' : '#9CA3AF',
      transition: 'all 0.3s ease',
      transform: isDragOver ? 'scale(1.1)' : 'scale(1)'
    }}>
      {/* SVG Upload Icon */}
   
<Image src="/img/logo.png" alt="Logo" width={60} height={60} />
    </div>

    <div>
      <p style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '0.5rem'
      }}>
        {file ? file.name : 'Drop your image here'}
      </p>
     
    </div>

    {/* Choose File Button (shown only if no file is selected) */}
    {!file && (
 <label
  style={{
    display: "inline-flex",
    alignItems: "center",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)",
    color: "white",
    borderRadius: "0.75rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
    transform: "scale(1)",
    boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.39)",
    cursor: "pointer"
  }}
>
  <input
    type="file"
    accept="image/*"
    style={{ display: "none" }}
    onChange={handleInputChange}
  />
  <svg width="16" height="16" fill="currentColor" style={{ marginRight: "0.5rem" }}>
    {/* ... */}
  </svg>
  Choose Photo
</label>
    )}
  </div>
</div>

            

              {/* Upload Button */}
              <button
                type="submit"
                disabled={!file || isLoading}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  borderRadius: '1rem',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)',
                  border: 'none',
                  cursor: !file || isLoading ? 'not-allowed' : 'pointer',
                  background: !file || isLoading ? '#E5E7EB' : 'linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)',
                  color: !file || isLoading ? '#9CA3AF' : 'white',
                  boxShadow: !file || isLoading ? 'none' : '0 10px 15px -3px rgba(79, 70, 229, 0.4)',
                  marginBottom: '0.1rem'
                }}
                onMouseEnter={(e) => {
                  if (!(!file || isLoading)) {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'scale(1.02)';
                    target.style.background = 'linear-gradient(135deg, #4338CA 0%, #7C2D12 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!file || isLoading)) {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'scale(1)';
                    target.style.background = 'linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)';
                  }
                }}
              >
                {isLoading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '1.2rem',
                      height: '1.2rem',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      marginRight: '0.75rem',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Uploading...
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: '0.75rem' }}>
                      <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                    </svg>
                    Upload to Event Gallery
                  </div>
                )}
              </button>

              {/* Status Messages */}
              {status && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: status.includes('✅') ? '#ECFDF5' : status.includes('Error') ? '#FEF2F2' : '#EFF6FF',
                  color: status.includes('✅') ? '#065F46' : status.includes('Error') ? '#991B1B' : '#1E40AF',
                  border: `1px solid ${status.includes('✅') ? '#A7F3D0' : status.includes('Error') ? '#FECACA' : '#DBEAFE'}`,
                  animation: 'slideUp 0.5s ease-out'
                }}>
                  <span style={{ marginRight: '0.75rem' }}>
                    {status.includes('✅') ? (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
                      </svg>
                    ) : status.includes('Error') ? (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
                      </svg>
                    ) : null}
                  </span>
                  {status.includes('✅') ? "Image uploaded successfully! 🎉" : 
                   status.includes('Error') ? "Upload failed. Please try again." : status}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div style={{
            background: 'linear-gradient(135deg, #F9FAFB 0%, rgba(224, 231, 255, 0.3) 100%)',
            padding: '1.5rem 2rem',
            borderTop: '1px solid #F3F4F6'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              color: '#6B7280',
              gap: '0.5rem'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  backgroundColor: '#10B981',
                  borderRadius: '50%',
                  marginRight: '0.5rem',
                  animation: 'pulse 2s infinite'
                }}></span>
                Live Event Feed Active
              </span>
              <span>Photos appear instantly in the Screen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
    
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 640px) {
          .info-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

