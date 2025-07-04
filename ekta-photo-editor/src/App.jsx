import { useState, useRef, useEffect } from 'react'
import { Upload, Download, RotateCw, Crop, Sliders, Palette, Sun, Contrast, Zap, Thermometer, Focus, Sparkles, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Card } from '@/components/ui/card.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import './App.css'

function App() {
  const [image, setImage] = useState(null)
  const [originalImage, setOriginalImage] = useState(null)
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    sharpness: 0,
    grain: 0,
    vignette: 0
  })
  const [activeFilter, setActiveFilter] = useState('none')
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const filters = [
    { id: 'none', name: 'Original', icon: Circle },
    { id: 'bw1', name: 'B&W Classic', icon: Circle },
    { id: 'bw2', name: 'B&W Contrast', icon: Circle },
    { id: 'sepia', name: 'Sepia', icon: Circle },
    { id: 'vintage', name: 'Vintage', icon: Circle }
  ]

  const adjustmentControls = [
    { key: 'brightness', name: 'Brightness', icon: Sun, min: -100, max: 100 },
    { key: 'contrast', name: 'Contrast', icon: Contrast, min: -100, max: 100 },
    { key: 'saturation', name: 'Saturation', icon: Palette, min: -100, max: 100 },
    { key: 'exposure', name: 'Exposure', icon: Zap, min: -100, max: 100 },
    { key: 'temperature', name: 'Temperature', icon: Thermometer, min: -100, max: 100 },
    { key: 'sharpness', name: 'Sharpness', icon: Focus, min: -100, max: 100 },
    { key: 'grain', name: 'Grain', icon: Sparkles, min: 0, max: 100 },
    { key: 'vignette', name: 'Vignette', icon: Circle, min: 0, max: 100 }
  ]

  // Apply image processing effects
  const applyImageEffects = () => {
    const canvas = canvasRef.current
    if (!canvas || !originalImage) return

    const ctx = canvas.getContext('2d')
    const { width, height } = canvas
    
    // Clear and redraw original image
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(originalImage, 0, 0, width, height)
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    // Apply filter first
    applyFilter(data, activeFilter)
    
    // Apply adjustments
    applyAdjustments(data, adjustments)
    
    // Apply grain effect
    if (adjustments.grain > 0) {
      applyGrain(data, adjustments.grain)
    }
    
    // Apply vignette effect
    if (adjustments.vignette > 0) {
      applyVignette(data, width, height, adjustments.vignette)
    }
    
    // Put the modified image data back to canvas
    ctx.putImageData(imageData, 0, 0)
  }

  const applyFilter = (data, filterId) => {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      switch (filterId) {
        case 'bw1': // B&W Classic
          const gray1 = 0.299 * r + 0.587 * g + 0.114 * b
          data[i] = gray1
          data[i + 1] = gray1
          data[i + 2] = gray1
          break
          
        case 'bw2': // B&W Contrast
          const gray2 = 0.299 * r + 0.587 * g + 0.114 * b
          const contrast = gray2 > 128 ? Math.min(255, gray2 * 1.3) : Math.max(0, gray2 * 0.7)
          data[i] = contrast
          data[i + 1] = contrast
          data[i + 2] = contrast
          break
          
        case 'sepia':
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
          break
          
        case 'vintage':
          // Vintage effect with warm tones and reduced saturation
          const avg = (r + g + b) / 3
          data[i] = Math.min(255, avg + (r - avg) * 0.6 + 20) // Add warmth
          data[i + 1] = Math.min(255, avg + (g - avg) * 0.5 + 10)
          data[i + 2] = Math.max(0, avg + (b - avg) * 0.4 - 10) // Reduce blue
          break
      }
    }
  }

  const applyAdjustments = (data, adj) => {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
      
      // Brightness
      if (adj.brightness !== 0) {
        const brightness = adj.brightness * 2.55 // Convert to 0-255 range
        r = Math.max(0, Math.min(255, r + brightness))
        g = Math.max(0, Math.min(255, g + brightness))
        b = Math.max(0, Math.min(255, b + brightness))
      }
      
      // Contrast
      if (adj.contrast !== 0) {
        const contrast = (adj.contrast + 100) / 100
        r = Math.max(0, Math.min(255, ((r - 128) * contrast) + 128))
        g = Math.max(0, Math.min(255, ((g - 128) * contrast) + 128))
        b = Math.max(0, Math.min(255, ((b - 128) * contrast) + 128))
      }
      
      // Saturation
      if (adj.saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const saturation = (adj.saturation + 100) / 100
        r = Math.max(0, Math.min(255, gray + (r - gray) * saturation))
        g = Math.max(0, Math.min(255, gray + (g - gray) * saturation))
        b = Math.max(0, Math.min(255, gray + (b - gray) * saturation))
      }
      
      // Exposure
      if (adj.exposure !== 0) {
        const exposure = Math.pow(2, adj.exposure / 100)
        r = Math.max(0, Math.min(255, r * exposure))
        g = Math.max(0, Math.min(255, g * exposure))
        b = Math.max(0, Math.min(255, b * exposure))
      }
      
      // Temperature (warm/cool)
      if (adj.temperature !== 0) {
        const temp = adj.temperature / 100
        if (temp > 0) { // Warmer
          r = Math.max(0, Math.min(255, r + temp * 30))
          b = Math.max(0, Math.min(255, b - temp * 20))
        } else { // Cooler
          r = Math.max(0, Math.min(255, r + temp * 20))
          b = Math.max(0, Math.min(255, b - temp * 30))
        }
      }
      
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
  }

  const applyGrain = (data, intensity) => {
    const grainAmount = intensity / 100 * 50
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * grainAmount
      data[i] = Math.max(0, Math.min(255, data[i] + noise))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
    }
  }

  const applyVignette = (data, width, height, intensity) => {
    const centerX = width / 2
    const centerY = height / 2
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
    const vignetteStrength = intensity / 100
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const vignette = 1 - (distance / maxDistance) * vignetteStrength
        const factor = Math.max(0, vignette)
        
        const index = (y * width + x) * 4
        data[index] *= factor     // R
        data[index + 1] *= factor // G
        data[index + 2] *= factor // B
      }
    }
  }

  // Effect to apply changes when adjustments or filter change
  useEffect(() => {
    if (originalImage) {
      applyImageEffects()
    }
  }, [adjustments, activeFilter, originalImage])

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setImage(img)
          setOriginalImage(img)
          drawImageToCanvas(img)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const drawImageToCanvas = (img) => {
    const canvas = canvasRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    const maxWidth = 800
    const maxHeight = 600
    
    let { width, height } = img
    
    // Calculate aspect ratio and resize if needed
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width *= ratio
      height *= ratio
    }
    
    canvas.width = width
    canvas.height = height
    
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'ekta-edited-photo.jpg'
    link.href = canvas.toDataURL('image/jpeg', 0.9)
    link.click()
  }

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      temperature: 0,
      sharpness: 0,
      grain: 0,
      vignette: 0
    })
    setActiveFilter('none')
  }

  const handleRotate = () => {
    const canvas = canvasRef.current
    if (!canvas || !originalImage) return

    const ctx = canvas.getContext('2d')
    const { width, height } = canvas
    
    // Create temporary canvas for rotation
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    tempCanvas.width = height
    tempCanvas.height = width
    
    // Rotate 90 degrees clockwise
    tempCtx.translate(height / 2, width / 2)
    tempCtx.rotate(Math.PI / 2)
    tempCtx.drawImage(canvas, -width / 2, -height / 2)
    
    // Update canvas dimensions
    canvas.width = height
    canvas.height = width
    
    // Draw rotated image back to main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(tempCanvas, 0, 0)
    
    // Create new image from rotated canvas for future operations
    const rotatedImg = new Image()
    rotatedImg.onload = () => {
      setOriginalImage(rotatedImg)
    }
    rotatedImg.src = canvas.toDataURL()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4" role="banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ekta Premium Photo Editor</h1>
          <nav role="navigation" aria-label="Main actions">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-gray-600 hover:border-gray-500"
                aria-label="Upload a photo to start editing"
              >
                <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                Upload Photo
              </Button>
              {image && (
                <Button
                  onClick={handleDownload}
                  className="bg-white text-black hover:bg-gray-200"
                  aria-label="Download edited photo"
                >
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  Download
                </Button>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4" role="main">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Canvas Area */}
          <section className="lg:col-span-3" aria-label="Photo editing canvas">
            <Card className="bg-gray-900 border-gray-700 p-6">
              <div className="flex items-center justify-center min-h-[400px] bg-gray-800 rounded-lg">
                {image ? (
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[600px] rounded-lg shadow-lg"
                    aria-label="Photo being edited"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <p className="text-lg mb-2">Upload a photo to start editing</p>
                    <p className="text-sm">Supports JPG, PNG, and WebP formats</p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 border-gray-600 hover:border-gray-500"
                      aria-label="Choose file to upload"
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* Controls Panel */}
          <aside className="space-y-6" role="complementary" aria-label="Photo editing controls">
            {/* Filters */}
            <section aria-labelledby="filters-heading">
              <Card className="bg-gray-900 border-gray-700 p-4">
                <h2 id="filters-heading" className="text-lg font-semibold mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2" aria-hidden="true" />
                  Filters
                </h2>
                <div className="grid grid-cols-1 gap-2" role="group" aria-label="Photo filters">
                  {filters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "default" : "outline"}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`justify-start ${
                        activeFilter === filter.id
                          ? "bg-white text-black"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      disabled={!image}
                      aria-pressed={activeFilter === filter.id}
                      aria-label={`Apply ${filter.name} filter`}
                    >
                      <filter.icon className="w-4 h-4 mr-2" aria-hidden="true" />
                      {filter.name}
                    </Button>
                  ))}
                </div>
              </Card>
            </section>

            {/* Adjustments */}
            <section aria-labelledby="adjustments-heading">
              <Card className="bg-gray-900 border-gray-700 p-4">
                <h2 id="adjustments-heading" className="text-lg font-semibold mb-4 flex items-center">
                  <Sliders className="w-5 h-5 mr-2" aria-hidden="true" />
                  Adjustments
                </h2>
                <div className="space-y-4" role="group" aria-label="Photo adjustments">
                  {adjustmentControls.map((control) => (
                    <div key={control.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label 
                          htmlFor={`${control.key}-slider`}
                          className="text-sm font-medium flex items-center"
                        >
                          <control.icon className="w-4 h-4 mr-2" aria-hidden="true" />
                          {control.name}
                        </label>
                        <span className="text-xs text-gray-400" aria-live="polite">
                          {adjustments[control.key]}
                        </span>
                      </div>
                      <Slider
                        id={`${control.key}-slider`}
                        value={[adjustments[control.key]]}
                        onValueChange={(value) =>
                          setAdjustments(prev => ({ ...prev, [control.key]: value[0] }))
                        }
                        min={control.min}
                        max={control.max}
                        step={1}
                        disabled={!image}
                        className="w-full"
                        aria-label={`Adjust ${control.name} from ${control.min} to ${control.max}`}
                      />
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4 bg-gray-700" />
                
                <Button
                  variant="outline"
                  onClick={resetAdjustments}
                  disabled={!image}
                  className="w-full border-gray-600 hover:border-gray-500"
                  aria-label="Reset all adjustments to default values"
                >
                  Reset All
                </Button>
              </Card>
            </section>

            {/* Tools */}
            <section aria-labelledby="tools-heading">
              <Card className="bg-gray-900 border-gray-700 p-4">
                <h2 id="tools-heading" className="text-lg font-semibold mb-4">Tools</h2>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Photo editing tools">
                  <Button
                    variant="outline"
                    onClick={handleRotate}
                    disabled={!image}
                    className="border-gray-600 hover:border-gray-500"
                    aria-label="Rotate photo 90 degrees clockwise"
                  >
                    <RotateCw className="w-4 h-4 mr-2" aria-hidden="true" />
                    Rotate
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!image}
                    className="border-gray-600 hover:border-gray-500"
                    aria-label="Crop photo (coming soon)"
                  >
                    <Crop className="w-4 h-4 mr-2" aria-hidden="true" />
                    Crop
                  </Button>
                </div>
              </Card>
            </section>
          </aside>
        </div>
      </main>

      {/* Footer - Ad Space */}
      <footer className="border-t border-gray-800 mt-12 p-4" role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-2">Advertisement</p>
            <div className="h-20 bg-gray-800 rounded flex items-center justify-center" aria-label="Advertisement space">
              <span className="text-gray-500 text-sm">Ad Space - 728x90</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-label="File input for photo upload"
      />
    </div>
  )
}

export default App

