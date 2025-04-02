import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import styles from '../styles/Dashboard.module.css';

const CreateLive = ({ creditBalance, setCreditBalance, tasks, setTasks }) => {
  const router = useRouter();
  const [newTask, setNewTask] = useState({
    title: '',
    hours: '',
    key: '',
    videoUrl: '',
    scheduleType: 'now',
    startTime: '',
    endTime: '',
    durationType: 'loop',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileDetails, setFileDetails] = useState({
    duration: null,         // formatted duration string (HH:MM:SS or MM:SS)
    durationInSeconds: null, // raw duration in seconds
    size: null,
    format: null
  });
  const [showStreamKeyInfo, setShowStreamKeyInfo] = useState(false);
  const [showSuccessSign, setShowSuccessSign] = useState(false);
  // Format file size in human-readable form
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get video file extension
  const getVideoFormat = (fileName) => fileName.split('.').pop().toLowerCase();

  // Get video duration in seconds
  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Format seconds into HH:MM:SS (or MM:SS)
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Calculate max loops available based on overall credit cost
  // Finds the maximum number of loops such that total cost doesn't exceed creditBalance
  const calculateMaxLoops = () => {
    if (!fileDetails.durationInSeconds || creditBalance <= 0) return 1;
    let maxLoops = 1;
    while (Math.ceil((fileDetails.durationInSeconds * (maxLoops + 1)) / 3600) <= creditBalance) {
      maxLoops++;
    }
    return maxLoops;
  };

  const handleVideoChange = async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setIsFileUploaded(true);

      const format = getVideoFormat(file.name);
      const size = formatFileSize(file.size);

      setIsUploading(true);
      setUploadStatus('processing');
      setUploadProgress(0);

      try {
        const durationInSeconds = await getVideoDuration(file);
        const formattedDuration = formatDuration(durationInSeconds);
        setFileDetails({
          duration: formattedDuration,
          durationInSeconds: durationInSeconds,
          size: size,
          format: format
        });
        
        const maxLoops = calculateMaxLoops();
        // Set default loops to the max available
        setNewTask(prev => ({ ...prev, hours: maxLoops.toString() }));

        const email = auth.currentUser.email;
        const formData = new FormData();
        formData.append('video', file);

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            setUploadStatus('uploading');
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploadProgress(100);
            setUploadStatus('ready');
            setIsUploading(false);
            toast.success('Video uploaded successfully!');
          } else {
            throw new Error('Upload failed');
          }
        };

        xhr.onerror = () => {
          throw new Error('Upload failed');
        };

        xhr.open('POST', `http://localhost:5000/upload/${email}`);
        xhr.send(formData);

      } catch (error) {
        console.error('Error processing video:', error);
        toast.error('Error processing video file. Please try again.');
        setIsUploading(false);
        setUploadStatus('error');
        setUploadProgress(0);
      }
    } else {
      setIsFileUploaded(false);
      setVideoFile(null);
      setFileDetails({ duration: null, durationInSeconds: null, size: null, format: null });
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setIsUploading(true);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      const loops = parseInt(newTask.hours) || 1;
      // Calculate total credits based on the overall video duration (loops * durationInSeconds)
      const totalCreditsNeeded = Math.ceil((fileDetails.durationInSeconds * loops) / 3600);
      
      if (userData.creditBalance < totalCreditsNeeded) {
        throw new Error(`Insufficient credits. This stream requires ${totalCreditsNeeded} credits, but you only have ${userData.creditBalance} credits.`);
      }
      
      const tasksRef = collection(userRef, 'tasks');
      const email = auth.currentUser.email;
      const formData = new FormData();
      formData.append('video', videoFile);
      
      const uploadResponse = await fetch(`http://localhost:5000/upload/${email}`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }
      
      const { videoId } = await uploadResponse.json();

      const taskData = {
        title: newTask.title,
        hours: loops,
        durationType: newTask.durationType || 'loop',
        streamKey: newTask.key,
        status: 'active',
        createdAt: serverTimestamp(),
        createdDate: new Date().toISOString(),
        videoUrl: '',
        videoId: videoId,
        creditCost: totalCreditsNeeded
      };

      const taskDoc = await addDoc(tasksRef, taskData);

      const startResponse = await fetch(`http://localhost:5000/start/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamKey: newTask.key,
          loops: loops,
          durationType: newTask.durationType,
          taskId: taskDoc.id
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start stream');
      }

      const newBalance = userData.creditBalance - totalCreditsNeeded;
      await updateDoc(userRef, { creditBalance: newBalance, lastWalletUpdate: new Date() });
      
      const transactionId = `stream_${Date.now()}`;
      const transactionsRef = doc(db, 'users', auth.currentUser.uid, 'wallets', transactionId);
      await setDoc(transactionsRef, {
        quantity: -totalCreditsNeeded,
        type: 'debit',
        description: `Stream: ${newTask.title}`,
        timestamp: new Date(),
        balance: newBalance,
        taskId: taskDoc.id
      });

      setCreditBalance(newBalance);

      const newTaskData = {
        id: taskDoc.id,
        title: newTask.title,
        hours: loops,
        streamKey: newTask.key,
        status: 'active',
        createdAt: new Date(),
        createdDate: new Date().toISOString(),
        videoId: videoId,
        creditCost: totalCreditsNeeded
      };

      setTasks([...tasks, newTaskData]);
      setNewTask({ title: '', hours: '', key: '', videoUrl: '', scheduleType: 'now', startTime: '', endTime: '', durationType: 'loop' });
      setVideoFile(null);
      setIsFileUploaded(false);
      setIsUploading(false);
      setUploadStatus('success');
      setUploadProgress(100);

      toast.success(`Stream started successfully! ${totalCreditsNeeded} credits used.`);
      
      // Show success sign and redirect to "Live History"
      setShowSuccessSign(true);
      setTimeout(() => {
        setShowSuccessSign(false);
        router.push('/dashboard?tab=live-history');
      }, 2000);
    } catch (error) {
      console.error('Error creating task:', error);
      setUploadStatus('error');
      setUploadProgress(0);
      toast.error(error.message || 'Failed to start stream. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setUploadStatus('');
        setUploadProgress(0);
      }, 3000);
    }
  };

  return (
    <div>
      {showSuccessSign && (
        <div className={styles.successOverlay}>
          <div className={styles.successSign}>✔</div>
        </div>
      )}
      <h2 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '24px' }}>Create New Live Stream</h2>
      <form onSubmit={handleCreateTask} className={styles.taskForm}>
        {/* File upload section */}
        <div className={styles.formGroup}>
          <label>Upload Video File</label>
          <div className={styles.fileUploadContainer}>
            <input type="file" accept="video/*" onChange={handleVideoChange} required id="video-upload" />
            <label htmlFor="video-upload">
              <div style={{ marginBottom: '8px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p style={{ margin: 0, color: '#64748b' }}>
                {videoFile ? videoFile.name : 'Click to upload video file'}
              </p>
            </label>
          </div>

          {isFileUploaded && (
            <div className={styles.fileDetails}>
              <h4>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Video Details
              </h4>
              <ul>
                <li><strong>File Name</strong><span>{videoFile.name}</span></li>
                <li><strong>Size</strong><span>{fileDetails.size}</span></li>
                <li><strong>Duration</strong><span>{fileDetails.duration}</span></li>
                <li><strong>Format</strong><span>{fileDetails.format}</span></li>
              </ul>
            </div>
          )}

          {isUploading && (
            <div className={styles.uploadStatus}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{width: `${uploadProgress}%`}}></div>
              </div>
              <p className={styles.uploadingMessage}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                {uploadStatus === 'processing' ? 'Processing video file...' : 'Uploading video...'} {uploadProgress}% complete
                {videoFile && (
                  <span className={styles.uploadSize}>
                    ({formatFileSize(videoFile.size * (uploadProgress / 100))} / {formatFileSize(videoFile.size)})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Stream title input */}
        <div className={styles.formGroup}>
          <label>Stream Title</label>
          <input
            type="text"
            placeholder={isFileUploaded ? "Enter a descriptive title for your stream" : "Upload a video file first"}
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            disabled={!isFileUploaded || isUploading}
            required
            className={(!isFileUploaded || isUploading) ? styles.disabledInput : ''}
          />
        </div>

        {/* Stream key input */}
        <div className={styles.formGroup}>
        <label>
            Stream Key&nbsp;
            <button
              type="button"
              onClick={() => setShowStreamKeyInfo(true)}
              className={styles.infoButton}
              aria-label="Show stream key info"
            >
              ℹ️
            </button>
          </label>
          <input
            type="text"
            placeholder={isFileUploaded ? "Enter your YouTube Stream Key" : "Upload a video file first"}
            value={newTask.key}
            onChange={(e) => setNewTask({ ...newTask, key: e.target.value })}
            disabled={!isFileUploaded || isUploading}
            required
            className={(!isFileUploaded || isUploading) ? styles.disabledInput : ''}
          />
          <small style={{ display: 'block', marginTop: '8px', color: '#64748b' }}>
            You can find your stream key in your YouTube Studio dashboard under "Stream" settings
          </small>
        </div>
        {showStreamKeyInfo && (
          <div className={styles.infoModal}>
            <div className={styles.infoContent}>
              <button 
                type="button" 
                onClick={() => setShowStreamKeyInfo(false)} 
                className={styles.closeButton}
                aria-label="Close info"
              >
                ✖
              </button>
              <h3>How to find your Stream Key</h3>
              <video controls src="/key_video.mp4" className={styles.infoVideo}>
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
        {/* Loops and credits configuration */}
        <div className={styles.streamOptions}>
          <div className={styles.formGroup}>
            <label>Number of Loops</label>
            <div className={styles.numberInputGroup}>
              <button 
                type="button"
                className={styles.numberInputButton}
                onClick={() => {
                  const currentValue = parseInt(newTask.hours) || 1;
                  if (currentValue > 1) {
                    setNewTask(prev => ({ ...prev, hours: (currentValue - 1).toString() }));
                  }
                }}
                disabled={!isFileUploaded || isUploading || uploadStatus === 'processing' || parseInt(newTask.hours) <= 1}
                aria-label="Decrease loops"
              >
                −
              </button>
              <input
                type="number"
                placeholder="1"
                value={newTask.hours}
                onChange={(e) => {
                  const maxLoops = calculateMaxLoops();
                  const inputValue = parseFloat(e.target.value);
                  if (!isNaN(inputValue)) {
                    if (inputValue < 1) {
                      setNewTask(prev => ({ ...prev, hours: '1' }));
                    } else if (inputValue > maxLoops) {
                      toast.error(`You can only loop up to ${maxLoops} times with your current credit balance and video duration.`);
                      setNewTask(prev => ({ ...prev, hours: maxLoops.toString() }));
                    } else {
                      setNewTask(prev => ({ ...prev, hours: e.target.value }));
                    }
                  }
                }}
                required
                min="1"
                max={calculateMaxLoops()}
                disabled={!isFileUploaded || isUploading || uploadStatus === 'processing'}
                className={(!isFileUploaded || isUploading || uploadStatus === 'processing') ? styles.disabledInput : ''}
                aria-label="Number of loops"
              />
              <button 
                type="button"
                className={styles.numberInputButton}
                onClick={() => {
                  const maxLoops = calculateMaxLoops();
                  const currentValue = parseInt(newTask.hours) || 1;
                  if (currentValue < maxLoops) {
                    setNewTask(prev => ({ ...prev, hours: (currentValue + 1).toString() }));
                  } else {
                    toast.error(`You can only loop up to ${maxLoops} times with your current credit balance and video duration.`);
                  }
                }}
                disabled={!isFileUploaded || isUploading || uploadStatus === 'processing' || parseInt(newTask.hours) >= calculateMaxLoops()}
                aria-label="Increase loops"
              >
                +
              </button>
            </div>
            <div className={styles.creditInfo}>
              {fileDetails.duration 
                ? (() => {
                    // Calculate total cost based on overall duration (video duration * loops)
                    const totalCost = Math.ceil((fileDetails.durationInSeconds * (parseInt(newTask.hours) || 1)) / 3600);
                    return `With your current credit balance (${creditBalance} credits), looping this video ${newTask.hours || 1} time(s) will cost a total of ${totalCost} credit${totalCost > 1 ? 's' : ''}.`;
                  })()
                : "Upload a video to see the loop cost."
              }
            </div>
            <div className={styles.addCreditsContainer}>
              <button type="button" className={styles.addCreditsButton} onClick={() => router.push('/purchase')}>
                Add Credits
              </button>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !isFileUploaded || isUploading || !newTask.title || !newTask.key} 
          className={styles.submitButton}
        >
          {loading ? 'Processing...' : 'Start Live Stream'}
        </button>

        {uploadStatus && (
          <div className={styles.uploadStatus}>
            {uploadStatus === 'success' && (
              <div className={styles.successMessage}>
                Stream started successfully! Using key: {newTask.key}
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className={styles.errorMessage}>
                Failed to start stream. Please try again.
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateLive;
