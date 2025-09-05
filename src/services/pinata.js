/**
 * Pinata IPFS Service for TherapyTrack
 * Handles decentralized video storage and retrieval
 */

import { config, apiRequest, retryApiCall } from '../utils/api.js'

const PINATA_API_URL = 'https://api.pinata.cloud'
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs'

/**
 * IPFS File Upload Service
 */
export const ipfsService = {
  /**
   * Upload video file to IPFS via Pinata
   */
  async uploadVideo(videoBlob, metadata = {}) {
    try {
      const formData = new FormData()
      
      // Add the video file
      const fileName = `exercise-video-${Date.now()}.webm`
      formData.append('file', videoBlob, fileName)
      
      // Add metadata
      const pinataMetadata = {
        name: fileName,
        keyvalues: {
          type: 'exercise-video',
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      }
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata))
      
      // Add pinning options
      const pinataOptions = {
        cidVersion: 1,
        customPinPolicy: {
          regions: [
            { id: 'FRA1', desiredReplicationCount: 2 },
            { id: 'NYC1', desiredReplicationCount: 2 }
          ]
        }
      }
      formData.append('pinataOptions', JSON.stringify(pinataOptions))

      const response = await retryApiCall(async () => {
        return await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.pinata.jwt}`,
            // Don't set Content-Type for FormData - browser will set it with boundary
          },
          body: formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.details || `Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        url: `${PINATA_GATEWAY_URL}/${result.IpfsHash}`,
        metadata: pinataMetadata
      }
    } catch (error) {
      console.error('IPFS upload failed:', error)
      throw new Error(`Failed to upload video to IPFS: ${error.message}`)
    }
  },

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(jsonData, name = 'metadata') {
    try {
      const response = await retryApiCall(async () => {
        return await apiRequest(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.pinata.jwt}`,
          },
          body: JSON.stringify({
            pinataContent: jsonData,
            pinataMetadata: {
              name: `${name}-${Date.now()}.json`,
              keyvalues: {
                type: 'json-metadata',
                uploadedAt: new Date().toISOString()
              }
            },
            pinataOptions: {
              cidVersion: 1
            }
          })
        })
      })

      return {
        ipfsHash: response.IpfsHash,
        pinSize: response.PinSize,
        timestamp: response.Timestamp,
        url: `${PINATA_GATEWAY_URL}/${response.IpfsHash}`
      }
    } catch (error) {
      console.error('JSON upload to IPFS failed:', error)
      throw new Error(`Failed to upload JSON to IPFS: ${error.message}`)
    }
  },

  /**
   * Retrieve file from IPFS
   */
  async getFile(ipfsHash) {
    try {
      const response = await fetch(`${PINATA_GATEWAY_URL}/${ipfsHash}`)
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve file: ${response.statusText}`)
      }

      return response
    } catch (error) {
      console.error('IPFS retrieval failed:', error)
      throw new Error(`Failed to retrieve file from IPFS: ${error.message}`)
    }
  },

  /**
   * Get file metadata from Pinata
   */
  async getFileMetadata(ipfsHash) {
    try {
      const response = await apiRequest(`${PINATA_API_URL}/data/pinList?hashContains=${ipfsHash}`, {
        headers: {
          'Authorization': `Bearer ${config.pinata.jwt}`,
        }
      })

      if (response.rows && response.rows.length > 0) {
        return response.rows[0]
      }

      throw new Error('File not found')
    } catch (error) {
      console.error('Failed to get file metadata:', error)
      throw error
    }
  }
}

/**
 * Pin Management Service
 */
export const pinManagementService = {
  /**
   * List all pinned files
   */
  async listPins(filters = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.pageLimit) queryParams.append('pageLimit', filters.pageLimit)
      if (filters.pageOffset) queryParams.append('pageOffset', filters.pageOffset)
      if (filters.metadata) {
        Object.entries(filters.metadata).forEach(([key, value]) => {
          queryParams.append(`metadata[keyvalues][${key}]`, value)
        })
      }

      const response = await apiRequest(`${PINATA_API_URL}/data/pinList?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${config.pinata.jwt}`,
        }
      })

      return response
    } catch (error) {
      console.error('Failed to list pins:', error)
      throw error
    }
  },

  /**
   * Update pin metadata
   */
  async updatePinMetadata(ipfsHash, newMetadata) {
    try {
      const response = await apiRequest(`${PINATA_API_URL}/pinning/hashMetadata`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.pinata.jwt}`,
        },
        body: JSON.stringify({
          ipfsPinHash: ipfsHash,
          name: newMetadata.name,
          keyvalues: newMetadata.keyvalues
        })
      })

      return response
    } catch (error) {
      console.error('Failed to update pin metadata:', error)
      throw error
    }
  },

  /**
   * Unpin file from IPFS
   */
  async unpinFile(ipfsHash) {
    try {
      const response = await apiRequest(`${PINATA_API_URL}/pinning/unpin/${ipfsHash}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.pinata.jwt}`,
        }
      })

      return response
    } catch (error) {
      console.error('Failed to unpin file:', error)
      throw error
    }
  }
}

/**
 * Video Processing Utilities
 */
export const videoUtils = {
  /**
   * Compress video before upload
   */
  async compressVideo(videoBlob, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.onloadedmetadata = () => {
        // Set canvas dimensions (reduce for compression)
        const scale = Math.sqrt(quality)
        canvas.width = video.videoWidth * scale
        canvas.height = video.videoHeight * scale

        // Create MediaRecorder for compressed output
        const stream = canvas.captureStream(30) // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 1000000 * quality // Adjust bitrate based on quality
        })

        const chunks = []
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' })
          resolve(compressedBlob)
        }

        // Draw video frames to canvas
        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop()
            return
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          requestAnimationFrame(drawFrame)
        }

        video.play()
        mediaRecorder.start()
        drawFrame()
      }

      video.onerror = reject
      video.src = URL.createObjectURL(videoBlob)
    })
  },

  /**
   * Generate video thumbnail
   */
  async generateThumbnail(videoBlob, timeOffset = 1) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        video.currentTime = timeOffset
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      }

      video.onerror = reject
      video.src = URL.createObjectURL(videoBlob)
    })
  },

  /**
   * Get video duration
   */
  async getVideoDuration(videoBlob) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      
      video.onloadedmetadata = () => {
        resolve(video.duration)
      }

      video.onerror = reject
      video.src = URL.createObjectURL(videoBlob)
    })
  }
}

/**
 * Exercise Video Service
 * Specialized service for handling exercise videos
 */
export const exerciseVideoService = {
  /**
   * Upload exercise video with metadata
   */
  async uploadExerciseVideo(videoBlob, exerciseData) {
    try {
      // Generate thumbnail
      const thumbnail = await videoUtils.generateThumbnail(videoBlob)
      
      // Get video duration
      const duration = await videoUtils.getVideoDuration(videoBlob)
      
      // Compress video if it's too large (> 50MB)
      let processedVideo = videoBlob
      if (videoBlob.size > 50 * 1024 * 1024) {
        processedVideo = await videoUtils.compressVideo(videoBlob, 0.7)
      }

      // Upload video to IPFS
      const videoResult = await ipfsService.uploadVideo(processedVideo, {
        exerciseId: exerciseData.exerciseId,
        patientId: exerciseData.patientId,
        exerciseName: exerciseData.name,
        duration: duration,
        originalSize: videoBlob.size,
        compressedSize: processedVideo.size
      })

      // Upload thumbnail to IPFS
      const thumbnailResult = await ipfsService.uploadVideo(thumbnail, {
        type: 'thumbnail',
        parentHash: videoResult.ipfsHash,
        exerciseId: exerciseData.exerciseId
      })

      return {
        video: videoResult,
        thumbnail: thumbnailResult,
        duration,
        originalSize: videoBlob.size,
        finalSize: processedVideo.size
      }
    } catch (error) {
      console.error('Exercise video upload failed:', error)
      throw error
    }
  },

  /**
   * Get exercise videos for a patient
   */
  async getPatientExerciseVideos(patientId) {
    try {
      const pins = await pinManagementService.listPins({
        metadata: {
          type: 'exercise-video',
          patientId: patientId
        },
        pageLimit: 100
      })

      return pins.rows.map(pin => ({
        ipfsHash: pin.ipfs_pin_hash,
        url: `${PINATA_GATEWAY_URL}/${pin.ipfs_pin_hash}`,
        metadata: pin.metadata,
        dateUploaded: pin.date_pinned,
        size: pin.size
      }))
    } catch (error) {
      console.error('Failed to get patient exercise videos:', error)
      throw error
    }
  },

  /**
   * Delete exercise video
   */
  async deleteExerciseVideo(ipfsHash) {
    try {
      // Get metadata to find associated thumbnail
      const metadata = await ipfsService.getFileMetadata(ipfsHash)
      
      // Unpin the main video
      await pinManagementService.unpinFile(ipfsHash)
      
      // Find and unpin associated thumbnail
      if (metadata.metadata?.keyvalues?.thumbnailHash) {
        await pinManagementService.unpinFile(metadata.metadata.keyvalues.thumbnailHash)
      }

      return true
    } catch (error) {
      console.error('Failed to delete exercise video:', error)
      throw error
    }
  }
}

export default {
  ipfsService,
  pinManagementService,
  videoUtils,
  exerciseVideoService
}
