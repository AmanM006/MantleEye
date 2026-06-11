'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

const ShaderGradientCanvas = dynamic(
  () => import('@shadergradient/react').then((mod) => mod.ShaderGradientCanvas),
  { ssr: false }
)
const ShaderGradient = dynamic(
  () => import('@shadergradient/react').then((mod) => mod.ShaderGradient),
  { ssr: false }
)

export default function GlobalShaderGradient() {
  const pathname = usePathname()
  const [activeDesign, setActiveDesign] = useState<string>('3')

  useEffect(() => {
    // Read the active design from body data attribute
    const updateDesign = () => {
      const design = document.body.getAttribute('data-active-design') || '3'
      setActiveDesign(design)
    }

    // Initialize
    updateDesign()

    // Observe attribute changes on document.body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-active-design') {
          updateDesign()
        }
      })
    })

    observer.observe(document.body, { attributes: true })
    return () => observer.disconnect()
  }, [])

  // Show only on home page '/' and when design is 3 (Obsidian Minimal)
  const isVisible = pathname === '/' && activeDesign === '3'

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 pointer-events-none z-0",
          isVisible ? "opacity-100 transition-opacity duration-500" : "opacity-0"
        )}
        style={{
          visibility: isVisible ? 'visible' : 'hidden',
          transition: isVisible ? 'opacity 0.5s ease, visibility 0.5s ease' : 'none'
        }}
      >
        <ShaderGradientCanvas style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <ShaderGradient
            {...({
              animate: "on",
              axesHelper: "off",
              brightness: 1.2,
              cAzimuthAngle: 180,
              cDistance: 3.6,
              cPolarAngle: 90,
              cameraZoom: 1,
              color1: "#4c1d95",
              color2: "#2563eb",
              color3: "#0f172a",

              destination: "onCanvas",
              embedMode: "off",
              envPreset: "city",
              format: "gif",
              fov: 45,
              frameRate: 10,
              gizmoHelper: "hide",
              grain: "on",
              lightType: "3d",
              loop: "on",
              loopDuration: 10,
              pixelDensity: 1,
              positionX: -1.4,
              positionY: 0,
              positionZ: 0,
              range: "enabled",
              rangeEnd: 10,
              rangeStart: 0,
              reflection: 0.1,
              rotationX: 0,
              rotationY: 10,
              rotationZ: 50,
              shader: "defaults",
              toggleAxis: false,
              type: "plane",
              uAmplitude: 1,
              uDensity: 1.3,
              uFrequency: 5.5,
              uSpeed: 0.2,
              uStrength: 4,
              uTime: 0,
              wireframe: false,
              zoomOut: false
            } as any)}
          />
        </ShaderGradientCanvas>
      </div>
      <div
        className={cn(
          "fixed inset-0 pointer-events-none noise-overlay mix-blend-overlay z-0",
          isVisible ? "opacity-[0.15] transition-opacity duration-500" : "opacity-0"
        )}
        style={{
          visibility: isVisible ? 'visible' : 'hidden',
          transition: isVisible ? 'opacity 0.5s ease, visibility 0.5s ease' : 'none'
        }}
      />
    </>
  )
}
