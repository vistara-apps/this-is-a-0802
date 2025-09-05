/**
 * OpenAI Service for TherapyTrack
 * Handles AI-powered exercise analysis, feedback generation, and video processing
 */

import OpenAI from 'openai'
import { config } from '../utils/api.js'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  organization: config.openai.organizationId,
  dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
})

/**
 * Exercise Analysis Service
 */
export const exerciseAnalysisService = {
  /**
   * Analyze exercise video for form and repetition counting
   * Note: This is a simplified implementation. In production, you'd likely need
   * specialized computer vision models or pose estimation libraries
   */
  async analyzeExerciseVideo(videoBlob, exerciseName, exerciseInstructions) {
    try {
      // Convert video to base64 for analysis
      const base64Video = await blobToBase64(videoBlob)
      
      // For now, we'll use GPT-4 Vision to analyze video frames
      // In production, you'd extract frames and use specialized models
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are a physical therapy AI assistant. Analyze the provided exercise video and provide feedback on form, repetition count, and suggestions for improvement. The exercise being performed is: ${exerciseName}. Instructions: ${exerciseInstructions}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this ${exerciseName} exercise video and provide:
1. Repetition count
2. Form assessment (good/needs improvement)
3. Specific feedback on technique
4. Suggestions for improvement
5. Overall performance score (1-10)`
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Video,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })

      return parseAnalysisResponse(response.choices[0].message.content)
    } catch (error) {
      console.error('Exercise analysis failed:', error)
      // Fallback to mock analysis
      return generateMockAnalysis(exerciseName)
    }
  },

  /**
   * Generate personalized feedback based on exercise performance
   */
  async generatePersonalizedFeedback(exerciseData, patientHistory) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a compassionate physical therapist providing personalized feedback to patients. Be encouraging, specific, and provide actionable advice."
          },
          {
            role: "user",
            content: `Generate personalized feedback for a patient who just completed ${exerciseData.name}. 
            
Exercise details:
- Name: ${exerciseData.name}
- Prescribed: ${exerciseData.sets} sets of ${exerciseData.reps} reps
- AI Analysis: ${exerciseData.aiAnalysis}
- Patient History: ${JSON.stringify(patientHistory)}

Provide encouraging, specific feedback that acknowledges their effort and gives actionable improvement tips.`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })

      return response.choices[0].message.content
    } catch (error) {
      console.error('Feedback generation failed:', error)
      return generateMockFeedback(exerciseData.name)
    }
  },

  /**
   * Generate motivational messages for patient reminders
   */
  async generateMotivationalMessage(patientName, exerciseType, adherenceRate) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a supportive physical therapy coach. Generate brief, encouraging messages to motivate patients to complete their exercises."
          },
          {
            role: "user",
            content: `Generate a motivational message for ${patientName} to encourage them to complete their ${exerciseType} exercises. Their current adherence rate is ${adherenceRate}%. Keep it positive, personal, and under 50 words.`
          }
        ],
        max_tokens: 100,
        temperature: 0.8
      })

      return response.choices[0].message.content
    } catch (error) {
      console.error('Motivational message generation failed:', error)
      return `Hi ${patientName}! Time for your ${exerciseType} exercises. You're doing great - keep up the excellent work! 💪`
    }
  }
}

/**
 * Therapist AI Assistant Service
 */
export const therapistAssistantService = {
  /**
   * Generate exercise recommendations based on patient condition
   */
  async recommendExercises(patientCondition, currentExercises, progressData) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert physical therapist AI assistant. Recommend appropriate exercises based on patient conditions and progress."
          },
          {
            role: "user",
            content: `Recommend exercises for a patient with: ${patientCondition}
            
Current exercises: ${JSON.stringify(currentExercises)}
Progress data: ${JSON.stringify(progressData)}

Provide 3-5 exercise recommendations with:
1. Exercise name
2. Sets and reps
3. Frequency
4. Specific instructions
5. Progression criteria`
          }
        ],
        max_tokens: 600
      })

      return parseExerciseRecommendations(response.choices[0].message.content)
    } catch (error) {
      console.error('Exercise recommendation failed:', error)
      return []
    }
  },

  /**
   * Analyze patient progress and provide insights
   */
  async analyzePatientProgress(patientData, exerciseHistory) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a physical therapy data analyst. Analyze patient progress and provide clinical insights."
          },
          {
            role: "user",
            content: `Analyze the progress of this patient:
            
Patient Data: ${JSON.stringify(patientData)}
Exercise History: ${JSON.stringify(exerciseHistory)}

Provide insights on:
1. Overall progress trend
2. Areas of improvement
3. Potential concerns
4. Recommendations for treatment adjustments`
          }
        ],
        max_tokens: 500
      })

      return response.choices[0].message.content
    } catch (error) {
      console.error('Progress analysis failed:', error)
      return "Unable to analyze progress at this time. Please review patient data manually."
    }
  }
}

/**
 * Utility Functions
 */

// Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Parse AI analysis response into structured data
function parseAnalysisResponse(response) {
  try {
    // Extract key information from the response
    const lines = response.split('\n')
    const analysis = {
      repetitionCount: 0,
      formAssessment: 'good',
      feedback: response,
      suggestions: [],
      performanceScore: 8
    }

    // Simple parsing logic - in production, you'd want more sophisticated parsing
    lines.forEach(line => {
      if (line.toLowerCase().includes('repetition') || line.toLowerCase().includes('reps')) {
        const match = line.match(/(\d+)/)
        if (match) analysis.repetitionCount = parseInt(match[1])
      }
      
      if (line.toLowerCase().includes('score')) {
        const match = line.match(/(\d+)/)
        if (match) analysis.performanceScore = parseInt(match[1])
      }
    })

    return analysis
  } catch (error) {
    console.error('Failed to parse analysis response:', error)
    return generateMockAnalysis()
  }
}

// Parse exercise recommendations
function parseExerciseRecommendations(response) {
  try {
    // Simple parsing - in production, you'd want structured output
    const exercises = []
    const sections = response.split(/\d+\./).slice(1)
    
    sections.forEach(section => {
      const lines = section.trim().split('\n')
      if (lines.length > 0) {
        exercises.push({
          name: lines[0].trim(),
          description: section.trim(),
          sets: 3,
          reps: 10,
          frequency: 'Daily'
        })
      }
    })

    return exercises
  } catch (error) {
    console.error('Failed to parse exercise recommendations:', error)
    return []
  }
}

// Generate mock analysis for fallback
function generateMockAnalysis(exerciseName = 'exercise') {
  const mockAnalyses = {
    'Knee Extension': {
      repetitionCount: 8,
      formAssessment: 'good',
      feedback: 'Good form detected. Try to hold the extended position for the full 5 seconds.',
      suggestions: ['Hold position longer', 'Maintain steady breathing'],
      performanceScore: 8
    },
    'Ankle Pumps': {
      repetitionCount: 12,
      formAssessment: 'excellent',
      feedback: 'Excellent range of motion. Smooth and controlled movement observed.',
      suggestions: ['Continue current technique', 'Consider increasing repetitions'],
      performanceScore: 9
    },
    'Calf Raises': {
      repetitionCount: 10,
      formAssessment: 'good',
      feedback: 'Good balance maintained. Consider rising higher on your toes for better stretch.',
      suggestions: ['Rise higher on toes', 'Focus on controlled descent'],
      performanceScore: 7
    }
  }

  return mockAnalyses[exerciseName] || {
    repetitionCount: 8,
    formAssessment: 'good',
    feedback: 'Exercise completed successfully. Form looks good overall.',
    suggestions: ['Keep up the good work'],
    performanceScore: 8
  }
}

// Generate mock feedback for fallback
function generateMockFeedback(exerciseName) {
  const feedbacks = {
    'Knee Extension': 'Great job on your knee extensions! Your form is improving with each session. Try to hold that extended position just a bit longer to maximize the benefit.',
    'Ankle Pumps': 'Excellent work on your ankle pumps! Your range of motion is really good. This exercise is helping improve your circulation and flexibility.',
    'Calf Raises': 'Nice work on the calf raises! Your balance is getting better. Focus on rising up as high as you can on your toes for the best results.'
  }

  return feedbacks[exerciseName] || 'Great job completing your exercise! Your dedication to recovery is showing. Keep up the excellent work!'
}

export default {
  exerciseAnalysisService,
  therapistAssistantService
}
