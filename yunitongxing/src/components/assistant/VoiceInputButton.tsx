import { useState, useCallback, useEffect, useRef } from 'react'

interface VoiceInputButtonProps {
  onResult: (text: string) => void
}

export default function VoiceInputButton({ onResult }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const [showFallbackInput, setShowFallbackInput] = useState(false)
  const fallbackRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const isSupported = !!SpeechRecognition

  useEffect(() => {
    if (showFallbackInput && fallbackRef.current) {
      fallbackRef.current.focus()
    }
  }, [showFallbackInput])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setShowFallbackInput(true)
      return
    }

    setError('')
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'zh-CN'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onstart = () => {
      setIsListening(true)
      setError('')
    }

    recognition.onresult = (event: any) => {
      // Build transcript from all results
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      // On final result or if we have enough text, use it
      if (event.results[0].isFinal || transcript.length > 3) {
        recognition.stop()
        setIsListening(false)
        onResult(transcript)
      }
    }

    recognition.onerror = (event: any) => {
      console.warn('[VoiceInput] error:', event.error, event.message)
      setIsListening(false)

      if (event.error === 'not-allowed') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许')
      } else if (event.error === 'no-speech') {
        setError('未检测到语音，请再试一次')
      } else if (event.error === 'network') {
        // Network required for speech recognition
        setError('语音识别需要联网，请检查网络')
        setShowFallbackInput(true)
      } else {
        setError('语音识别失败，请使用文字输入')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch {
      setShowFallbackInput(true)
    }
  }, [isSupported, onResult])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const handleFallbackSubmit = () => {
    const text = fallbackRef.current?.value?.trim()
    if (text) {
      onResult(text)
    }
    setShowFallbackInput(false)
  }

  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={showFallbackInput}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse scale-110 shadow-lg shadow-red-300'
            : showFallbackInput
            ? 'bg-gray-100 text-gray-300'
            : 'bg-gray-50 text-text-muted active:scale-95'
        }`}
        title={isSupported ? '点击语音输入' : '语音输入（输入文字替代）'}
      >
        <span className="text-lg">{isListening ? '🔴' : '🎤'}</span>
      </button>

      {/* Recording animation */}
      {isListening && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl px-3 py-2 shadow-lg border border-red-100 whitespace-nowrap">
          <span className="text-xs text-text-secondary">正在聆听...</span>
          <span className="ml-1 inline-flex gap-0.5">
            <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
            <span className="w-1 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          </span>
        </div>
      )}

      {/* Error toast */}
      {error && !isListening && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl px-3 py-1.5 shadow border border-orange-100 whitespace-nowrap">
          <span className="text-[11px] text-orange-500">{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-1 text-orange-400 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fallback text input when speech not available */}
      {showFallbackInput && (
        <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1">
          <input
            ref={fallbackRef}
            type="text"
            placeholder="输入你想说的..."
            onKeyDown={(e) => e.key === 'Enter' && handleFallbackSubmit()}
            className="w-36 h-8 px-2 text-xs bg-transparent border-none outline-none text-text-primary"
          />
          <button
            onClick={handleFallbackSubmit}
            className="h-7 px-2 bg-sky-blue text-white rounded-lg text-xs active:scale-95"
          >
            确定
          </button>
          <button
            onClick={() => setShowFallbackInput(false)}
            className="h-7 w-7 flex items-center justify-center text-gray-400 text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
