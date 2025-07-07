
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'HairProfit | All-in-One Toolkit for the Hair Industry'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'hsl(49, 58%, 96%)', // background color
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{
          background: 'hsla(47, 100%, 50%, 0.15)',
          padding: '32px',
          borderRadius: '24px',
          border: '2px solid hsla(47, 100%, 50%, 0.2)'
        }}>
             <svg
                xmlns="http://www.w3.org/2000/svg"
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(47, 100%, 50%)" // primary color
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3-1.91 4.82-4.82 1.91 4.82 1.91L12 16l1.91-4.82 4.82-1.91-4.82-1.91L12 3z"/>
                <path d="M5 22v-5"/>
                <path d="m5 3-1.91 4.82-4.82 1.91 4.82 1.91L5 16l1.91-4.82 4.82-1.91-4.82-1.91L5 3z"/>
                <path d="m19 22-1.91-4.82-4.82-1.91 4.82 1.91L19 8l1.91 4.82 4.82 1.91-4.82-1.91L19 22z"/>
             </svg>
        </div>
        <h1
          style={{
            fontSize: '96px',
            fontWeight: '700',
            color: 'hsl(30, 10%, 20%)', // foreground color
          }}
        >
          HairProfit
        </h1>
      </div>
    ),
    {
      ...size,
    }
  )
}
