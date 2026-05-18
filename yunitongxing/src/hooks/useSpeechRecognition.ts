import { useState, useRef, useCallback } from 'react'

interface SpeechState {
  isListening: boolean
  isSupported: boolean
  error: string | null
}

export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechState>({
    isListening: false,
    isSupported: false,
    error: null,
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Lazy init
  const getRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition

    if (!SpeechRecognition) return null

    const recognition = new (SpeechRecognition as new () => SpeechRecognition)()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition
    return recognition
  }, [])

  const startListening = useCallback(
    (onResult: (text: string) => void) => {
      const recognition = getRecognition()
      if (!recognition) {
        setState({ isListening: false, isSupported: false, error: '浏览器不支持语音识别' })
        return
      }

      setState({ isListening: true, isSupported: true, error: null })

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript
        onResult(text)
        setState((s) => ({ ...s, isListening: false }))
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setState({ isListening: false, isSupported: true, error: event.error })
      }

      recognition.onend = () => {
        setState((s) => ({ ...s, isListening: false }))
      }

      try {
        recognition.start()
      } catch {
        setState({ isListening: false, isSupported: true, error: '启动语音失败' })
      }
    },
    [getRecognition]
  )

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setState((s) => ({ ...s, isListening: false }))
  }, [])

  return { ...state, startListening, stopListening }
}

// Minimal type declarations for Speech Recognition API
interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
}
